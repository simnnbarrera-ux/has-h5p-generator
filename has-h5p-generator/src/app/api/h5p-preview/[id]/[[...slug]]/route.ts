import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { createHash, randomUUID } from "node:crypto";
import JSZip from "jszip";
import { getProjectForUser, downloadH5pPackageFromSupabase } from "@/lib/supabase-server";
import { downloadH5pPreviewAssetFromSupabase } from "@/lib/h5p-preview-storage";
import { PREVIEW_COOKIE_NAME, verifyPreviewToken } from "@/lib/preview-token";
import { isSafeProjectId } from "@/lib/project-validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const PUBLIC_DEMOS: Record<string, string> = {
  "matematicas-discretas-act1": "matematicas-discretas-act1",
  "matematicas-discretas-act0": "matematicas-discretas-act0",
};
const MAX_ENTRIES = 2_500;
const MAX_ENTRY_BYTES = 30 * 1024 * 1024;
const MAX_TOTAL_BYTES = 150 * 1024 * 1024;
const COMPLETE_MARKER = ".preview-complete";
const EXTRACTION_LOCKS = new Map<string, Promise<void>>();
const SAFE_EXTENSIONS = new Set([
  ".json", ".png", ".jpg", ".jpeg", ".gif", ".webp", ".mp3", ".wav", ".ogg",
  ".m4a", ".mp4", ".webm", ".vtt", ".pdf", ".txt", ".woff", ".woff2", ".ttf", ".otf",
]);

function isInside(base: string, candidate: string): boolean {
  const relative = path.relative(path.resolve(base), path.resolve(candidate));
  return relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative));
}

function errorResponse(message: string, status: number): NextResponse {
  return NextResponse.json(
    { error: message },
    { status, headers: { "Cache-Control": "private, no-store, max-age=0" } }
  );
}

function safeRelativePath(slug?: string[]): string | null {
  const segments = slug && slug.length ? slug : ["h5p.json"];
  if (segments.length > 12) return null;
  if (segments.some((segment) => !/^[A-Za-z0-9_.-]{1,150}$/.test(segment) || segment === "." || segment === "..")) return null;
  const relative = segments.join("/");
  if (relative.startsWith("/") || relative.includes("\\")) return null;
  const extension = path.extname(relative).toLowerCase();
  if (!SAFE_EXTENSIONS.has(extension)) return null;
  return relative;
}

function contentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const types: Record<string, string> = {
    ".json": "application/json; charset=utf-8", ".png": "image/png", ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg", ".gif": "image/gif", ".webp": "image/webp", ".mp3": "audio/mpeg",
    ".wav": "audio/wav", ".ogg": "audio/ogg", ".m4a": "audio/mp4", ".mp4": "video/mp4",
    ".webm": "video/webm", ".vtt": "text/vtt; charset=utf-8", ".pdf": "application/pdf",
    ".txt": "text/plain; charset=utf-8", ".woff": "font/woff", ".woff2": "font/woff2",
    ".ttf": "font/ttf", ".otf": "font/otf",
  };
  return types[ext] || "application/octet-stream";
}

async function unpackPrivatePackage(projectId: string, ownerId: string, targetDir: string, storagePath?: string | null): Promise<void> {
  const completionMarker = path.join(targetDir, COMPLETE_MARKER);
  if (fs.existsSync(completionMarker)) return;
  const lockKey = `${ownerId}:${projectId}:${createHash("sha256").update(storagePath || "legacy").digest("hex").slice(0, 16)}`;
  const pending = EXTRACTION_LOCKS.get(lockKey);
  if (pending) return pending;

  const task = (async () => {
    const stagingDir = `${targetDir}.staging-${randomUUID()}`;
    fs.mkdirSync(path.dirname(targetDir), { recursive: true });
    fs.rmSync(stagingDir, { recursive: true, force: true });
    fs.mkdirSync(stagingDir, { recursive: true });
    try {
      const buffer = await downloadH5pPackageFromSupabase(ownerId, projectId, storagePath);
      const zip = await JSZip.loadAsync(buffer);
      const names = Object.keys(zip.files);
      if (names.length > MAX_ENTRIES) throw new Error("ZIP con demasiados archivos.");
      const root = path.resolve(stagingDir);
      let expandedTotal = 0;
      for (const [rawName, entry] of Object.entries(zip.files)) {
        if (entry.dir) continue;
        const normalized = rawName.replace(/\\/g, "/");
        if (
          normalized.startsWith("/") ||
          /^[A-Za-z]:/.test(normalized) ||
          normalized.split("/").some((part) => part === ".." || part === ".") ||
          !(normalized === "h5p.json" || normalized.startsWith("content/"))
        ) throw new Error("El ZIP contiene una ruta no permitida.");
        if (normalized.toLowerCase().endsWith(".svg")) throw new Error("No se admiten SVG dentro del contenido H5P.");
        const expandedSize = Number((entry as any)._data?.uncompressedSize || 0);
        if (expandedSize > MAX_ENTRY_BYTES) throw new Error("El ZIP contiene un archivo demasiado grande.");
        expandedTotal += expandedSize;
        if (expandedTotal > MAX_TOTAL_BYTES) throw new Error("El ZIP supera el límite de expansión.");
        const target = path.resolve(root, ...normalized.split("/"));
        if (!isInside(root, target)) throw new Error("La ruta del ZIP sale del directorio permitido.");
        const fileBuffer = await entry.async("nodebuffer");
        if (fileBuffer.length > MAX_ENTRY_BYTES) throw new Error("El archivo descomprimido supera el límite.");
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, fileBuffer, { flag: "wx" });
      }
      if (!fs.existsSync(path.join(stagingDir, "h5p.json"))) throw new Error("El paquete no incluye h5p.json.");
      fs.writeFileSync(path.join(stagingDir, COMPLETE_MARKER), "ok", { flag: "wx" });
      fs.rmSync(targetDir, { recursive: true, force: true });
      fs.renameSync(stagingDir, targetDir);
    } catch (error) {
      fs.rmSync(stagingDir, { recursive: true, force: true });
      throw error;
    }
  })();
  EXTRACTION_LOCKS.set(lockKey, task);
  try {
    await task;
  } finally {
    EXTRACTION_LOCKS.delete(lockKey);
  }
}

