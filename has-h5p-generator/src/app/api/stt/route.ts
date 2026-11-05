import { NextRequest, NextResponse } from "next/server";
import { checkAndLogRateLimit } from "@/lib/supabase";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get("file") as File | null;
    const userEmail =
      (formData.get("userEmail") as string) || "oswaldo.rodriguez@uao.edu.co";
    const language = (formData.get("language") as string) || "es";

    if (!audioFile) {
      return NextResponse.json(
        { error: "No se recibió el archivo de audio para transcripción." },
        { status: 400 }
      );
    }

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const rateCheck = await checkAndLogRateLimit({
      userEmail,
      ipAddress: ip,
      actionType: "stt_whisper",
      modelUsed: "whisper-large-v3",
      tokensEstimated: 150,
    });

    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: rateCheck.reason || "Límite de peticiones excedido." },
        { status: 429 }
      );
    }

    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
      return NextResponse.json(
        { error: "Servicio de transcripción por voz no configurado en el servidor." },
        { status: 500 }
      );
    }

    const groqForm = new FormData();
    groqForm.append("file", audioFile, audioFile.name || "grabacion.webm");
    groqForm.append("model", "whisper-large-v3");
    groqForm.append("language", language);
    groqForm.append("response_format", "json");

    const response = await fetch(
      "https://api.groq.com/openai/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${groqKey}`,
        },
        body: groqForm,
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("[Servicio de Transcripción Error]", errText);
      return NextResponse.json(
        {
          error: "Error en el Servicio de Transcripción.",
          details: errText,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      text: data.text || "",
      remainingToday: rateCheck.remainingToday,
      dailyQuota: rateCheck.dailyQuota,
    });
  } catch (err: any) {
    console.error("[/api/stt Error]", err);
    return NextResponse.json(
      {
        error: "Error procesando el audio en el Servicio de Transcripción.",
        details: err?.message || String(err),
      },
      { status: 500 }
    );
  }
}
