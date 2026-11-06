import type { HasProfile } from "./supabase";

export const DEMO_PROFILE_NAMES = [
  "Alex",
  "Hermaioni",
  "Simón",
  "Oswaldo",
  "Demo",
] as const;

export type DemoProfileName = (typeof DEMO_PROFILE_NAMES)[number];

const DEMO_PROFILE_SLUGS: Record<DemoProfileName, string> = {
  Alex: "alex",
  Hermaioni: "hermaioni",
  Simón: "simon",
  Oswaldo: "oswaldo",
  Demo: "demo",
};

/** Synthetic client-only identity. It is never sent to Supabase or an API. */
export function createDemoProfile(name: DemoProfileName): HasProfile {
  return {
    email: `${DEMO_PROFILE_SLUGS[name]}@demo.invalid`,
    full_name: name,
    faculty: "Perfil ficticio de demostración",
    program: "Muestras públicas UAO",
    role: "professor",
    daily_quota: 0,
    preferred_voice: "es-CO-SalomeNeural",
  };
}
