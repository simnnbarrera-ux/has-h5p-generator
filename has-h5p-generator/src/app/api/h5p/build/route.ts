import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { getRequestUser, getTrustedClientIp } from "@/lib/api-auth";
import {
  buildH5pPackageFromSpec,
  type HasProjectSpec,
} from "@/lib/h5p-engine";
import { synthesizeEdgeTtsMp3 } from "@/lib/tts-server";
import {
  checkAndLogRateLimit,
  getProjectForUser,
  loadH5pTemplateBuffer,
  saveProjectToDb,
  uploadH5pPackageToSupabase,
} from "@/lib/supabase-server";
import { uploadH5pPreviewAssetsToSupabase } from "@/lib/h5p-preview-storage";
import type { HasProjectRecord } from "@/lib/supabase";
import {
  createPreviewToken,
  PREVIEW_COOKIE_NAME,
  PREVIEW_TOKEN_TTL_SECONDS,
} from "@/lib/preview-token";
import {
  ProjectValidationError,
  readBoundedJson,
  validateProjectSpec,
} from "@/lib/project-validation";
import { toClientProjectRecord } from "@/lib/project-serializers";
import { removeStoredH5pPackage } from "@/lib/package-storage-cleanup";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const user = await getRequestUser(req);
  if (!user) {
    return NextResponse.json(
      { error: "Inicia sesión para compilar un recurso." },
      { status: 401 }
    );
  }

  try {
    const body = await readBoundedJson<{
      spec?: unknown;
      synthesizeAudio?: boolean;
    }>(req, 1_000_000);

    const workingSpec: HasProjectSpec = validateProjectSpec(body.spec);
    const synthesizeAudio = body.synthesizeAudio !== false;

    const ip = getTrustedClientIp(req);
    const rateCheck = await checkAndLogRateLimit({
      userId: user.id,
      userEmail: user.email || "",
      ipAddress: ip,
      actionType: "h5p_build",
      modelUsed: "has-h5p-compiler-1.27",
      tokensEstimated: 200,
    });

    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: rateCheck.reason || "Límite de compilaciones excedido." },
        { status: 429 }
      );
    }

    // 1. Cargar la base H5P elegida en el Paso 4, separada de la paleta global.
    const templateBuffer = await loadH5pTemplateBuffer(workingSpec.baseTemplateId);

    // 2. Sintetizar narración de audio si aplica
    const audioAssets = new Map<string, Buffer>();
    for (const slide of workingSpec.slides) {
      if (slide.audioNarration?.text) {
        const relAudioPath = `audios/narration-${slide.id}.mp3`;
        if (synthesizeAudio) {
          try {
            const voice =
              slide.audioNarration.voice ||
              workingSpec.defaultVoice ||
              "es-CO-SalomeNeural";
            const { buffer } = await synthesizeEdgeTtsMp3(
              slide.audioNarration.text,
              voice
            );
            slide.audioNarration.audioFilePath = relAudioPath;
            audioAssets.set(relAudioPath, buffer);
          } catch (ttsErr: unknown) {
            console.warn(
              `[H5P Build] Locución académica no disponible para diapositiva ${slide.id}:`,
              ttsErr instanceof Error ? ttsErr.message : String(ttsErr)
            );
          }
        }
      }
    }

    // 3. Compilar paquete H5P
    const buildResult = await buildH5pPackageFromSpec(
      workingSpec,
      audioAssets,
      templateBuffer,
      (svgContent) =>
        sharp(Buffer.from(svgContent, "utf-8"))
          .png({ quality: 95 })
          .toBuffer()
    );

    // 4. Subir paquete privado a Supabase Cloud Storage si está disponible
    const previousProject = await getProjectForUser(workingSpec.id, user.id);
    let storagePath: string | null = null;
    let previewAssetPaths: string[] = [];
    try {
      storagePath = await uploadH5pPackageToSupabase(
        user.id,
        workingSpec.id,
        buildResult.h5pBuffer
      );
      previewAssetPaths = await uploadH5pPreviewAssetsToSupabase(
        user.id,
        workingSpec.id,
        storagePath,
        buildResult.h5pBuffer
      );
    } catch (storageErr) {
      if (storagePath) {
        try {
          await removeStoredH5pPackage(user.id, workingSpec.id, storagePath, previewAssetPaths);
        } catch (cleanupErr) {
          console.warn(
            "[H5P Build] No se pudieron limpiar los archivos temporales de la compilación:",
            cleanupErr instanceof Error ? cleanupErr.name : "UnknownError"
          );
        }
      }
      console.error(
        "[H5P Build] Private package upload failed:",
        storageErr instanceof Error ? storageErr.name : "UnknownError"
      );
      return NextResponse.json(
        { error: "El paquete se generó, pero no se pudieron guardar sus archivos de vista previa privados. No se guardaron los cambios; inténtalo de nuevo más tarde." },
        { status: 503, headers: { "Cache-Control": "private, no-store" } }
      );
    }

    if (!storagePath) throw new Error("No se obtuvo una ruta de Storage para el paquete generado.");

    // 5. Persistir registro en base de datos
    const now = new Date().toISOString();
    const record: HasProjectRecord = {
      id: workingSpec.id,
      auth_user_id: user.id,
      user_email: user.email || "",
      title: workingSpec.title,
      course_name: workingSpec.courseName,
      module_name: workingSpec.moduleName,
      activity_number: workingSpec.activityNumber || 1,
      template_id: workingSpec.templateId || "plantilla-1",
      project_spec: workingSpec,
      ph5p_script: buildResult.ph5pScript,
      moodle_book: buildResult.moodleBook,
      audit_report: workingSpec.auditReport || [],
      package_url: `/api/h5p/download?id=${encodeURIComponent(workingSpec.id)}`,
      storage_path: storagePath,
      slides_count: buildResult.slidesCount,
      interactions_count: buildResult.interactionsCount,
      status: "ready",
      created_at: now,
      updated_at: now,
    };
    let saved: HasProjectRecord;
    try {
      saved = await saveProjectToDb(record, user.id);
    } catch (saveErr) {
      try {
        await removeStoredH5pPackage(user.id, workingSpec.id, storagePath, previewAssetPaths);
      } catch (cleanupErr) {
        console.warn(
          "[H5P Build] Could not remove the unreferenced package after a failed project save:",
          cleanupErr instanceof Error ? cleanupErr.name : "UnknownError"
        );
      }
      throw saveErr;
    }

    if (previousProject?.storage_path && previousProject.storage_path !== storagePath) {
      try {
        await removeStoredH5pPackage(user.id, workingSpec.id, previousProject.storage_path);
      } catch (cleanupErr) {
        console.warn(
          "[H5P Build] No se pudo limpiar la versión anterior del paquete:",
          cleanupErr instanceof Error ? cleanupErr.name : "UnknownError"
        );
      }
    }

    // 6. Generar cookie de autorización para previsualización segura
    const previewToken = createPreviewToken(user.id, workingSpec.id);
    const response = NextResponse.json({
      success: true,
      projectId: workingSpec.id,
      project: toClientProjectRecord(saved),
      downloadUrl: `/api/h5p/download?id=${encodeURIComponent(workingSpec.id)}`,
      previewPath: buildResult.previewPath,
      slidesCount: buildResult.slidesCount,
      interactionsCount: buildResult.interactionsCount,
      audiosSynthesized: audioAssets.size,
      ph5pScript: buildResult.ph5pScript,
      moodleBook: buildResult.moodleBook,
      remainingToday: rateCheck.remainingToday,
      dailyQuota: rateCheck.dailyQuota,
    });

    response.cookies.set(PREVIEW_COOKIE_NAME, previewToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/h5p-preview",
      maxAge: PREVIEW_TOKEN_TTL_SECONDS,
    });

    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch (err: unknown) {
    console.error("[/api/h5p/build Error]", err);
    const isInputError = err instanceof ProjectValidationError;
    return NextResponse.json(
      {
        error: isInputError
          ? err.message
          : "No fue posible compilar el paquete H5P. Revisa la configuración del servidor y la plantilla.",
      },
      { status: isInputError ? 400 : 503 }
    );
  }
}
