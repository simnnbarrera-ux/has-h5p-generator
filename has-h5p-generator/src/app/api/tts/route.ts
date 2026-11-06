import { NextRequest, NextResponse } from "next/server";
import { synthesizeEdgeTtsMp3, isAllowedTtsVoice } from "@/lib/tts-server";
import { getRequestUser, getTrustedClientIp } from "@/lib/api-auth";
import { checkAndLogRateLimit, getOrCreateProfile } from "@/lib/supabase-server";
import { ProjectValidationError, readBoundedJson } from "@/lib/project-validation";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const user = await getRequestUser(req);
  if (!user) return NextResponse.json({ error: "Inicia sesión para generar audio." }, { status: 401 });
  try {
    const body = await readBoundedJson<Record<string, unknown>>(req, 16_384);
    const text = typeof body.text === "string" ? body.text.trim() : "";
    const voice = typeof body.voice === "string" ? body.voice : "es-CO-SalomeNeural";
    const rate = typeof body.rate === "string" ? body.rate : "+0%";
    if (!text || text.length > 1_800) {
      return NextResponse.json({ error: "El texto debe tener entre 1 y 1.800 caracteres." }, { status: 400 });
    }
    if (!isAllowedTtsVoice(voice)) {
      return NextResponse.json({ error: "La voz seleccionada no está disponible." }, { status: 400 });
    }
    const rateMatch = /^([+-])(\d{1,2})%$/.exec(rate);
    if (!rateMatch || Number(rateMatch[2]) > 20) {
      return NextResponse.json({ error: "La velocidad debe estar entre -20% y +20%." }, { status: 400 });
    }

    const profile = await getOrCreateProfile(user);
    const quota = await checkAndLogRateLimit({
      userId: user.id,
      userEmail: profile.email,
      ipAddress: getTrustedClientIp(req),
      actionType: "tts_audio",
      modelUsed: `institutional-voice:${voice}`,
      tokensEstimated: Math.ceil(text.length / 4),
    });
    if (!quota.allowed) {
      return NextResponse.json({ error: quota.reason || "Límite de peticiones excedido.", ...quota }, { status: 429 });
    }

    const result = await synthesizeEdgeTtsMp3(text, voice, rate);
    return new NextResponse(new Uint8Array(result.buffer), {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": String(result.buffer.length),
        "X-Voice-Used": result.voiceId,
        "X-Quota-Remaining": String(quota.remainingToday),
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("[/api/tts]", error);
    return error instanceof ProjectValidationError
      ? NextResponse.json({ error: error.message }, { status: 400 })
      : NextResponse.json({ error: "No fue posible sintetizar el audio." }, { status: 503 });
  }
}
