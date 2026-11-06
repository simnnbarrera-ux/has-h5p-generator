/**
 * Script de Recompilación y Empaquetado H5P para Digitatón UAO 2026
 * Convierte diagramas a PNG de alta resolución con Sharp,
 * elimina entradas de directorio explícitas ('/') del ZIP
 * y genera paquetes 100% compatibles con Moodle y H5P Hub.
 */

const fs = require("fs");
const path = require("path");
const os = require("os");
const jiti = require("jiti")(process.cwd());
const { createClient } = require("@supabase/supabase-js");

const { buildH5pPackageFromSpec } = jiti("./src/lib/h5p-engine.ts");
const { RETO11_ACT0_SPEC, RETO11_ACT1_SPEC } = jiti("./src/lib/reto11-seed.ts");
const { validateH5pPackage } = require("./validate-h5p.js");

async function loadTemplateBuffer() {
  const candidates = [
    process.env.PH5P_TEMPLATE_PATH,
    path.resolve(process.cwd(), "..", "ph5p", "plantillas", "fiuao-6-215", "plantilla.h5p"),
  ].filter(Boolean);

  for (const candidate of candidates) {
    try {
      const stat = fs.statSync(candidate);
      if (stat.isFile() && stat.size > 0 && stat.size <= 50 * 1024 * 1024) {
        return fs.readFileSync(candidate);
      }
    } catch {}
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://jpwpuesdjrezlmpfjymt.supabase.co";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!key) throw new Error("Define PH5P_TEMPLATE_PATH o una clave privada de Storage en el entorno.");
  const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await admin.storage.from("has-h5p-store").download("templates/fiuao-6-215/plantilla.h5p");
  if (error || !data) throw new Error("No se pudo descargar la plantilla H5P desde Storage privado.");
  const buffer = Buffer.from(await data.arrayBuffer());
  if (!buffer.length || buffer.length > 50 * 1024 * 1024) throw new Error("La plantilla H5P está vacía o supera el límite.");
  return buffer;
}

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
  const templateBuffer = await loadTemplateBuffer();
  const result = await buildH5pPackageFromSpec(workingSpec, audioAssets, templateBuffer);

  const outDir = path.join(os.tmpdir(), "has-h5p-build", "generated");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `${spec.id}.h5p`);
  fs.writeFileSync(outPath, result.h5pBuffer);

  console.log(`  [Paquete] Guardado en: ${outPath} (${result.h5pBuffer.length} bytes)`);
  console.log(`  [Slides] Total de diapositivas compiladas: ${result.slidesCount}`);
  console.log(`  [Interactividades] Total de actividades interactivas: ${result.interactionsCount}`);

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
