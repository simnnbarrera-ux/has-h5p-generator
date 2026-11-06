import "server-only";

import { createClient, type User } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { HasProfile, HasProjectRecord, HasUsageLog } from "@/lib/supabase";
import { getUaoTemplate } from "@/lib/uao-template-catalog";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://jpwpuesdjrezlmpfjymt.supabase.co";
const SUPABASE_SECRET_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || "";
export const H5P_STORAGE_BUCKET = "has-h5p-store";

export function getSupabaseAdmin() {
  if (!SUPABASE_SECRET_KEY) {
    throw new Error(
      "Falta SUPABASE_SERVICE_ROLE_KEY (o SUPABASE_SECRET_KEY) en el servidor."
    );
  }
  return createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { "X-Client-Info": "has-h5p-server/2.0" } },
  });
}

function normalizedEmail(user: User): string {
  const email = user.email?.trim().toLowerCase();
  if (!email) throw new Error("La cuenta autenticada no tiene correo verificado.");
  return email;
}

function safeMetadataText(value: unknown, fallback: string, max = 120): string {
  if (typeof value !== "string") return fallback;
  const cleaned = value.replace(/[\u0000-\u001f\u007f]/g, " ").trim();
  return cleaned ? cleaned.slice(0, max) : fallback;
}

export async function getOrCreateProfile(user: User): Promise<HasProfile> {
  const email = normalizedEmail(user);
  const admin = getSupabaseAdmin();
  const existing = await admin
    .from("has_profiles")
    .select("email,full_name,faculty,program,role,daily_quota,preferred_voice")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (existing.error) throw new Error(`No se pudo consultar el perfil: ${existing.error.message}`);
  if (existing.data) return existing.data as HasProfile;

  const candidate: HasProfile & { auth_user_id: string } = {
    auth_user_id: user.id,
    email,
    full_name: safeMetadataText(
      user.user_metadata?.full_name,
      email.split("@")[0].replace(/[._-]/g, " ").slice(0, 120)
    ),
    faculty: "Facultad de Ingeniería y Ciencias Básicas",
    program: "Campus Digital UAO",
    role: "professor",
    daily_quota: 50,
    preferred_voice: "es-CO-SalomeNeural",
  };
  const created = await admin
    .from("has_profiles")
    .upsert(candidate, { onConflict: "email" })
    .select("email,full_name,faculty,program,role,daily_quota,preferred_voice")
    .single();
  if (created.error || !created.data) {
    throw new Error(`No se pudo crear el perfil: ${created.error?.message || "respuesta vacía"}`);
  }
  return created.data as HasProfile;
}

export async function listProjectsForUser(userId: string): Promise<HasProjectRecord[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("has_projects")
    .select("*")
    .eq("auth_user_id", userId)
    .order("updated_at", { ascending: false });
  if (error) throw new Error(`No se pudieron cargar los proyectos: ${error.message}`);
  return (data || []) as HasProjectRecord[];
}

export async function getProjectForUser(
  projectId: string,
  userId: string
): Promise<HasProjectRecord | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("has_projects")
    .select("*")
    .eq("id", projectId)
    .eq("auth_user_id", userId)
    .maybeSingle();
  if (error) throw new Error(`No se pudo verificar el proyecto: ${error.message}`);
  return (data as HasProjectRecord | null) || null;
}

export async function saveProjectToDb(
  project: HasProjectRecord,
  ownerId: string
): Promise<HasProjectRecord> {
  const admin = getSupabaseAdmin();
  const current = await admin
    .from("has_projects")
    .select("auth_user_id,created_at,storage_path")
    .eq("id", project.id)
    .maybeSingle();
  if (current.error) throw new Error(`No se pudo verificar el ID del proyecto: ${current.error.message}`);
  if (current.data && current.data.auth_user_id !== ownerId) {
    throw new Error("Ese identificador ya pertenece a otro usuario.");
  }

  const payload = {
    ...project,
    auth_user_id: ownerId,
    created_at: current.data?.created_at || project.created_at,
    storage_path: project.storage_path ?? current.data?.storage_path ?? null,
    updated_at: new Date().toISOString(),
  };

  if (current.data) {
    // Conditional UPDATE is atomic with the owner predicate; never use an
    // ownership-changing upsert after a separate check (TOCTOU race).
    const { data, error } = await admin
      .from("has_projects")
      .update(payload)
      .eq("id", project.id)
      .eq("auth_user_id", ownerId)
      .select("*")
      .maybeSingle();
    if (error) throw new Error(`No se pudo actualizar el proyecto: ${error.message}`);
    if (!data) throw new Error("El propietario del proyecto cambió; vuelve a cargar la página.");
    return data as HasProjectRecord;
  }

  const { data, error } = await admin
    .from("has_projects")
    .insert(payload)
    .select("*")
    .single();
  if (error || !data) {
    if (error?.code === "23505") {
      throw new Error("Ese identificador ya pertenece a otro usuario o fue creado simultáneamente.");
    }
    throw new Error(`No se pudo guardar el proyecto: ${error?.message || "respuesta vacía"}`);
  }
  return data as HasProjectRecord;
}

