import "server-only";

import JSZip from "jszip";
import path from "node:path";
import { getSupabaseAdmin, H5P_STORAGE_BUCKET } from "@/lib/supabase-server";
import { isH5pPreviewAssetPath } from "@/lib/h5p-preview-assets";

const MAX_ENTRIES = 2_500;
const MAX_ENTRY_BYTES = 30 * 1024 * 1024;
const MAX_TOTAL_BYTES = 150 * 1024 * 1024;
const SAFE_EXTENSIONS = new Set([
  ".json", ".png", ".jpg", ".jpeg", ".gif", ".webp", ".mp3", ".wav", ".ogg",
  ".m4a", ".mp4", ".webm", ".vtt", ".pdf", ".txt", ".woff", ".woff2", ".ttf", ".otf",
]);
const CONTENT_TYPES: Record<string, string> = {
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".m4a": "audio/mp4",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".vtt": "text/vtt; charset=utf-8",
  ".pdf": "application/pdf",
  ".txt": "text/plain; charset=utf-8",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
};

function previewPrefix(ownerId: string, projectId: string, storagePath?: string | null): string | null {
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(ownerId) || !/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/.test(projectId)) {
    throw new Error("El propietario o proyecto no es válido para el preview H5P.");
  }
  const legacyPath = `packages/${ownerId}/${projectId}.h5p`;
  if (!storagePath || storagePath === legacyPath) return null;
  const versionPrefix = `packages/${ownerId}/${projectId}/`;
  const versionName = storagePath.startsWith(versionPrefix) ? storagePath.slice(versionPrefix.length) : "";
  if (!/^[A-Za-z0-9_-]{1,80}\.h5p$/.test(versionName)) {
    throw new Error("La versión del paquete no coincide con el propietario del proyecto.");
  }
  return `previews/${ownerId}/${projectId}/${versionName.slice(0, -4)}/`;
}

function safePreviewRelativePath(relativePath: string): boolean {
  if (relativePath.length > 1_500 || relativePath.startsWith("/") || relativePath.includes("\\")) return false;
  const segments = relativePath.split("/");
  if (segments.some((segment) => !/^[A-Za-z0-9_.-]{1,150}$/.test(segment) || segment === "." || segment === "..")) return false;
  if (!(relativePath === "h5p.json" || relativePath.startsWith("content/"))) return false;
  return SAFE_EXTENSIONS.has(path.extname(relativePath).toLowerCase());
}

async function removeStorageObjects(paths: string[]): Promise<void> {
  const bucket = getSupabaseAdmin().storage.from(H5P_STORAGE_BUCKET);
  for (let offset = 0; offset < paths.length; offset += 500) {
    const { error } = await bucket.remove(paths.slice(offset, offset + 500));
    if (error) throw new Error(`No se pudo limpiar el preview H5P: ${error.message}`);
  }
}

export async function uploadH5pPreviewAssetsToSupabase(
  ownerId: string,
  projectId: string,
  storagePath: string,
  h5pBuffer: Buffer
): Promise<string[]> {
  const prefix = previewPrefix(ownerId, projectId, storagePath);
  if (!prefix) throw new Error("No se pudo determinar la carpeta de la versión del preview H5P.");

  const zip = await JSZip.loadAsync(h5pBuffer);
  const zipEntries = Object.entries(zip.files);
  if (zipEntries.length > MAX_ENTRIES) throw new Error("El H5P contiene demasiados archivos para vista previa.");
  if (!zip.file("h5p.json")) throw new Error("El paquete H5P no incluye h5p.json.");

  const assets: Array<{ relativePath: string; entry: JSZip.JSZipObject; size: number }> = [];
  let expandedTotal = 0;
  for (const [rawName, entry] of zipEntries) {
    if (entry.dir) continue;
    const relativePath = rawName.replace(/\\/g, "/");
    if (
      relativePath.startsWith("/") ||
      /^[A-Za-z]:/.test(relativePath) ||
      relativePath.split("/").some((part) => part === "." || part === "..")
    ) {
      throw new Error("El H5P contiene una ruta de archivo no permitida.");
    }
    // H5P packages bundle root-level library CSS/JS, but the viewer loads those
    // shared libraries from /h5p-libs. Only h5p.json and authored content belong
    // in the per-project private preview bucket.
    if (!isH5pPreviewAssetPath(relativePath)) continue;
    if (!safePreviewRelativePath(relativePath) || relativePath.toLowerCase().endsWith(".svg")) {
      throw new Error("El H5P contiene un archivo que no se puede publicar en la vista previa.");
    }
    const size = Number((entry as JSZip.JSZipObject & { _data?: { uncompressedSize?: number } })._data?.uncompressedSize || 0);
    if (size > MAX_ENTRY_BYTES) throw new Error("El H5P contiene un archivo demasiado grande para la vista previa.");
    expandedTotal += size;
    if (expandedTotal > MAX_TOTAL_BYTES) throw new Error("El H5P supera el límite de expansión de la vista previa.");
    assets.push({ relativePath, entry, size });
  }
  if (!assets.some((asset) => asset.relativePath === "h5p.json")) {
    throw new Error("El paquete H5P no incluye h5p.json.");
  }

  const indexObjectPath = `${prefix}__preview-index.json`;
  const objectPaths = [...assets.map((asset) => `${prefix}${asset.relativePath}`), indexObjectPath];
  const bucket = getSupabaseAdmin().storage.from(H5P_STORAGE_BUCKET);
  try {
    for (let offset = 0; offset < assets.length; offset += 5) {
      const batch = assets.slice(offset, offset + 5);
      const results = await Promise.all(batch.map(async ({ relativePath, entry, size }) => {
        const buffer = await entry.async("nodebuffer");
        if (buffer.length > MAX_ENTRY_BYTES || (size > 0 && buffer.length !== size)) {
          throw new Error("Un archivo H5P no coincide con su tamaño declarado.");
        }
        const ext = path.extname(relativePath).toLowerCase();
        const objectPath = `${prefix}${relativePath}`;
        const { error } = await bucket.upload(objectPath, buffer, {
          contentType: CONTENT_TYPES[ext] || "application/octet-stream",
          upsert: true,
        });
        if (error) throw new Error(`No se pudo guardar un recurso del preview: ${error.message}`);
        return objectPath;
      }));
      if (results.length !== batch.length) throw new Error("No se guardaron todos los recursos del preview H5P.");
    }
    const { error: indexError } = await bucket.upload(
      indexObjectPath,
      Buffer.from(JSON.stringify(assets.map((asset) => asset.relativePath)), "utf-8"),
      { contentType: "application/json; charset=utf-8", upsert: true }
    );
    if (indexError) throw new Error(`No se pudo guardar el índice del preview: ${indexError.message}`);
  } catch (error) {
    try {
      await removeStorageObjects(objectPaths);
    } catch (cleanupError) {
      console.warn(
        "[H5P Preview Storage] No se pudieron limpiar todos los assets parciales:",
        cleanupError instanceof Error ? cleanupError.name : "UnknownError"
      );
    }
    throw error;
  }
  return objectPaths;
}

