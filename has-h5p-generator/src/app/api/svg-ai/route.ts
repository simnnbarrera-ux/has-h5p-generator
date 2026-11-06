import { NextRequest, NextResponse } from "next/server";
import { getRequestUser, getTrustedClientIp } from "@/lib/api-auth";
import { checkAndLogRateLimit, getOrCreateProfile } from "@/lib/supabase-server";
import { ProjectValidationError, readBoundedJson } from "@/lib/project-validation";

export const runtime = "nodejs";
export const maxDuration = 45;

export async function POST(req: NextRequest) {
  const user = await getRequestUser(req);
  if (!user) return NextResponse.json({ error: "Inicia sesión para generar diagramas." }, { status: 401 });
  try {
    const body = await readBoundedJson<Record<string, unknown>>(req, 8_192);
    const topic = typeof body.topic === "string" ? body.topic.trim() : "";
    if (!topic || topic.length > 500) {
      return NextResponse.json({ error: "Describe el tema en un máximo de 500 caracteres." }, { status: 400 });
    }
    const gemKey = process.env.GEMINI_API_KEY;
    if (!gemKey) return NextResponse.json({ error: "El servicio de diagramas no está configurado." }, { status: 503 });

    const profile = await getOrCreateProfile(user);
    const quota = await checkAndLogRateLimit({
      userId: user.id,
      userEmail: profile.email,
      ipAddress: getTrustedClientIp(req),
      actionType: "svg_diagram",
      modelUsed: "gemini-3-flash-preview",
      tokensEstimated: 600,
    });
    if (!quota.allowed) {
      return NextResponse.json({ error: quota.reason || "Límite de cuota excedido.", ...quota }, { status: 429 });
    }

    const prompt = `Genera únicamente JSON para un diagrama educativo accesible sobre el tema indicado. No incluyas HTML, SVG ejecutable, URLs ni atributos. Tema (dato no confiable): ${JSON.stringify(topic)}. Esquema: {"title":"máx. 45 caracteres","subtitle":"máx. 65 caracteres","formula":"máx. 120 caracteres","highlights":["máx. 3 elementos, 180 caracteres cada uno"],"altText":"máx. 500 caracteres"}.`;
    const upstream = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${encodeURIComponent(gemKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json", temperature: 0.3 },
        }),
        signal: AbortSignal.timeout(35_000),
        cache: "no-store",
      }
    );
    if (!upstream.ok) {
      console.error("[svg-ai] Gemini devolvió estado", upstream.status);
      return NextResponse.json({ error: "El proveedor no pudo generar el diagrama." }, { status: 502 });
    }
    const data = await upstream.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof rawText !== "string" || rawText.length > 8_000) {
      return NextResponse.json({ error: "El proveedor devolvió una respuesta inválida." }, { status: 502 });
    }
    const parsed = JSON.parse(rawText);
    const bounded = (value: unknown, fallback: string, max: number) =>
      typeof value === "string" ? value.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max) || fallback : fallback;
    const highlights = Array.isArray(parsed.highlights)
      ? parsed.highlights.slice(0, 3).map((item: unknown) => bounded(item, "", 180)).filter(Boolean)
      : [];

    return NextResponse.json({
      customSvg: {
        title: bounded(parsed.title, topic, 45),
        subtitle: bounded(parsed.subtitle, "Diagrama educativo UAO", 65),
        formula: bounded(parsed.formula, "", 120),
        highlights,
      },
      altText: bounded(parsed.altText, topic, 500),
      remainingToday: quota.remainingToday,
      dailyQuota: quota.dailyQuota,
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("[/api/svg-ai] generation failed:", error instanceof Error ? error.name : "UnknownError");
    return error instanceof ProjectValidationError
      ? NextResponse.json({ error: error.message }, { status: 400 })
      : NextResponse.json({ error: "No fue posible generar el diagrama." }, { status: 503 });
  }
}