export async function checkAndLogRateLimit(params: {
  userId: string;
  userEmail: string;
  ipAddress: string;
  actionType: HasUsageLog["action_type"];
  modelUsed?: string;
  tokensEstimated?: number;
}): Promise<{
  allowed: boolean;
  remainingToday: number;
  usedLastMinute: number;
  dailyQuota: number;
  reason?: string;
}> {
  const profile = await getOrCreateProfile({
    id: params.userId,
    email: params.userEmail,
    user_metadata: {},
  } as User);
  const { data, error } = await getSupabaseAdmin().rpc("consume_has_usage_quota", {
    p_auth_user_id: params.userId,
    p_user_email: params.userEmail,
    p_ip_address: params.ipAddress.slice(0, 80),
    p_action_type: params.actionType,
    p_model_used: (params.modelUsed || "unknown").slice(0, 120),
    p_tokens_estimated: Math.max(0, Math.min(params.tokensEstimated || 0, 100000)),
    p_daily_quota: Math.max(1, Math.min(profile.daily_quota || 30, 1000)),
    p_minute_limit: 10,
  });
  if (error) throw new Error(`No se pudo aplicar la cuota: ${error.message}`);
  const result = (Array.isArray(data) ? data[0] : data) as any;
  if (!result || typeof result.allowed !== "boolean") {
    throw new Error("El servidor devolvió una respuesta de cuota inválida.");
  }
  return {
    allowed: result.allowed,
    remainingToday: Number(result.remaining_today ?? 0),
    usedLastMinute: Number(result.used_last_minute ?? 0),
    dailyQuota: Number(result.daily_quota ?? profile.daily_quota),
    ...(result.reason ? { reason: String(result.reason) } : {}),
  };
}

export async function loadH5pTemplateBuffer(baseTemplateId?: string): Promise<Buffer> {
  const selectedTemplate = getUaoTemplate(baseTemplateId);
  if (baseTemplateId && !selectedTemplate) {
    throw new Error("La base H5P solicitada no pertenece al catálogo UAO.");
  }

  if (selectedTemplate?.h5pStoragePath) {
    const { data, error } = await getSupabaseAdmin()
      .storage.from(H5P_STORAGE_BUCKET)
      .download(selectedTemplate.h5pStoragePath);
    if (error || !data) {
      throw new Error(
        `No se pudo cargar la base H5P privada ${selectedTemplate.id}: ${error?.message || "archivo no encontrado"}`
      );
    }
    const buffer = Buffer.from(await data.arrayBuffer());
    if (buffer.length === 0 || buffer.length > 50 * 1024 * 1024) {
      throw new Error("La base H5P seleccionada está vacía o supera el límite permitido.");
    }
    return buffer;
  }

  const explicitPath = process.env.PH5P_TEMPLATE_PATH;
  const candidates = [
    explicitPath,
    path.resolve(process.cwd(), 'public', 'templates', 'fiuao-6-215', 'plantilla.h5p'),
    path.resolve(process.cwd(), "..", "ph5p", "plantillas", "fiuao-6-215", "plantilla.h5p"),
  ].filter((value): value is string => Boolean(value));
  for (const candidate of candidates) {
    try {
      const resolved = path.resolve(candidate);
      const stat = fs.statSync(resolved);
      if (stat.isFile() && stat.size > 0 && stat.size <= 50 * 1024 * 1024) {
        return fs.readFileSync(resolved);
      }
    } catch {}
  }

  const { data, error } = await getSupabaseAdmin()
    .storage.from(H5P_STORAGE_BUCKET)
    .download("templates/fiuao-6-215/plantilla.h5p");
  if (error || !data) {
    throw new Error(`No se pudo obtener la plantilla H5P privada: ${error?.message || "no encontrada"}`);
  }
  const buffer = Buffer.from(await data.arrayBuffer());
  if (buffer.length === 0 || buffer.length > 50 * 1024 * 1024) {
    throw new Error("La plantilla H5P está vacía o supera el límite permitido.");
  }
  return buffer;
}

export async function uploadH5pPackageToSupabase(
  ownerId: string,
  projectId: string,
  buffer: Buffer
): Promise<string> {
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/.test(projectId)) {
    throw new Error("Identificador de proyecto no válido para Storage.");
  }
  const storagePath = `packages/${ownerId}/${projectId}/${randomUUID()}.h5p`;
  const { error } = await getSupabaseAdmin()
    .storage.from(H5P_STORAGE_BUCKET)
    .upload(storagePath, buffer, {
      contentType: "application/zip",
      upsert: true,
    });
  if (error) throw new Error(`No se pudo guardar el paquete: ${error.message}`);
  return storagePath;
}

export async function downloadH5pPackageFromSupabase(
  ownerId: string,
  projectId: string,
  storagePath?: string | null
): Promise<Buffer> {
  const legacyPath = `packages/${ownerId}/${projectId}.h5p`;
  const expectedVersionPrefix = `packages/${ownerId}/${projectId}/`;
  const selectedPath = storagePath || legacyPath;
  const versionName = selectedPath.startsWith(expectedVersionPrefix)
    ? selectedPath.slice(expectedVersionPrefix.length)
    : "";
  if (selectedPath !== legacyPath && !/^[A-Za-z0-9_-]{1,80}\.h5p$/.test(versionName)) {
    throw new Error("La ruta del paquete no coincide con el propietario del proyecto.");
  }
  const { data, error } = await getSupabaseAdmin()
    .storage.from(H5P_STORAGE_BUCKET)
    .download(selectedPath);
  if (error || !data) throw new Error(`No se encontró el paquete: ${error?.message || "archivo ausente"}`);
  const buffer = Buffer.from(await data.arrayBuffer());
  if (buffer.length === 0 || buffer.length > 100 * 1024 * 1024) {
    throw new Error("El paquete está vacío o supera el tamaño máximo permitido.");
  }
  return buffer;
}
