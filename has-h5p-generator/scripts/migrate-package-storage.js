#!/usr/bin/env node
const { createClient } = require("@supabase/supabase-js");

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    throw new Error("Define NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en el entorno del proceso.");
  }

  const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const bucket = "has-h5p-store";
  const rows = [];
  const pageSize = 100;
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await admin
      .from("has_projects")
      .select("id,auth_user_id,storage_path,status")
      .is("storage_path", null)
      .not("auth_user_id", "is", null)
      .eq("status", "ready")
      .order("id", { ascending: true })
      .range(offset, offset + pageSize - 1);
    if (error) throw new Error(`No se pudieron enumerar proyectos: ${error.message}`);
    rows.push(...(data || []));
    if (!data || data.length < pageSize) break;
  }

  let copied = 0;
  let missing = 0;
  for (const project of rows) {
    if (typeof project.id !== "string" || !/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/.test(project.id)) {
      missing += 1;
      continue;
    }
    const sourcePath = `packages/${project.id}.h5p`;
    const { data: blob, error: downloadError } = await admin.storage.from(bucket).download(sourcePath);
    if (downloadError || !blob) {
      missing += 1;
      continue;
    }
    const buffer = Buffer.from(await blob.arrayBuffer());
    if (!buffer.length || buffer.length > 100 * 1024 * 1024) {
      missing += 1;
      continue;
    }

    const storagePath = `packages/${project.auth_user_id}/${project.id}/legacy.h5p`;
    const { error: uploadError } = await admin.storage.from(bucket).upload(storagePath, buffer, {
      contentType: "application/zip",
      upsert: true,
    });
    if (uploadError) throw new Error(`No se pudo copiar un paquete al bucket privado: ${uploadError.message}`);

    const { error: updateError } = await admin
      .from("has_projects")
      .update({ storage_path: storagePath })
      .eq("id", project.id)
      .eq("auth_user_id", project.auth_user_id)
      .is("storage_path", null);
    if (updateError) throw new Error(`No se pudo asociar el paquete al proyecto: ${updateError.message}`);
    copied += 1;
  }

  console.log(`Migración terminada. Copiados: ${copied}; sin paquete legacy disponible: ${missing}; registros revisados: ${rows.length}.`);
  console.log("Los objetos legacy originales se conservaron; elimínalos únicamente tras verificar las copias y respaldos.");
}

main().catch((error) => {
  console.error("Migración de Storage fallida:", error.message || "error desconocido");
  process.exitCode = 1;
});
