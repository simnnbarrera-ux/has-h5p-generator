import type { HasProjectRecord } from "@/lib/supabase";

export type ClientProjectRecord = Omit<HasProjectRecord, "auth_user_id" | "storage_path">;

export function toClientProjectRecord(project: HasProjectRecord): ClientProjectRecord {
  const safeRecord: HasProjectRecord = { ...project };
  delete safeRecord.auth_user_id;
  delete safeRecord.storage_path;
  safeRecord.package_url = `/api/h5p/download?id=${encodeURIComponent(project.id)}`;
  return safeRecord;
}
