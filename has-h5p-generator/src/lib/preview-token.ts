import { createHmac, timingSafeEqual } from "node:crypto";

export const PREVIEW_COOKIE_NAME = "has_h5p_preview";
export const PREVIEW_TOKEN_TTL_SECONDS = 5 * 60;

interface PreviewClaims {
  sub: string;
  projectId: string;
  exp: number;
}

function signingSecret(): string {
  const secret =
    process.env.PREVIEW_TOKEN_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    "";
  if (secret.length < 32) throw new Error("Falta un secreto de servidor válido para firmar previews.");
  return secret;
}

function signature(payload: string): Buffer {
  return createHmac("sha256", signingSecret()).update(payload).digest();
}

export function createPreviewToken(userId: string, projectId: string): string {
  const claims: PreviewClaims = {
    sub: userId,
    projectId,
    exp: Math.floor(Date.now() / 1000) + PREVIEW_TOKEN_TTL_SECONDS,
  };
  const payload = Buffer.from(JSON.stringify(claims)).toString("base64url");
  const signed = signature(payload).toString("base64url");
  return `${payload}.${signed}`;
}

export function verifyPreviewToken(token: string | undefined, projectId: string): PreviewClaims | null {
  if (!token || token.length > 2_048) return null;
  const [payload, encodedSignature, extra] = token.split(".");
  if (!payload || !encodedSignature || extra) return null;
  try {
    const expected = signature(payload);
    const actual = Buffer.from(encodedSignature, "base64url");
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as PreviewClaims;
    if (
      typeof claims.sub !== "string" ||
      typeof claims.projectId !== "string" ||
      claims.projectId !== projectId ||
      !Number.isInteger(claims.exp) ||
      claims.exp <= Math.floor(Date.now() / 1000)
    ) return null;
    return claims;
  } catch {
    return null;
  }
}
