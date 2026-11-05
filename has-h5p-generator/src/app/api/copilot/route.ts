import { NextRequest, NextResponse } from "next/server";
import { checkAndLogRateLimit } from "@/lib/supabase";
import { H5P_ACTIVITY_CATALOG } from "@/lib/h5p-catalog";
import { HasProjectSpec } from "@/lib/h5p-engine";

export const runtime = "nodejs";
export const maxDuration = 60;

const CATALOG_SUMMARY = H5P_ACTIVITY_CATALOG.map(
  (a) => `- ${a.id} (${a.spanishName} / ${a.name}, ${a.library}): ${a.pedagogicalUse}`
).join("\n");

const SYSTEM_PROMPT_CHAT = `Eres HAS Copilot (Hermaioni, Alex, Simón — Equipo 36 Digitatón UAO 2026), un Arquitecto Pedagógico de Recursos Educativos Digitales (RED) especializado en el estándar H5P.CoursePresentation 1.27 y Moodle mod_hvp 1.28.3 de la Universidad Autónoma de Occidente (UAO).

Tu objetivo es conversar en lenguaje natural con el profesor para co-diseñar actividades H5P interactivas, rigurosas, con diseño universal de aprendizaje (DUA/WCAG), diagramas vectoriales SVG, narraciones de voz con síntesis académica institucional y referencias APA 7.ª edición.

Tienes a tu disposición las siguientes 19 mecánicas interactivas H5P compatibles con el campus virtual UAO sin requerir permisos de administrador:
${CATALOG_SUMMARY}

Reglas de tu respuesta en modo conversación:
1. Sé cálido, conciso, estructurado y orientado a la acción docente.
2. Propón una estructura de diapositivas siguiendo la plantilla institucional UAO (Portada, ¿Qué aprenderás?, Evidencia, Ruta de 4 pasos, Pasos con Fuente y Analiza y responde, Afianza, Aplica, Verifica, Cierre y Referencias APA).
3. Sugiere al profesor qué tipos de actividades de las 19 disponibles encajan mejor y pregúntale si desea generar también el Libro de Moodle o auditar su maqueta Word.`;

