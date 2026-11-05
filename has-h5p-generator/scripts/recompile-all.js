/**
 * Script de Recompilación y Empaquetado H5P para Digitatón UAO 2026
 * Convierte diagramas a PNG de alta resolución con Sharp,
 * elimina entradas de directorio explícitas ('/') del ZIP
 * y genera paquetes 100% compatibles con Moodle y H5P Hub.
 */

const fs = require("fs");
const path = require("path");
const jiti = require("jiti")(process.cwd());

const { buildH5pPackageFromSpec } = jiti("./src/lib/h5p-engine.ts");
const { RETO11_ACT0_SPEC, RETO11_ACT1_SPEC } = jiti("./src/lib/reto11-seed.ts");
const { validateH5pPackage } = require("./validate-h5p.js");

async function compileProject(spec) {
  console.log(`\n============================================================`);
  console.log(`Iniciando compilación H5P para: ${spec.id} (${spec.title})`);
  console.log(`============================================================`);

  const workingSpec = JSON.parse(JSON.stringify(spec));
  const audioAssets = new Map();

  // Cargar audios cacheados si existen
  for (const slide of workingSpec.slides) {
    if (slide.audioNarration?.text) {
      const relAudioPath = `audios/narration-${slide.id}.mp3`;
      const localCachedAudio = path.join(
        process.cwd(),
        "public",
        "preview-h5p",
        workingSpec.id,
        "content",
        relAudioPath
      );
      if (fs.existsSync(localCachedAudio)) {
        slide.audioNarration.audioFilePath = relAudioPath;
        audioAssets.set(relAudioPath, fs.readFileSync(localCachedAudio));
        console.log(`  [Audio] Vinculado audio existente: ${relAudioPath}`);
      } else {
        console.log(`  [Audio] No encontrado en caché local: ${localCachedAudio}`);
      }
    }
  }

  // Ejecutar compilación del paquete .h5p
  const result = await buildH5pPackageFromSpec(workingSpec, audioAssets);

  const outDir = path.join(process.cwd(), "public", "generated");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `${spec.id}.h5p`);
  fs.writeFileSync(outPath, result.h5pBuffer);

  console.log(`  [Paquete] Guardado en: ${outPath} (${result.h5pBuffer.length} bytes)`);
  console.log(`  [Slides] Total de diapositivas compiladas: ${result.slidesCount}`);
  console.log(`  [Interactividades] Total de actividades interactivas: ${result.interactionsCount}`);

  // Limpiar cualquier archivo .svg residual en preview-h5p
  const previewImagesDir = path.join(process.cwd(), "public", "preview-h5p", spec.id, "content", "images");
  if (fs.existsSync(previewImagesDir)) {
    const files = fs.readdirSync(previewImagesDir);
    let removedSvg = 0;
    for (const f of files) {
      if (f.toLowerCase().endsWith(".svg")) {
        fs.unlinkSync(path.join(previewImagesDir, f));
        removedSvg++;
      }
    }
    if (removedSvg > 0) {
      console.log(`  [Limpieza] Eliminados ${removedSvg} archivos .svg obsoletos de ${previewImagesDir}`);
    }
  }

  // Validar inmediatamente con el validador oficial
  const valResult = await validateH5pPackage(outPath);
  if (!valResult.success) {
    throw new Error(`Validación H5P falló para ${spec.id}`);
  }

  return { spec, outPath, result };
}

async function main() {
  console.log("Iniciando recompilación de paquetes oficiales...");
  await compileProject(RETO11_ACT1_SPEC);
  await compileProject(RETO11_ACT0_SPEC);
  console.log("\n============================================================");
  console.log("RECOMPILACIÓN Y VALIDACIÓN FINALIZADAS CON ÉXITO");
  console.log("============================================================");
}

main().catch((err) => {
  console.error("ERROR FATAL DURANTE RECOMPILACIÓN:", err);
  process.exit(1);
});
