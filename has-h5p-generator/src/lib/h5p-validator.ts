import JSZip from "jszip";

const MAX_ARCHIVE_BYTES = 100 * 1024 * 1024;
const MAX_ENTRIES = 2_500;
const MAX_FILE_BYTES = 30 * 1024 * 1024;
const MAX_UNCOMPRESSED_BYTES = 150 * 1024 * 1024;

function normalizeZipPath(name: string): string {
  const normalized = name.replace(/\\/g, "/");
  const segments = normalized.split("/");
  if (
    normalized.startsWith("/") ||
    /^[A-Za-z]:/.test(normalized) ||
    segments.some((segment) => segment === ".." || segment === ".") ||
    segments.some((segment) => segment.includes("\u0000"))
  ) {
    throw new Error("El paquete contiene una ruta inválida.");
  }
  return normalized;
}

export async function validateH5pBuffer(buffer: Buffer): Promise<void> {
  if (!Buffer.isBuffer(buffer) || buffer.length < 1 || buffer.length > MAX_ARCHIVE_BYTES) {
    throw new Error("El paquete H5P está vacío o supera el tamaño máximo.");
  }

  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(buffer);
  } catch {
    throw new Error("El resultado no es un ZIP H5P válido.");
  }

  const entries = Object.entries(zip.files);
  if (entries.length > MAX_ENTRIES) throw new Error("El paquete contiene demasiadas entradas.");

  let expandedSize = 0;
  for (const [rawName, file] of entries) {
    const name = normalizeZipPath(rawName);
    if (file.dir) continue;
    const uncompressedSize = Number((file as any)._data?.uncompressedSize || 0);
    if (uncompressedSize > MAX_FILE_BYTES) throw new Error("El paquete contiene un archivo demasiado grande.");
    expandedSize += uncompressedSize;
    if (expandedSize > MAX_UNCOMPRESSED_BYTES) throw new Error("El paquete excede el límite de expansión permitido.");
    if (name.startsWith("content/") && name.toLowerCase().endsWith(".svg")) {
      throw new Error("El paquete no puede contener archivos SVG dentro de content/.");
    }
  }

  const h5pFile = zip.file("h5p.json");
  const contentFile = zip.file("content/content.json");
  if (!h5pFile || !contentFile) throw new Error("El ZIP no contiene h5p.json y content/content.json.");

  let h5p: any;
  let content: any;
  try {
    [h5p, content] = await Promise.all([
      h5pFile.async("string").then((value) => JSON.parse(value)),
      contentFile.async("string").then((value) => JSON.parse(value)),
    ]);
  } catch {
    throw new Error("El paquete contiene JSON inválido.");
  }
  if (!h5p || typeof h5p.mainLibrary !== "string" || !content || typeof content !== "object") {
    throw new Error("La estructura H5P del paquete es incompleta.");
  }

  const checkReferences = (value: unknown): void => {
    if (Array.isArray(value)) {
      value.forEach(checkReferences);
      return;
    }
    if (!value || typeof value !== "object") return;
    const object = value as Record<string, unknown>;
    if (typeof object.path === "string" && !/^https?:\/\//i.test(object.path)) {
      const relative = normalizeZipPath(object.path);
      if (relative.toLowerCase().endsWith(".svg")) throw new Error("Se encontró una referencia SVG no permitida.");
      if (!zip.file(`content/${relative}`)) throw new Error(`Falta un archivo referenciado en content/: ${relative}`);
    }
    Object.values(object).forEach(checkReferences);
  };
  checkReferences(content);
}
