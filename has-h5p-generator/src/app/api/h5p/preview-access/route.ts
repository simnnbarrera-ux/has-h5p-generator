import { NextRequest, NextResponse } from "next/server";
import { getRequestUser } from "@/lib/api-auth";
import { getProjectForUser } from "@/lib/supabase-server";
import { createPreviewToken, PREVIEW_COOKIE_NAME, PREVIEW_TOKEN_TTL_SECONDS } from "@/lib/preview-token";
import { isSafeProjectId, ProjectValidationError, readBoundedJson } from "@/lib/project-validation";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const user = await getRequestUser(req);
  if (!user) return NextResponse.json({ error: "Se requiere una sesión válida." }, { status: 401 });

  try {
    const body = await readBoundedJson<{ projectId?: unknown }>(req, 2_048);
    if (!isSafeProjectId(body.projectId)) {
      return NextResponse.json({ error: "Identificador de proyecto no válido." }, { status: 400 });
    }
    const project = await getProjectForUser(body.projectId, user.id);
    if (!project || project.status !== "ready") {
      return NextResponse.json({ error: "No se encontró un recurso listo para vista previa." }, { status: 404 });
    }

    const token = createPreviewToken(user.id, project.id);
    const response = NextResponse.json({ success: true });
    response.cookies.set(PREVIEW_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/h5p-preview",
      maxAge: PREVIEW_TOKEN_TTL_SECONDS,
    });
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch (error) {
    console.error("[/api/h5p/preview-access]", error);
    return error instanceof ProjectValidationError
      ? NextResponse.json({ error: error.message }, { status: 400 })
      : NextResponse.json({ error: "No fue posible autorizar la vista previa." }, { status: 503 });
  }
}
