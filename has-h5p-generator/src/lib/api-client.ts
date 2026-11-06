import { supabasePublic } from "@/lib/supabase";

/**
 * Fetch del frontend. Lee la sesión vigente justo antes de cada petición y
 * propaga el access token cuando Supabase tiene una sesión autenticada.
 */
export async function apiFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  const { data } = await supabasePublic.auth.getSession();
  const headers = new Headers(init.headers);
  const accessToken = data.session?.access_token;

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  return fetch(input, {
    ...init,
    headers,
  });
}
