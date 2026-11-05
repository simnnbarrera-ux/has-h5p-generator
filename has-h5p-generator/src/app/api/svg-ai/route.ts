import { NextRequest, NextResponse } from "next/server";
import { checkAndLogRateLimit } from "@/lib/supabase";

export const runtime = "nodejs";
export const maxDuration = 45;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      topic = "Diagrama técnico UAO",
      userEmail = "oswaldo.rodriguez@uao.edu.co",
    } = body;

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const rateCheck = await checkAndLogRateLimit({
      userEmail,
      ipAddress: ip,
      actionType: "svg_diagram",
      modelUsed: "gemini-3-flash-preview",
      tokensEstimated: 600,
    });

    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: rateCheck.reason || "Límite de cuota excedido." },
        { status: 429 }
      );
    }

    const gemKey =
      process.env.GEMINI_API_KEY || "";

    const prompt = `Genera un objeto JSON con los siguientes campos para un diagrama educativo de ingeniería de la Universidad Autónoma de Occidente (UAO) sobre el tema: "${topic}":
{
  "title": "Título corto del diagrama (máximo 45 caracteres)",
  "subtitle": "Subtítulo explicativo (máximo 65 caracteres)",
  "formula": "Fórmula o expresión técnica clave (ej. (−1)^S × 1.M × 2^(E−127))",
  "highlights": ["Punto clave 1", "Punto clave 2", "Punto clave 3"],
  "altText": "Descripción detallada WCAG del diagrama para lectores de pantalla"
}
Devuelve únicamente el objeto JSON válido.`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${encodeURIComponent(
        gemKey
      )}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.3,
          },
        }),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json(
        { error: "Error en Gemini API al diseñar diagrama.", details: errText },
        { status: res.status }
      );
    }

    const data = await res.json();
    const rawText =
      data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    const parsed = JSON.parse(rawText);

    return NextResponse.json({
      customSvg: {
        title: parsed.title || topic,
        subtitle: parsed.subtitle || "Facultad de Ingeniería y Ciencias Básicas UAO",
        formula: parsed.formula || "",
        highlights: Array.isArray(parsed.highlights)
          ? parsed.highlights.slice(0, 3)
          : [],
      },
      altText: parsed.altText || topic,
      remainingToday: rateCheck.remainingToday,
    });
  } catch (err: any) {
    console.error("[/api/svg-ai Error]", err);
    return NextResponse.json(
      {
        error: "No se pudo generar el diagrama con Gemini.",
        details: err?.message || String(err),
      },
      { status: 500 }
    );
  }
}