function serveFile(candidate: string): NextResponse | null {
  if (!fs.existsSync(candidate) || !fs.statSync(candidate).isFile()) return null;
  const buffer = fs.readFileSync(candidate);
  return serveBuffer(candidate, buffer);
}

function serveBuffer(filePath: string, buffer: Buffer): NextResponse {
  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": contentType(filePath),
      "Content-Length": String(buffer.length),
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  });
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string; slug?: string[] }> }
) {
  try {
    const { id, slug } = await context.params;
    if (!isSafeProjectId(id)) return errorResponse("Identificador no válido.", 400);

    if (Object.prototype.hasOwnProperty.call(PUBLIC_DEMOS, id)) {
      const relative = safeRelativePath(slug);
      if (!relative) return errorResponse("Ruta de recurso no válida.", 400);
      const publicRoot = path.resolve(process.cwd(), "public", "preview-h5p", PUBLIC_DEMOS[id]);
      const candidate = path.resolve(publicRoot, ...relative.split("/"));
      if (!isInside(publicRoot, candidate)) return errorResponse("Ruta no válida.", 400);
      const response = serveFile(candidate);
      return response || errorResponse("Recurso de demostración no encontrado.", 404);
    }

    const token = verifyPreviewToken(req.cookies.get(PREVIEW_COOKIE_NAME)?.value, id);
    if (!token) {
      return errorResponse("La autorización de vista previa expiró o no llegó con la solicitud.", 401);
    }
    const project = await getProjectForUser(id, token.sub);
    if (!project || project.status !== "ready") return errorResponse("Recurso no encontrado.", 404);

    // Probe ligero para que el cliente confirme que el navegador guardó y envía la cookie
    // antes de montar H5PStandalone; no descomprime ni descarga el paquete.
    if (req.nextUrl.searchParams.get("__preview_check") === "1") {
      return NextResponse.json(
        { success: true },
        { headers: { "Cache-Control": "private, no-store, max-age=0" } }
      );
    }

    const relative = safeRelativePath(slug);
    if (!relative) return errorResponse("Ruta de recurso no válida.", 400);
    const storedAsset = await downloadH5pPreviewAssetFromSupabase(
      token.sub,
      id,
      project.storage_path,
      relative
    );
    if (storedAsset) return serveBuffer(relative, storedAsset);

    const cacheVersion = createHash("sha256").update(project.storage_path || "legacy").digest("hex").slice(0, 16);
    const root = path.resolve(os.tmpdir(), "preview-h5p", token.sub, id, cacheVersion);
    const candidate = path.resolve(root, ...relative.split("/"));
    if (!isInside(root, candidate)) return errorResponse("Ruta no válida.", 400);
    await unpackPrivatePackage(id, token.sub, root, project.storage_path);
    const response = serveFile(candidate);
    return response || errorResponse("Recurso del paquete no encontrado.", 404);
  } catch (error) {
    console.error(
      "[/api/h5p-preview] No fue posible servir el recurso:",
      error instanceof Error ? error.name : "UnknownError"
    );
    return errorResponse("No fue posible cargar la vista previa. Inténtalo de nuevo.", 503);
  }
}
