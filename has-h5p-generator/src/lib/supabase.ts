import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://jpwpuesdjrezlmpfjymt.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_FMP6jyq0Qn1itslbvmT_Rw_RTX_Ijxb";

/** Public browser client. Never place a service-role/secret key in this module. */
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
  auth_user_id?: string;
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
  auth_user_id?: string;
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
  storage_path?: string | null;
  slides_count: number;
  interactions_count: number;
  status: "draft" | "generating" | "ready" | "error";
  created_at: string;
  updated_at: string;
}
