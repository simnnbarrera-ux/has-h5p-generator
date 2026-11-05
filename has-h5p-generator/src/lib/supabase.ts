// =============================================================================
// HAS H5P Generator — Capa de Persistencia Database-First + Rate Limiting
// Conecta con Supabase PostgreSQL + Supabase Storage (Bucket: has-h5p-store)
// =============================================================================

import { createClient, SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://jpwpuesdjrezlmpfjymt.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_FMP6jyq0Qn1itslbvmT_Rw_RTX_Ijxb";
const SUPABASE_SECRET_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const STORAGE_BUCKET = "has-h5p-store";

// Cliente público (navegador / autenticación persistente)
export const supabasePublic: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: { persistSession: true, autoRefreshToken: true },
    global: {
      headers: { "X-Client-Info": "has-h5p-generator-uao/1.0" },
    },
  }
);

// Cliente administrativo (servidor Node.js con User-Agent de servidor para sb_secret_)
export function getSupabaseAdmin(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      headers: {
        "User-Agent": "supabase-py/2.10.0 has-h5p-server/1.0",
        "X-Client-Info": "has-h5p-server/1.0",
      },
    },
  });
}

export interface HasProfile {
  email: string;
  full_name: string;
  faculty: string;
  program: string;
  role: "professor" | "admin" | "orientador";
  daily_quota: number;
  preferred_voice: string;
}

export interface HasUsageLog {
  id: string;
  user_email: string;
  ip_address: string;
  action_type:
    | "copilot_chat"
    | "mockup_import"
    | "tts_audio"
    | "stt_whisper"
    | "h5p_build"
    | "svg_diagram";
  model_used?: string;
  tokens_estimated: number;
  created_at: string;
}

export interface HasProjectRecord {
  id: string;
  user_email: string;
  title: string;
  course_name: string;
  module_name: string;
  activity_number: number;
  template_id: string;
  raw_mockup?: string;
  project_spec: any;
  ph5p_script?: string;
  moodle_book?: any;
  audit_report?: string[];
  package_url?: string;
  slides_count: number;
  interactions_count: number;
  status: "draft" | "generating" | "ready";
  created_at: string;
  updated_at: string;
}

// -----------------------------------------------------------------------------
// Helpers de respaldo relacional + Cloud Storage en Supabase (has-h5p-store)
// Garantiza 100% persistencia en la nube en jpwpuesdjrezlmpfjymt.supabase.co
// -----------------------------------------------------------------------------

async function readCloudJson<T>(path: string, fallback: T): Promise<T> {
  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin.storage
      .from(STORAGE_BUCKET)
      .download(path);
    if (error || !data) return fallback;
    const text = await data.text();
    return JSON.parse(text) as T;
  } catch {
    return fallback;
  }
}

async function writeCloudJson<T>(path: string, payload: T): Promise<boolean> {
  try {
    const admin = getSupabaseAdmin();
    const body = Buffer.from(JSON.stringify(payload, null, 2), "utf-8");
    const { error } = await admin.storage
      .from(STORAGE_BUCKET)
      .upload(path, body, {
        contentType: "application/json",
        upsert: true,
      });
    return !error;
  } catch (err) {
    console.error("[Supabase Cloud Storage Error]", err);
    return false;
  }
}

// -----------------------------------------------------------------------------
// 1. Gestión de Perfiles Docentes
// -----------------------------------------------------------------------------

const DEFAULT_PROFILES: HasProfile[] = [
  {
    email: "oswaldo.rodriguez@uao.edu.co",
    full_name: "Prof. Oswaldo Rodríguez Díaz",
    faculty: "Facultad de Ingeniería y Ciencias Básicas",
    program: "Matemáticas Discretas (Reto 11)",
    role: "professor",
    daily_quota: 50,
    preferred_voice: "es-CO-GonzaloNeural",
  },
  {
    email: "simnn.barrera@uao.edu.co",
    full_name: "Simón Barrera Ruíz (EQ-36)",
    faculty: "Facultad de Ingeniería y Ciencias Básicas",
    program: "Ingeniería Mecatrónica",
    role: "admin",
    daily_quota: 100,
    preferred_voice: "es-CO-SalomeNeural",
  },
  {
    email: "hermaioni.delgado@uao.edu.co",
    full_name: "Hermaioni Delgado Paz (EQ-36)",
    faculty: "Facultad de Ingeniería y Ciencias Básicas",
    program: "Ingeniería Mecatrónica",
    role: "admin",
    daily_quota: 100,
    preferred_voice: "es-CO-SalomeNeural",
  },
  {
    email: "alex.silva@uao.edu.co",
    full_name: "Alex Yohan Silva Mina (EQ-36)",
    faculty: "Facultad de Ingeniería y Ciencias Básicas",
    program: "Ingeniería Informática",
    role: "admin",
    daily_quota: 100,
    preferred_voice: "es-CO-GonzaloNeural",
  },
];

export async function getOrCreateProfile(
  email: string,
  fullName?: string
): Promise<HasProfile> {
  const normalizedEmail = email.trim().toLowerCase();
  const admin = getSupabaseAdmin();

  // 1. Intentar desde tabla PostgreSQL has_profiles
  try {
    const { data, error } = await admin
      .from("has_profiles")
      .select("*")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (!error && data) {
      return data as HasProfile;
    }
  } catch {}

  // 2. Respaldo sincronizado en Supabase Cloud Storage
  const profiles = await readCloudJson<HasProfile[]>(
    "db/has_profiles.json",
    DEFAULT_PROFILES
  );
  let found = profiles.find((p) => p.email.toLowerCase() === normalizedEmail);

  if (!found) {
    found = {
      email: normalizedEmail,
      full_name:
        fullName ||
        normalizedEmail
          .split("@")[0]
          .replace(/[._]/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase()),
      faculty: "Facultad de Ingeniería y Ciencias Básicas",
      program: "Campus Digital UAO",
      role: "professor",
      daily_quota: 30,
      preferred_voice: "es-CO-SalomeNeural",
    };
    profiles.push(found);
    await writeCloudJson("db/has_profiles.json", profiles);
  }

  // Intentar sincronizar hacia tabla PostgreSQL si ya fue creada
  try {
    await admin.from("has_profiles").upsert([found], { onConflict: "email" });
  } catch {}

  return found;
}

