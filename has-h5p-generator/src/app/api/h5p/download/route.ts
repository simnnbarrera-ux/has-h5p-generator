import { NextRequest, NextResponse } from "next/server";
import { getRequestUser } from "@/lib/api-auth";
import {
  downloadH5pPackageFromSupabase,
  getProjectForUser,
  getSupabaseAdmin,
  H5P_STORAGE_BUCKET,
} from "@/lib/supabase-server";
import { isSafeProjectId } from "@/lib/project-validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const PUBLIC_DEMO_IDS = new Set(["matematicas-discretas-act0", "matematicas-discretas-act1"]);
const MAX_PACKAGE_BYTES = 100 * 1024 * 1024;

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}

function packageResponse(buffer: Buffer, id: string) {
  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Length": String(buffer.length),
      "Content-Disposition": `attachment; filename="${id}.h5p"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!isSafeProjectId(id)) {
    return errorResponse("Identificador de proyecto no válido.", 400);
  }

  try {
    if (PUBLIC_DEMO_IDS.has(id)) {
      const { data, error } = await getSupabaseAdmin()
        .storage.from(H5P_STORAGE_BUCKET).download(`packages/${id}.h5p`);
      if (!error && data) {
        const buffer = Buffer.from(await data.arrayBuffer());
        if (buffer.length > 0 && buffer.length <= MAX_PACKAGE_BYTES) return packageResponse(buffer, id);
      }
      return errorResponse("El paquete de demostración no está publicado.", 404);
    }

    const user = await getRequestUser(req);
    if (!user) return errorResponse("Se requiere una sesión válida.", 401);
    const project = await getProjectForUser(id, user.id);
    if (!project || project.status !== "ready") {
      return errorResponse("No se encontró el paquete solicitado.", 404);
    }
    const buffer = await downloadH5pPackageFromSupabase(user.id, id, project.storage_path);
    return packageResponse(buffer, id);
  } catch (error) {
    console.error("[/api/h5p/download]", error);
    return errorResponse("No fue posible recuperar el paquete.", 503);
  }
}
