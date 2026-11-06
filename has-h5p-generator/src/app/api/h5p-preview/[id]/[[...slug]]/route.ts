import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { createHash } from "node:crypto";
import JSZip from "jszip";
import { getProjectForUser, downloadH5pPackageFromSupabase } from "@/lib/supabase-server";
import { PREVIEW_COOKIE_NAME, verifyPreviewToken } from "@/lib/preview-token";
import { isSafeProjectId } from "@/lib/project-validation";

export const runtime = "nodejs";

const PUBLIC_DEMOS: Record<string, string> = {
  "matematicas-discretas-act1": "matematicas-discretas-act1",
  "matematicas-discretas-act0": "matematicas-discretas-act0",
};
const MAX_ENTRIES = 2_500;
const MAX_ENTRY_BYTES = 30 * 1024 * 1024;
const MAX_TOTAL_BYTES = 150 * 1024 * 1024;
const EXTRACTION_LOCKS = new Map<string, Promise<void>>();
const SAFE_EXTENSIONS = new Set([
  ".json", ".png", ".jpg", ".jpeg", ".gif", ".webp", ".mp3", ".wav", ".ogg",
  ".m4a", ".mp4", ".webm", ".vtt", ".pdf", ".txt", ".woff", ".woff2", ".ttf", ".otf",
]);

function isInside(base: string, candidate: string): boolean {
  const relative = path.relative(path.resolve(base), path.resolve(candidate));
  return relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative));
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
  const cachedManifest = path.join(targetDir, "h5p.json");
  if (fs.existsSync(cachedManifest)) return;
  const lockKey = `${ownerId}:${projectId}:${createHash("sha256").update(storagePath || "legacy").digest("hex").slice(0, 16)}`;
  const pending = EXTRACTION_LOCKS.get(lockKey);
  if (pending) return pending;

  const task = (async () => {
    const buffer = await downloadH5pPackageFromSupabase(ownerId, projectId, storagePath);
    const zip = await JSZip.loadAsync(buffer);
    const names = Object.keys(zip.files);
    if (names.length > MAX_ENTRIES) throw new Error("ZIP con demasiados archivos.");
    const root = path.resolve(targetDir);
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
      fs.writeFileSync(target, fileBuffer, { flag: "w" });
    }
    if (!fs.existsSync(cachedManifest)) throw new Error("El paquete no incluye h5p.json.");
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
  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": contentType(candidate),
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
    if (!isSafeProjectId(id)) return NextResponse.json({ error: "Identificador no válido." }, { status: 400 });
    const relative = safeRelativePath(slug);
    if (!relative) return NextResponse.json({ error: "Ruta de recurso no válida." }, { status: 400 });

    if (Object.prototype.hasOwnProperty.call(PUBLIC_DEMOS, id)) {
      const publicRoot = path.resolve(process.cwd(), "public", "preview-h5p", PUBLIC_DEMOS[id]);
      const candidate = path.resolve(publicRoot, ...relative.split("/"));
      if (!isInside(publicRoot, candidate)) return NextResponse.json({ error: "Ruta no válida." }, { status: 400 });
      const response = serveFile(candidate);
      return response || NextResponse.json({ error: "Recurso de demostración no encontrado." }, { status: 404 });
    }

    const token = verifyPreviewToken(req.cookies.get(PREVIEW_COOKIE_NAME)?.value, id);
    if (!token) return NextResponse.json({ error: "La vista previa expiró; vuelve a abrirla desde el proyecto." }, { status: 401 });
    const project = await getProjectForUser(id, token.sub);
    if (!project || project.status !== "ready") return NextResponse.json({ error: "Recurso no encontrado." }, { status: 404 });

    const cacheVersion = createHash("sha256").update(project.storage_path || "legacy").digest("hex").slice(0, 16);
    const root = path.resolve(os.tmpdir(), "preview-h5p", token.sub, id, cacheVersion);
    const candidate = path.resolve(root, ...relative.split("/"));
    if (!isInside(root, candidate)) return NextResponse.json({ error: "Ruta no válida." }, { status: 400 });
    if (!fs.existsSync(path.join(root, "h5p.json"))) {
      await unpackPrivatePackage(id, token.sub, root, project.storage_path);
    }
    const response = serveFile(candidate);
    return response || NextResponse.json({ error: "Recurso del paquete no encontrado." }, { status: 404 });
  } catch (error) {
    console.error("[/api/h5p-preview]", error);
    return NextResponse.json({ error: "No fue posible cargar la vista previa." }, { status: 503 });
  }
}