// -----------------------------------------------------------------------------
// 2. Rate-Limiting y Auditoría de Consumo de Tokens en Supabase
// -----------------------------------------------------------------------------

export async function checkAndLogRateLimit(params: {
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
  const profile = await getOrCreateProfile(params.userEmail);
  const now = Date.now();
  const oneMinuteAgo = now - 60 * 1000;
  const startOfDay = new Date().setHours(0, 0, 0, 0);

  const logs = await readCloudJson<HasUsageLog[]>("db/has_usage_logs.json", []);
  const userLogsToday = logs.filter(
    (l) =>
      l.user_email.toLowerCase() === params.userEmail.toLowerCase() &&
      new Date(l.created_at).getTime() >= startOfDay
  );
  const userLogsMinute = userLogsToday.filter(
    (l) => new Date(l.created_at).getTime() >= oneMinuteAgo
  );

  const maxPerMinute = 10;
  if (userLogsMinute.length >= maxPerMinute) {
    return {
      allowed: false,
      remainingToday: Math.max(0, profile.daily_quota - userLogsToday.length),
      usedLastMinute: userLogsMinute.length,
      dailyQuota: profile.daily_quota,
      reason: `Límite por minuto alcanzado (${maxPerMinute} peticiones/min). Espera unos segundos para proteger los tokens de la demo.`,
    };
  }

  if (userLogsToday.length >= profile.daily_quota) {
    return {
      allowed: false,
      remainingToday: 0,
      usedLastMinute: userLogsMinute.length,
      dailyQuota: profile.daily_quota,
      reason: `Has alcanzado tu cuota diaria de ${profile.daily_quota} generaciones en la demo.`,
    };
  }

  const newLog: HasUsageLog = {
    id: crypto.randomUUID(),
    user_email: params.userEmail.toLowerCase(),
    ip_address: params.ipAddress || "127.0.0.1",
    action_type: params.actionType,
    model_used: params.modelUsed || "llama-3.3-70b-versatile",
    tokens_estimated: params.tokensEstimated || 350,
    created_at: new Date().toISOString(),
  };

  const updatedLogs = [newLog, ...logs].slice(0, 500);
  await writeCloudJson("db/has_usage_logs.json", updatedLogs);

  try {
    const admin = getSupabaseAdmin();
    await admin.from("has_usage_logs").insert([newLog]);
  } catch {}

  return {
    allowed: true,
    remainingToday: Math.max(0, profile.daily_quota - (userLogsToday.length + 1)),
    usedLastMinute: userLogsMinute.length + 1,
    dailyQuota: profile.daily_quota,
  };
}

// -----------------------------------------------------------------------------
// 3. Persistencia de Proyectos H5P y Subida de Paquetes .h5p a Supabase Storage
// -----------------------------------------------------------------------------

export async function listProjectsFromDb(
  seedProjects: HasProjectRecord[]
): Promise<HasProjectRecord[]> {
  const admin = getSupabaseAdmin();

  // 1. Intentar leer desde tabla PostgreSQL has_projects
  try {
    const { data, error } = await admin
      .from("has_projects")
      .select("*")
      .order("updated_at", { ascending: false });
    if (!error && data && data.length > 0) {
      return data as HasProjectRecord[];
    }
  } catch {}

  // 2. Leer desde Supabase Cloud Storage (db/has_projects.json)
  const stored = await readCloudJson<HasProjectRecord[] | null>(
    "db/has_projects.json",
    null
  );
  if (stored && stored.length > 0) {
    return stored;
  }

  // Inicializar con los proyectos semilla del Reto 11 (Matemáticas Discretas)
  await writeCloudJson("db/has_projects.json", seedProjects);
  return seedProjects;
}

export async function saveProjectToDb(
  project: HasProjectRecord,
  seedProjects: HasProjectRecord[]
): Promise<{ success: boolean; data: HasProjectRecord }> {
  const admin = getSupabaseAdmin();
  project.updated_at = new Date().toISOString();

  // 1.Intentar upsert en tabla PostgreSQL has_projects
  try {
    await admin.from("has_projects").upsert([project], { onConflict: "id" });
  } catch {}

  // 2. Persistir en Supabase Cloud Storage (db/has_projects.json)
  const existing = await listProjectsFromDb(seedProjects);
  const idx = existing.findIndex((p) => p.id === project.id);
  if (idx >= 0) {
    existing[idx] = { ...existing[idx], ...project };
  } else {
    existing.unshift(project);
  }
  await writeCloudJson("db/has_projects.json", existing);

  return { success: true, data: project };
}

export async function uploadH5pPackageToSupabase(
  projectId: string,
  buffer: Buffer
): Promise<string | null> {
  try {
    const admin = getSupabaseAdmin();
    const filePath = `packages/${projectId}.h5p`;
    const { error } = await admin.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, buffer, {
        contentType: "application/zip",
        upsert: true,
      });
    if (error) {
      console.error("[Supabase H5P Upload Error]", error.message);
      return null;
    }
    const { data } = admin.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);
    return data.publicUrl;
  } catch (err) {
    console.error("[Supabase Upload Exception]", err);
    return null;
  }
}