const SYSTEM_PROMPT_GENERATE = `Eres el compilador estructurado de HAS H5P Generator (Universidad Autónoma de Occidente).
A partir de la solicitud del profesor o del texto de su maqueta docente, debes devolver ÚNICAMENTE un objeto JSON válido que cumpla la interfaz HasProjectSpec (sin bloques markdown fuera del JSON).

Reglas obligatorias del JSON:
1. "templateId" debe ser una de las 9 plantillas de diseño: "plantilla-1", "plantilla-2", "plantilla-3", "plantilla-4", "plantilla-5", "plantilla-6", "plantilla-7", "plantilla-8", "plantilla-9".
2. "templateSlide" corresponde a las 9 plantillas de estructura:
   - 2 (Plantilla 1: Portada Institucional)
   - 5 (Plantilla 2: Objetivos de Aprendizaje con 3 tarjetas en "stepsCards")
   - 6 (Plantilla 3: Ruta de Aprendizaje con 4 estaciones en "stepsCards")
   - 9 o 4 (Plantilla 4: Estación con Esquema Técnico SVG/PNG)
   - 14 (Plantilla 5: Fuentes y Enlaces de Estudio con "links" y "apaReferences")
   - 19 (Plantilla 6: Debate en Encuentro Sincrónico y foco académico)
   - 25 (Plantilla 7: Laboratorio Interactivo con interactividad H5P en "interaction")
   - 31 (Plantilla 8: Cierre de Actividad)
   - 32 (Plantilla 9: Referencias Bibliográficas en "apaReferences")
3. Los tipos válidos para "interaction.type" son:
   "single_choice_set", "multi_choice", "drag_text", "blanks", "true_false", "mark_the_words", "summary", "dialogcards", "exportable_text_area", "interactive_table", "sort_algorithm_steps", "combination_lock", "chat_simulator", "game_map_route".
4. En "single_choice_set", cada pregunta en "questions" tiene "question" y "answers" (donde la PRIMERA respuesta es siempre la correcta).
5. En "drag_text", "blanks", "mark_the_words" y "combination_lock", usa "textField" poniendo entre *asteriscos* las palabras clave ocultas o arrastrables.
6. En cada diapositiva clave, incluye "audioNarration": { "text": "...", "voice": "..." } para que el motor de síntesis de voz académica institucional sintetice la locución en español o inglés.
7. Incluye "auditReport" (arreglo de observaciones pedagógicas y mejoras aplicadas) y "textChanges" (arreglo de ajustes de extensión < 200 caracteres).

Estructura exacta esperada:
{
  "id": "slug-unico-del-proyecto",
  "title": "Título de la Actividad",
  "courseName": "Nombre del Curso",
  "moduleName": "Módulo 1",
  "activityNumber": 1,
  "templateId": "plantilla-1",
  "defaultVoice": "es-CO-SalomeNeural",
  "includeNavigationGuide": false,
  "slides": [
    {
      "id": "s1",
      "key": "portada",
      "templateSlide": 2,
      "menuTitle": "Título corto <= 30 chars",
      "titleBlack": "Primera parte del título ",
      "titleAccent": "parte resaltada en azul",
      "subtitle": "Subtítulo corto",
      "paragraphs": ["Párrafo 1", "Párrafo 2"],
      "highlightBox": "Texto destacado opcional",
      "apaReferences": ["Autor, A. (2023). Título. Editorial."],
      "audioNarration": {
        "text": "Guion de locución claro para el estudiante.",
        "voice": "es-CO-SalomeNeural"
      },
      "interaction": {
        "type": "single_choice_set",
        "instruction": "Selecciona la respuesta correcta:",
        "feedback": "Retroalimentación menor a 190 caracteres.",
        "questions": [
          {
            "question": "¿Pregunta?",
            "answers": ["Respuesta correcta", "Distractor 1", "Distractor 2"]
          }
        ]
      }
    }
  ],
  "auditReport": ["Observación 1"],
  "textChanges": ["Ajuste 1"]
}`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      mode = "chat",
      prompt = "",
      messages = [],
      selectedActivities = [
        "single_choice_set",
        "drag_text",
        "dialogcards",
        "combination_lock",
      ],
      preferredVoice = "es-CO-SalomeNeural",
      courseName = "Matemáticas Discretas",
      userEmail = "oswaldo.rodriguez@uao.edu.co",
    } = body;

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const rateCheck = await checkAndLogRateLimit({
      userEmail,
      ipAddress: ip,
      actionType: mode === "generate" ? "mockup_import" : "copilot_chat",
      modelUsed: "openai/gpt-oss-120b",
      tokensEstimated: mode === "generate" ? 1800 : 500,
    });

    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: rateCheck.reason || "Límite de cuota excedido." },
        { status: 429 }
      );
    }

    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
      return NextResponse.json(
        { error: "Servicio de Asistente IA no configurado en el servidor." },
        { status: 500 }
      );
    }

    if (mode === "generate") {
      const userPrompt = `Diseña y compila un proyecto H5P completo (HasProjectSpec) para el curso "${courseName}".
Voz institucional seleccionada: "${preferredVoice}".
Tipos de actividades interactivas solicitadas por el profesor: ${selectedActivities.join(", ")}.

Instrucción o maqueta del profesor:
${prompt}

Genera entre 8 y 14 diapositivas bien estructuradas siguiendo la plantilla UAO fiuao-6-215, incluyendo al menos 4 interacciones de los tipos solicitados, locución en audioNarration y referencias APA 7.`;

      const groqRes = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${groqKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "openai/gpt-oss-120b",
            temperature: 0.35,
            max_tokens: 6000,
            response_format: { type: "json_object" },
            messages: [
              { role: "system", content: SYSTEM_PROMPT_GENERATE },
              { role: "user", content: userPrompt },
            ],
          }),
        }
      );

      if (!groqRes.ok) {
        const errText = await groqRes.text();
        return NextResponse.json(
          { error: "Error en el Asistente de Autoría IA al generar el proyecto H5P.", details: errText },
          { status: groqRes.status }
        );
      }

      const data = await groqRes.json();
      const rawJson = data.choices?.[0]?.message?.content || "{}";
      const parsedSpec = JSON.parse(rawJson) as HasProjectSpec;

      // Garantizar campos requeridos
      parsedSpec.id =
        parsedSpec.id ||
        `h5p-uao-${Date.now().toString(36)}`;
      parsedSpec.templateId = parsedSpec.templateId || "plantilla-1";
      parsedSpec.defaultVoice = preferredVoice;

      return NextResponse.json({
        spec: parsedSpec,
        remainingToday: rateCheck.remainingToday,
        dailyQuota: rateCheck.dailyQuota,
      });
    } else {
      // Modo conversación pedagógica
      const chatMessages = [
        { role: "system", content: SYSTEM_PROMPT_CHAT },
        ...messages.slice(-8),
        ...(prompt
          ? [
              {
                role: "user",
                content: `[Curso: ${courseName} | Voz activa: ${preferredVoice} | Actividades marcadas: ${selectedActivities.join(
                  ", "
                )}]\n\n${prompt}`,
              },
            ]
          : []),
      ];

      const groqRes = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${groqKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "openai/gpt-oss-120b",
            temperature: 0.5,
            max_tokens: 1400,
            messages: chatMessages,
          }),
        }
      );

      if (!groqRes.ok) {
        const errText = await groqRes.text();
        return NextResponse.json(
          { error: "Error en el Asistente de Autoría IA.", details: errText },
          { status: groqRes.status }
        );
      }

      const data = await groqRes.json();
      const reply =
        data.choices?.[0]?.message?.content ||
        "Estoy listo para ayudarte a diseñar tu recurso H5P.";

      return NextResponse.json({
        reply,
        remainingToday: rateCheck.remainingToday,
        dailyQuota: rateCheck.dailyQuota,
      });
    }
  } catch (err: any) {
    console.error("[/api/copilot Error]", err);
    return NextResponse.json(
      {
        error: "Error en el orquestador IA.",
        details: err?.message || String(err),
      },
      { status: 500 }
    );
  }
}
