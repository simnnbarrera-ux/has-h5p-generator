#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const crypto = require('node:crypto');
const JSZip = require('jszip');
const { createClient } = require('@supabase/supabase-js');

const BUCKET = 'has-h5p-store';
const TEMPLATE_IDS = [1, 2, 3, 4, 5];
const CONFIRM_ENV = 'CONFIRM_UPLOAD_UAO_TEMPLATES';

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function isNotFound(error) {
  return String(error?.statusCode || '') === '404' || /not found|does not exist/i.test(String(error?.message || ''));
}

async function main() {
  const archivePath = process.argv.slice(2).find((arg) => !arg.startsWith('--'));
  const overwrite = process.argv.includes('--overwrite');
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

  if (process.env[CONFIRM_ENV] !== '1') {
    throw new Error(`Confirma la operación definiendo ${CONFIRM_ENV}=1.`);
  }
  if (!archivePath || !fs.existsSync(archivePath)) {
    throw new Error('Indica la ruta del ZIP original de plantillas UAO.');
  }
  if (!supabaseUrl || !serviceKey) {
    throw new Error('Configura SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY (solo en entorno local seguro).');
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: bucket, error: bucketError } = await supabase.storage.getBucket(BUCKET);
  if (bucketError) throw new Error(`No se pudo comprobar el bucket ${BUCKET}: ${bucketError.message}`);
  if (bucket?.public) throw new Error(`Se aborta: el bucket ${BUCKET} debe ser privado.`);

  const zip = await JSZip.loadAsync(fs.readFileSync(archivePath), {
    checkCRC32: true,
    createFolders: false,
  });
  let uploaded = 0;
  let unchanged = 0;

  for (const number of TEMPLATE_IDS) {
    const id = `facultad-${number}`;
    const archiveEntry = `plantillas-uao/h5p/facultad/${id}.h5p`;
    const storagePath = `templates/uao/facultad/${id}.h5p`;
    const item = zip.file(archiveEntry);
    if (!item) throw new Error(`El ZIP no contiene ${archiveEntry}.`);

    const buffer = await item.async('nodebuffer');
    if (!buffer.length || buffer.length > 50 * 1024 * 1024) {
      throw new Error(`${id} está vacío o supera el límite de 50 MB.`);
    }

    const { data: existingFile, error: downloadError } = await supabase.storage
      .from(BUCKET)
      .download(storagePath);
    if (!downloadError && existingFile) {
      const currentBuffer = Buffer.from(await existingFile.arrayBuffer());
      if (sha256(currentBuffer) === sha256(buffer)) {
        console.log(`${id}: ya estaba cargada y coincide.`);
        unchanged += 1;
        continue;
      }
      if (!overwrite) {
        throw new Error(`${id} ya existe con otro contenido; usa --overwrite solo si autorizas reemplazarla.`);
      }
    } else if (downloadError && !isNotFound(downloadError)) {
      throw new Error(`No se pudo comprobar ${id} en Storage: ${downloadError.message}`);
    }

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, buffer, {
        upsert: overwrite,
        contentType: 'application/octet-stream',
        cacheControl: '3600',
      });
    if (uploadError) throw new Error(`No se pudo cargar ${id}: ${uploadError.message}`);
    console.log(`${id}: cargada (${buffer.length} bytes).`);
    uploaded += 1;
  }

  console.log(`Listo: ${uploaded} cargadas; ${unchanged} ya estaban idénticas; bucket privado verificado.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Falló la carga de plantillas.');
  process.exitCode = 1;
});
