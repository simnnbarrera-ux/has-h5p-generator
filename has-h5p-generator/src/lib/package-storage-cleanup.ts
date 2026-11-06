import "server-only";
import { getSupabaseAdmin, H5P_STORAGE_BUCKET } from "@/lib/supabase-server";

export async function removeStoredH5pPackage(
  ownerId: string,
  projectId: string,
  storagePath: string
): Promise<void> {
  const legacyPath = `packages/${ownerId}/${projectId}.h5p`;
  const versionPrefix = `packages/${ownerId}/${projectId}/`;
  const versionName = storagePath.startsWith(versionPrefix)
    ? storagePath.slice(versionPrefix.length)
    : "";
  if (storagePath !== legacyPath && !/^[A-Za-z0-9_-]{1,80}\.h5p$/.test(versionName)) {
    throw new Error("Se rechazó la limpieza de un paquete fuera del propietario/proyecto.");
  }
  const { error } = await getSupabaseAdmin().storage
    .from(H5P_STORAGE_BUCKET)
    .remove([storagePath]);
  if (error) throw new Error(`No se pudo limpiar un paquete: ${error.message}`);
}