export async function downloadH5pPreviewAssetFromSupabase(
  ownerId: string,
  projectId: string,
  storagePath: string | null | undefined,
  relativePath: string
): Promise<Buffer | null> {
  const prefix = previewPrefix(ownerId, projectId, storagePath);
  if (!prefix) return null;
  if (!safePreviewRelativePath(relativePath) || relativePath.toLowerCase().endsWith(".svg")) {
    throw new Error("La ruta solicitada no es un asset permitido del preview H5P.");
  }

  const { data, error } = await getSupabaseAdmin()
    .storage.from(H5P_STORAGE_BUCKET)
    .download(`${prefix}${relativePath}`);
  if (error) {
    const statusCode = String((error as { statusCode?: string | number }).statusCode || "");
    if (statusCode === "404" || /not found|does not exist/i.test(error.message)) return null;
    throw new Error(`No se pudo cargar un asset privado del preview: ${error.message}`);
  }
  if (!data) return null;
  const buffer = Buffer.from(await data.arrayBuffer());
  if (buffer.length === 0 || buffer.length > MAX_ENTRY_BYTES) {
    throw new Error("El asset del preview está vacío o supera el tamaño permitido.");
  }
  return buffer;
}

export async function listH5pPreviewAssetsFromSupabase(
  ownerId: string,
  projectId: string,
  storagePath: string | null | undefined
): Promise<string[]> {
  const prefix = previewPrefix(ownerId, projectId, storagePath);
  if (!prefix) return [];
  const indexPath = `${prefix}__preview-index.json`;
  const { data, error } = await getSupabaseAdmin()
    .storage.from(H5P_STORAGE_BUCKET)
    .download(indexPath);
  if (error) {
    const statusCode = String((error as { statusCode?: string | number }).statusCode || "");
    if (statusCode === "404" || /not found|does not exist/i.test(error.message)) return [];
    throw new Error(`No se pudo leer el índice del preview para limpieza: ${error.message}`);
  }
  if (!data) return [];
  const rawIndex: unknown = JSON.parse(await data.text());
  if (!Array.isArray(rawIndex) || rawIndex.length > MAX_ENTRIES) {
    throw new Error("El índice de assets del preview H5P no es válido.");
  }
  const relativePaths = rawIndex.filter(
    (value): value is string => typeof value === "string" && safePreviewRelativePath(value) && !value.toLowerCase().endsWith(".svg")
  );
  if (relativePaths.length !== rawIndex.length || !relativePaths.includes("h5p.json")) {
    throw new Error("El índice contiene una ruta fuera del preview H5P.");
  }
  return [...relativePaths.map((relativePath) => `${prefix}${relativePath}`), indexPath];
}

export async function removeH5pPreviewAssetsFromSupabase(paths: string[]): Promise<void> {
  if (!paths.length) return;
  for (const objectPath of paths) {
    const segments = objectPath.split("/");
    const relativePath = segments.slice(4).join("/");
    if (
      segments.length < 5 ||
      segments[0] !== "previews" ||
      !/^[A-Za-z0-9_-]{1,128}$/.test(segments[1]) ||
      !/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/.test(segments[2]) ||
      !/^[A-Za-z0-9_-]{1,80}$/.test(segments[3]) ||
      (relativePath !== "__preview-index.json" && !safePreviewRelativePath(relativePath))
    ) {
      throw new Error("Se rechazó la limpieza de archivos fuera del preview H5P.");
    }
  }
  await removeStorageObjects([...new Set(paths)]);
}
