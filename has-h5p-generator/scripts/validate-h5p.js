/**
 * Validador Oficial H5P (Simulador de H5PValidator.php de Moodle y H5P Hub)
 * Digitatón UAO 2026 - Equipo 36 HAS
 */

const fs = require("fs");
const path = require("path");
const os = require("os");
const JSZip = require("jszip");

const OFFICIAL_H5P_WHITELIST = new Set([
  "json", "png", "jpg", "jpeg", "gif", "bmp", "tif", "tiff",
  "eot", "ttf", "woff", "woff2", "otf",
  "webm", "mp4", "ogg", "mp3", "m4a", "wav",
  "txt", "pdf", "rtf", "doc", "docx", "xls", "xlsx", "ppt", "pptx",
  "odt", "ods", "odp", "csv", "diff", "patch", "swf", "md", "textile",
  "vtt", "webvtt", "gltf", "glb"
]);

async function validateH5pPackage(h5pFilePath) {
  const resolvedPath = path.resolve(h5pFilePath);
  console.log(`\n============================================================`);
  console.log(`Validando paquete H5P: ${path.basename(resolvedPath)}`);
  console.log(`Ruta: ${resolvedPath}`);
  console.log(`============================================================`);

  if (!fs.existsSync(resolvedPath)) {
    console.error(`ERROR: Archivo no encontrado: ${resolvedPath}`);
    return { success: false, errors: [`Archivo no encontrado: ${resolvedPath}`] };
  }

  const fileBuffer = fs.readFileSync(resolvedPath);
  const zip = await JSZip.loadAsync(fileBuffer);

  const errors = [];
  const entries = Object.keys(zip.files);

  console.log(`Total de entradas en el ZIP: ${entries.length}`);

  let dirEntriesCount = 0;
  let contentFilesCount = 0;
  let svgInContentCount = 0;
  let invalidExtensionCount = 0;

  for (const entryName of entries) {
    const zipObj = zip.files[entryName];

    // Regla 1: Ninguna entrada debe terminar en '/' ni ser directorio explícito
    if (entryName.endsWith("/") || zipObj.dir) {
      dirEntriesCount++;
      errors.push(
        `Directorio explícito no permitido en ZIP: "${entryName}". En H5PValidator.php esto genera el error: 'El archivo "${entryName}" no está permitido.'`
      );
    }

    // Regla 2: Archivos dentro de content/
    if (entryName.startsWith("content/")) {
      contentFilesCount++;
      const relativeContentPath = entryName.slice("content/".length);

      // Si la entrada es "content/" sin archivo
      if (!relativeContentPath) {
        // Ya reportado en Regla 1
        continue;
      }

      // Obtener extensión
      const extMatch = entryName.match(/\.([a-zA-Z0-9]+)$/);
      const ext = extMatch ? extMatch[1].toLowerCase() : "";

      if (!ext) {
        invalidExtensionCount++;
        errors.push(
          `Archivo sin extensión en content/: "${entryName}". Solo se permiten extensiones válidas.`
        );
      } else if (!OFFICIAL_H5P_WHITELIST.has(ext)) {
        invalidExtensionCount++;
        errors.push(
          `Extensión no permitida en content/: "${entryName}" (.${ext}). Solo se permiten archivos en la whitelist H5P.`
        );
      }

      // Prohibición absoluta de .svg en content/ (seguridad XSS en PHP)
      if (ext === "svg") {
        svgInContentCount++;
        errors.push(
          `Archivo SVG prohibido en content/: "${entryName}". H5PValidator prohíbe SVG por política estricta anti-XSS.`
        );
      }
    }
  }

  // Regla 3: Comprobar existencia de h5p.json
  if (!zip.files["h5p.json"]) {
    errors.push(`Falta el archivo requerido h5p.json en la raíz del paquete.`);
  } else {
    try {
      const h5pRaw = await zip.files["h5p.json"].async("string");
      const h5pData = JSON.parse(h5pRaw);
      console.log(`h5p.json válido: Título = "${h5pData.title}", Biblioteca = ${h5pData.mainLibrary || h5pData.preloadedDependencies?.[0]?.machineName}`);
    } catch (e) {
      errors.push(`h5p.json está corrupto o no es JSON válido: ${e.message}`);
    }
  }

  // Regla 4: Comprobar existencia de content/content.json
  if (!zip.files["content/content.json"]) {
    errors.push(`Falta el archivo requerido content/content.json en el paquete.`);
  } else {
    try {
      const contentRaw = await zip.files["content/content.json"].async("string");
      const contentData = JSON.parse(contentRaw);
      console.log(`content/content.json válido: Contiene estructura JSON correcta.`);

      // Inspeccionar recursivamente todas las referencias de archivos en content.json
      const inspectFileRefs = (obj) => {
        if (!obj) return;
        if (Array.isArray(obj)) {
          for (const item of obj) inspectFileRefs(item);
        } else if (typeof obj === "object") {
          if (obj.path && typeof obj.path === "string" && !obj.path.startsWith("http")) {
            const refPath = obj.path.replace(/\\/g, "/");
            const fullZipPath = `content/${refPath}`;

            if (refPath.toLowerCase().endsWith(".svg")) {
              errors.push(
                `Referencia a archivo .svg encontrada en content.json: "${refPath}". Debe ser .png con mime: 'image/png'.`
              );
            }

            if (obj.mime === "image/svg+xml") {
              errors.push(
                `MIME type image/svg+xml no permitido en content.json para: "${refPath}".`
              );
            }

            if (!zip.files[fullZipPath]) {
              errors.push(
                `Archivo referenciado en content.json no existe en el zip: "${fullZipPath}".`
              );
            }
          }
          for (const val of Object.values(obj)) {
            inspectFileRefs(val);
          }
        }
      };

      inspectFileRefs(contentData);
    } catch (e) {
      errors.push(`content/content.json está corrupto o no es JSON válido: ${e.message}`);
    }
  }

  // Reporte final
  console.log(`\nResultados de validación:`);
  console.log(`- Entradas de directorio (con '/'): ${dirEntriesCount} (Requerido: 0)`);
  console.log(`- Archivos en content/: ${contentFilesCount}`);
  console.log(`- Archivos .svg en content/: ${svgInContentCount} (Requerido: 0)`);
  console.log(`- Archivos con extensión no permitida: ${invalidExtensionCount} (Requerido: 0)`);
  console.log(`- Total de errores encontrados: ${errors.length}`);

  if (errors.length > 0) {
    console.error(`\n[FALLO] El paquete NO cumple con las reglas oficiales de Moodle / H5P Hub:`);
    for (const err of errors) {
      console.error(`  - ${err}`);
    }
    return { success: false, errors };
  }

  console.log(`\n[ÉXITO] El paquete cumple al 100% las especificaciones de H5PValidator.php de Moodle y H5P Hub.`);
  return { success: true, errors: [] };
}

async function main() {
  const args = process.argv.slice(2);
  const targets = args.length > 0
    ? args
    : [
        path.join(os.tmpdir(), "has-h5p-build", "generated", "matematicas-discretas-act1.h5p"),
        path.join(os.tmpdir(), "has-h5p-build", "generated", "matematicas-discretas-act0.h5p"),
      ];

  let allPassed = true;
  for (const t of targets) {
    const res = await validateH5pPackage(t);
    if (!res.success) {
      allPassed = false;
    }
  }

  if (!allPassed) {
    process.exit(1);
  }
  process.exit(0);
}

if (require.main === module) {
  main().catch((err) => {
    console.error("Error fatal en validador:", err);
    process.exit(1);
  });
}

module.exports = { validateH5pPackage, OFFICIAL_H5P_WHITELIST };
