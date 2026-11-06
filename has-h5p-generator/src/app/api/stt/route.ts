import { NextRequest, NextResponse } from "next/server";
import { getRequestUser, getTrustedClientIp } from "@/lib/api-auth";
import { checkAndLogRateLimit, getOrCreateProfile } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const maxDuration = 45;
const MAX_AUDIO_BYTES = 4 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const user = await getRequestUser(req);
  if (!user) return NextResponse.json({ error: "Inicia sesión para transcribir audio." }, { status: 401 });
  const declaredLength = Number(req.headers.get("content-length") || 0);
  if (declaredLength > MAX_AUDIO_BYTES + 64 * 1024) {
    return NextResponse.json({ error: "El audio supera el límite de 4 MB." }, { status: 413 });
  }

  try {
    const formData = await req.formData();
    const audioFile = formData.get("file");
    if (!(audioFile instanceof File)) {
      return NextResponse.json({ error: "Adjunta el audio en el campo `file`." }, { status: 400 });
    }
    if (audioFile.size < 1 || audioFile.size > MAX_AUDIO_BYTES) {
      return NextResponse.json({ error: "El audio está vacío o supera el límite de 4 MB." }, { status: 413 });
    }
    if (!audioFile.type.toLowerCase().startsWith("audio/")) {
      return NextResponse.json({ error: "Formato no permitido; usa WebM, WAV, MP3, OGG o MP4 audio." }, { status: 415 });
    }

    const languageInput = formData.get("language");
    const language = typeof languageInput === "string" && /^[a-z]{2,3}$/i.test(languageInput)
      ? languageInput.toLowerCase()
      : "es";
    const profile = await getOrCreateProfile(user);
    const quota = await checkAndLogRateLimit({
      userId: user.id,
      userEmail: profile.email,
      ipAddress: getTrustedClientIp(req),
      actionType: "stt_whisper",
      modelUsed: "whisper-large-v3",
      tokensEstimated: Math.max(1, Math.ceil(audioFile.size / 1024)),
    });
    if (!quota.allowed) {
      return NextResponse.json({ error: quota.reason || "Límite de peticiones excedido.", ...quota }, { status: 429 });
    }

    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) return NextResponse.json({ error: "El servicio de transcripción no está configurado." }, { status: 503 });

    const upstreamForm = new FormData();
    const safeName = audioFile.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || "dictation.webm";
    upstreamForm.append("file", audioFile, safeName);
    upstreamForm.append("model", "whisper-large-v3");
    upstreamForm.append("language", language);
    upstreamForm.append("response_format", "json");

    const upstream = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${groqKey}` },
      body: upstreamForm,
      signal: AbortSignal.timeout(40_000),
      cache: "no-store",
    });
    if (!upstream.ok) {
      console.error("[STT] Groq devolvió estado", upstream.status);
      return NextResponse.json({ error: "El proveedor de transcripción no pudo procesar el audio." }, { status: 502 });
    }
    const result = await upstream.json();
    return NextResponse.json({
      text: typeof result.text === "string" ? result.text.slice(0, 20_000) : "",
      remainingToday: quota.remainingToday,
      dailyQuota: quota.dailyQuota,
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("[/api/stt]", error);
    return NextResponse.json({ error: "No fue posible procesar el audio." }, { status: 503 });
  }
}
