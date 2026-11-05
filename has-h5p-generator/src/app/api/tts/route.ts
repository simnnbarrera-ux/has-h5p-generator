import { NextRequest, NextResponse } from "next/server";
import { synthesizeEdgeTtsMp3 } from "@/lib/tts-server";
import { checkAndLogRateLimit } from "@/lib/supabase";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      text,
      voice = "es-CO-SalomeNeural",
      rate = "+0%",
      userEmail = "oswaldo.rodriguez@uao.edu.co",
    } = body;

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "El campo 'text' es obligatorio para generar el audio." },
        { status: 400 }
      );
    }

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const rateCheck = await checkAndLogRateLimit({
      userEmail,
      ipAddress: ip,
      actionType: "tts_audio",
      modelUsed: `institutional-voice:${voice}`,
      tokensEstimated: Math.ceil(text.length / 4),
    });

    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: rateCheck.reason || "Límite de peticiones excedido." },
        { status: 429 }
      );
    }

    const { buffer, voiceId } = await synthesizeEdgeTtsMp3(
      text,
      voice,
      rate
    );

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": String(buffer.length),
        "X-Voice-Used": voiceId,
        "X-TTS-Engine": "institutional-voice",
        "X-Quota-Remaining": String(rateCheck.remainingToday),
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err: any) {
    console.error("[/api/tts Error]", err);
    return NextResponse.json(
      {
        error: "No se pudo sintetizar el audio institucional.",
        details: err?.message || String(err),
      },
      { status: 500 }
    );
  }
}
