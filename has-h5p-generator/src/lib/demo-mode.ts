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

export const DEMO_CREDENTIALS: Record<DemoProfileName, { email: string; password: string }> = {
  Alex: { email: "alex.has@has.com", password: "HasPrueba2026!" },
  Hermaioni: { email: "hermaioni.has@has.com", password: "HasPrueba2026!" },
  Simón: { email: "simon.has@has.com", password: "HasPrueba2026!" },
  Oswaldo: { email: "oswaldo.has@has.com", password: "HasPrueba2026!" },
  Demo: { email: "demo.has@has.com", password: "HasPrueba2026!" },
};

/** Perfil activo de prueba con cuota y permisos completos de creación y edición. */
export function createDemoProfile(name: DemoProfileName): HasProfile {
  const creds = DEMO_CREDENTIALS[name];
  return {
    email: creds ? creds.email : `${DEMO_PROFILE_SLUGS[name]}@has.com`,
    full_name: name,
    faculty: "Facultad de Ingeniería y Ciencias Básicas",
    program: "Campus Digital UAO",
    role: name === "Simón" || name === "Hermaioni" || name === "Alex" ? "admin" : "professor",
    daily_quota: 50,
    preferred_voice: "es-CO-SalomeNeural",
  };
}
