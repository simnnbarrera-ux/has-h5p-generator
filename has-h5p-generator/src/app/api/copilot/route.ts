import { NextRequest, NextResponse } from "next/server";
import { getRequestUser, getTrustedClientIp } from "@/lib/api-auth";
import { checkAndLogRateLimit, getOrCreateProfile } from "@/lib/supabase-server";
import { H5P_ACTIVITY_CATALOG } from "@/lib/h5p-catalog";
import { ProjectValidationError, readBoundedJson, validateProjectSpec } from "@/lib/project-validation";

export const runtime = "nodejs";
export const maxDuration = 60;

const CATALOG_SUMMARY = H5P_ACTIVITY_CATALOG.map(
  (activity) => `- ${activity.id}: ${activity.spanishName} — ${activity.pedagogicalUse}`
).join("\n");
const SYSTEM_PROMPT_CHAT = `Eres HAS Copilot, un asistente pedagógico para diseñar recursos H5P accesibles y rigurosos para docentes de UAO. Responde en español, con propuestas concretas, breves y útiles. Actividades disponibles:\n${CATALOG_SUMMARY}`;
const SYSTEM_PROMPT_GENERATE = `Devuelve únicamente JSON válido para un proyecto educativo H5P. Debe tener id, title, courseName, moduleName, activityNumber, templateId, defaultVoice, includeNavigationGuide, slides, auditReport y textChanges. Cada slide tiene id, templateSlide entero entre 1 y 32, menuTitle, titleBlack, paragraphs (lista) y puede incluir interaction/audioNarration. No escribas HTML ejecutable, scripts ni URLs data:. Usa textos docentes y referencias verificables si se proporcionan.`;

function trimText(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(req: NextRequest) {
  const user = await getRequestUser(req);
  if (!user) return NextResponse.json({ error: "Inicia sesión para usar el asistente." }, { status: 401 });
  try {
    const body = await readBoundedJson<Record<string, any>>(req, 256_000);
    const mode = body.mode === "generate" ? "generate" : "chat";
    const prompt = trimText(body.prompt, 12_000);
    const courseName = trimText(body.courseName, 200) || "Curso";
    const preferredVoice = trimText(body.preferredVoice, 80) || "es-CO-SalomeNeural";
    const catalogIds = new Set(H5P_ACTIVITY_CATALOG.map((activity) => activity.id));
    const selectedActivities = Array.isArray(body.selectedActivities)
      ? body.selectedActivities.filter((id: unknown): id is string => typeof id === "string" && catalogIds.has(id)).slice(0, 12)
      : [];
    const inputMessages = Array.isArray(body.messages) ? body.messages.slice(-12) : [];
    const messages = inputMessages.flatMap((message: any) => {
      if (!message || !["user", "assistant"].includes(message.role) || typeof message.content !== "string") return [];
      const content = message.content.trim().slice(0, 8_000);
      return content ? [{ role: message.role as "user" | "assistant", content }] : [];
    });
    if (mode === "generate" && !prompt) {
      return NextResponse.json({ error: "Incluye una instrucción para generar el recurso." }, { status: 400 });
    }
    if (mode === "chat" && messages.length === 0 && !prompt) {
      return NextResponse.json({ error: "Escribe un mensaje para el asistente." }, { status: 400 });
    }

    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) return NextResponse.json({ error: "El servicio de autoría IA no está configurado." }, { status: 503 });
    const profile = await getOrCreateProfile(user);
    const quota = await checkAndLogRateLimit({
      userId: user.id,
      userEmail: profile.email,
      ipAddress: getTrustedClientIp(req),
      actionType: mode === "generate" ? "mockup_import" : "copilot_chat",
      modelUsed: "openai/gpt-oss-120b",
      tokensEstimated: mode === "generate" ? 2_000 : 600,
    });
    if (!quota.allowed) {
      return NextResponse.json({ error: quota.reason || "Límite de cuota excedido.", ...quota }, { status: 429 });
    }

    const contextPrefix = `[Curso: ${courseName}; voz: ${preferredVoice}; actividades: ${selectedActivities.join(", ") || "por definir"}]\n\n`;
    const chatMessages = mode === "chat"
      ? [
          { role: "system", content: SYSTEM_PROMPT_CHAT },
          ...messages.map((message, index) => index === 0 && message.role === "user"
            ? { ...message, content: `${contextPrefix}${message.content}` }
            : message),
          ...(prompt && !messages.length ? [{ role: "user", content: `${contextPrefix}${prompt}` }] : []),
        ]
      : [
          { role: "system", content: SYSTEM_PROMPT_GENERATE },
          { role: "user", content: `${contextPrefix}${prompt}\n\nActividades seleccionadas: ${selectedActivities.join(", ") || "single_choice_set, drag_text"}` },
        ];

    const upstream = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${groqKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        temperature: mode === "generate" ? 0.35 : 0.5,
        max_tokens: mode === "generate" ? 7_000 : 1_400,
        ...(mode === "generate" ? { response_format: { type: "json_object" } } : {}),
        messages: chatMessages,
      }),
      signal: AbortSignal.timeout(50_000),
      cache: "no-store",
    });
    if (!upstream.ok) {
      console.error("[copilot] Groq devolvió estado", upstream.status);
      return NextResponse.json({ error: "El proveedor de IA no pudo procesar la solicitud." }, { status: 502 });
    }
    const result = await upstream.json();
    const content = result.choices?.[0]?.message?.content;
    if (typeof content !== "string" || content.length > 200_000) {
      return NextResponse.json({ error: "El proveedor devolvió una respuesta inválida." }, { status: 502 });
    }

    if (mode === "generate") {
      let parsed: unknown;
      try { parsed = JSON.parse(content); } catch {
        return NextResponse.json({ error: "La IA no devolvió un recurso JSON válido; inténtalo de nuevo." }, { status: 502 });
      }
      let spec: ReturnType<typeof validateProjectSpec>;
      try { spec = validateProjectSpec(parsed); } catch {
        return NextResponse.json({ error: "La IA generó un recurso con estructura no válida; inténtalo de nuevo." }, { status: 502 });
      }
      return NextResponse.json({ spec, remainingToday: quota.remainingToday, dailyQuota: quota.dailyQuota }, {
        headers: { "Cache-Control": "private, no-store" },
      });
    }

    return NextResponse.json({
      reply: content.slice(0, 12_000),
      remainingToday: quota.remainingToday,
      dailyQuota: quota.dailyQuota,
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error: any) {
    console.error("[/api/copilot]", error);
    const isInputError = error instanceof ProjectValidationError;
    return NextResponse.json({ error: isInputError ? error.message : "No fue posible procesar la solicitud del asistente." }, { status: isInputError ? 400 : 503 });
  }
}
