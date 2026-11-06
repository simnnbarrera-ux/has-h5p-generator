import { createClient, type User } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://jpwpuesdjrezlmpfjymt.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_FMP6jyq0Qn1itslbvmT_Rw_RTX_Ijxb";

/** Verify the bearer token against Supabase Auth; never trust client-supplied email. */
export async function getRequestUser(req: NextRequest): Promise<User | null> {
  const header = req.headers.get("authorization") || "";
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match) return null;
  const token = match[1].trim();
  if (!token || token.length > 8192) return null;

  try {
    const client = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
    const { data, error } = await client.auth.getUser(token);
    if (error || !data.user || !data.user.id || !data.user.email) return null;
    return data.user;
  } catch {
    return null;
  }
}

export function getTrustedClientIp(req: NextRequest): string {
  const value =
    req.headers.get("x-real-ip") ||
    req.headers.get("x-vercel-forwarded-for") ||
    "unknown";
  return value.split(",")[0].trim().slice(0, 80) || "unknown";
}
