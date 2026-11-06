// =============================================================================
// HAS H5P Generator — Motor Compilador H5P en TypeScript (CoursePresentation 1.27)
// Clona slides de la plantilla UAO fiuao-6-215, inyecta las 19 interactividades,
// diagramas SVG WCAG, audios con Locución Académica (CO), traduce interfaz a Español y
// exporta simultáneamente .h5p + script editable ph5p.py + Libro de Moodle.
// =============================================================================

import JSZip from "jszip";
import {
  UAO_TEMPLATE_COLORS,
  H5P_FONT_OPTIONS,
  getPresentationTemplate,
  findSlideLayout,
} from "./h5p-catalog";
import { getUaoTemplate } from "./uao-template-catalog";
import { getUaoCompositionShapeElements } from "./uao-composition-layouts";
import type { CustomDiagramSpec } from "./custom-diagram";
import {
  BUILTIN_RETO11_SVGS,
  generateCustomDiagramSvg,
  GeneratedSvgAsset,
} from "./svg-diagrams";
import { supportsVisualSpace } from "./visual-space";

export interface SlideInteractionSpec {
  type:
    | "single_choice_set"
    | "multi_choice"
    | "drag_text"
    | "blanks"
    | "true_false"
    | "mark_the_words"
    | "summary"
    | "drag_question"
    | "multimedia_choice"
    | "dialogcards"
    | "audio_quiz"
    | "interactive_video"
    | "exportable_text_area"
    | "audio_recorder"
    | "interactive_table"
    | "sort_algorithm_steps"
    | "combination_lock"
    | "chat_simulator"
    | "game_map_route";
  instruction?: string;
  feedback?: string;
  // SingleChoiceSet / AudioQuiz
  questions?: Array<{
    question: string;
    answers: string[]; // First is always correct
  }>;
  // MultiChoice
  multiChoice?: {
    question: string;
    options: Array<{ text: string; correct: boolean; feedback?: string }>;
  };
  // DragText / Blanks / MarkTheWords / CombinationLock
  textField?: string; // Words between *asterisks*
  // TrueFalse
  trueFalse?: {
    question: string;
    correct: boolean;
  };
  // Dialogcards
  cards?: Array<{
    front: string;
    back: string;
  }>;
  // Summary
  summaryGroups?: Array<{
    statements: string[]; // First is correct
    tip?: string;
  }>;
  // ExportableTextArea
  exportablePrompt?: {
    label: string;
    placeholder: string;
  };
  // Table
  tableData?: {
    headers: string[];
    rows: string[][];
  };
  // Video / InteractiveVideo
  videoUrl?: string;
  // Chat simulator
  chatMessages?: Array<{
    speaker: string;
    role: string;
    text: string;
  }>;
  // DragQuestion / SortParagraphs
  stepsToOrder?: string[];
}

export interface HasSlideSpec {
  id: string;
  key?: string;
  templateSlide: number; // 1..32 from fiuao-6-215
  menuTitle: string; // max 35 chars per UAO spec
  titleBlack: string;
  compositionId?: string;
  titleAccent?: string;
  subtitle?: string;
  paragraphs: string[];
  highlightBox?: string;
  pendingNote?: string;
  bullets?: string[];
  links?: Array<{ label: string; url: string }>;
  stepsCards?: Array<{
    number: string;
    title: string;
    description: string;
    targetKey?: string;
  }>;
  svgDiagramId?: string;
  customSvg?: CustomDiagramSpec;
  reserveVisualSpace?: boolean;
  imagePendingDescription?: string;
  apaReferences?: string[];
  audioNarration?: {
    text: string;
    voice: string;
    audioFilePath?: string; // relative inside content/ e.g. audios/narration-1.mp3
  };
  interaction?: SlideInteractionSpec;
  fontScale?: "compact" | "normal" | "large";
  boxLayout?: "balanced" | "expanded" | "wide";
}

export interface HasProjectSpec {
  id: string;
  title: string;
  courseName: string;
  moduleName: string;
  activityNumber: number;
  templateId: string;
  selectedTemplateId?: string;
  baseTemplateId?: string;
  defaultVoice: string;
  fontFamily?: string;
  globalFontScale?: "compact" | "normal" | "large";
  includeNavigationGuide: boolean; // true only for Actividad 0
  slides: HasSlideSpec[];
  auditReport: string[];
  textChanges: string[];
}

const NEGRO = UAO_TEMPLATE_COLORS.texto;
const AZUL = UAO_TEMPLATE_COLORS.acento;
const FONDO = UAO_TEMPLATE_COLORS.fondo_suave;
const NARANJA = UAO_TEMPLATE_COLORS.pendiente;

export function resolveFontCssStack(fontId?: string): string {
  const found = H5P_FONT_OPTIONS.find((f) => f.id === fontId);
  return found ? found.cssStack : "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif";
}

export function scaleEmSize(
  emStr: string,
  scale: "compact" | "normal" | "large" = "normal"
): string {
  const match = emStr.match(/^([\d.]+)em$/);
  if (!match) return emStr;
  const val = parseFloat(match[1]);
  const factor = scale === "compact" ? 0.88 : scale === "large" ? 1.08 : 1.0;
  return `${Number((val * factor).toFixed(3))}em`;
}

export function joinTitleParts(black: string, accent?: string): string {
  return [black?.trim(), accent?.trim()].filter(Boolean).join(" ");
}

export function escHtml(t: string): string {
  return (t || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function relativeLuminance(hex: string): number | null {
  const match = /^#([\da-f]{3}|[\da-f]{6})$/i.exec(hex);
  if (!match) return null;
  const raw = match[1].length === 3 ? [...match[1]].map((c) => c + c).join("") : match[1];
  const c = [0, 2, 4].map((i) => parseInt(raw.slice(i, i + 2), 16) / 255)
    .map((v) => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

function readableTextColor(color: string, fallback: string): string {
  const l = relativeLuminance(color);
  return l === null || 1.05 / (l + 0.05) < 4.5 ? fallback : color;
}

export function htmlTitulo(
  negro: string,
  azul = "",
  tam = "1.375em",
  tag = "h2",
  fontStack = "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif",
  colorPrimario = NEGRO,
  colorAcento = AZUL
): string {
  const cleanNegro = (negro || "").trim();
  const cleanAzul = (azul || "").trim();
  const readableAccent = readableTextColor(colorAcento, colorPrimario);
  const totalLen = cleanNegro.length + cleanAzul.length;
  let adjustedTam = tam;
  const emMatch = tam.match(/^([\d.]+)em$/);
  if (emMatch) {
    const baseEm = parseFloat(emMatch[1]);
    if (totalLen > 45 && baseEm > 1.15) {
      adjustedTam = "1.15em";
    } else if (totalLen > 30 && baseEm > 1.3) {
      adjustedTam = "1.28em";
    }
  }
  let s = "";
  if (cleanNegro) {
    s = `<span style="font-size:${adjustedTam};color:${colorPrimario};font-family:${fontStack};line-height:1.18;"><strong>${escHtml(
      cleanNegro
    )}</strong></span>`;
  }
  if (cleanAzul) {
    const sep = cleanNegro ? " " : "";
    s += `<span style="font-size:${adjustedTam};color:${readableAccent};font-family:${fontStack};line-height:1.18;"><strong>${sep}${escHtml(
      cleanAzul
    )}</strong></span>`;
  }
  return `<${tag} style="margin:0;line-height:1.18;font-family:${fontStack};">${s}</${tag}>`;
}

export function htmlParrafos(
  ps: string[],
  tam = "0.875em",
  color = NEGRO,
  fontStack = "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif"
): string {
  // Cada salto de línea se convierte en su propio párrafo (listas numeradas, viñetas)
  const lines = ps.flatMap((p) => (p.startsWith("<") ? [p] : p.split(/\r?\n/)));
  return lines
    .filter((p) => p.trim().length > 0)
    .map((p) => {
      if (p.startsWith("<b>")) {
        const clean = p.replace(/^<b>|<\/b>$/g, "");
        return `<p style="margin:0 0 0.45em 0;line-height:1.35;font-family:${fontStack};"><span style="font-size:${tam};color:${color};font-family:${fontStack};"><strong>${escHtml(
          clean
        )}</strong></span></p>`;
      }
      return `<p style="margin:0 0 0.45em 0;line-height:1.35;font-family:${fontStack};"><span style="font-size:${tam};color:${color};font-family:${fontStack};">${escHtml(
        p
      )}</span></p>`;
    })
    .join("");
}

export function htmlDestacado(
  t: string,
  tam = "0.88em",
  fontStack = "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif",
  colorTexto = NEGRO
): string {
  return `<p style="margin:0;line-height:1.3;font-family:${fontStack};"><span style="font-size:${tam};color:${colorTexto};font-family:${fontStack};"><em><strong>${escHtml(
    t
  )}</strong></em></span></p>`;
}

export function htmlPendiente(
  t: string,
  tam = "0.85em",
  fontStack = "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif"
): string {
  return `<p style="margin:0;line-height:1.3;font-family:${fontStack};"><span style="font-size:${tam};color:${NARANJA};font-family:${fontStack};"><strong>PENDIENTE: </strong></span><span style="font-size:${tam};color:${NARANJA};font-family:${fontStack};">${escHtml(
    t
  )}</span></p>`;
}

export function htmlLista(
  items: string[],
  tam = "0.84em",
  fontStack = "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif"
): string {
  const lis = items
    .map((item) => `<li style="margin-bottom:0.3em;line-height:1.3;font-family:${fontStack};"><span style="font-size:${tam};color:${NEGRO};font-family:${fontStack};">${escHtml(item)}</span></li>`)
    .join("");
  return `<ul style="margin:0;padding-left:1.2em;">${lis}</ul>`;
}

export function htmlEnlace(
  label: string,
  url: string,
  tam = "0.82em",
  fontStack = "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif",
  colorAcento = "#0099E6"
): string {
  const isUrlInLabel = label.startsWith("http://") || label.startsWith("https://");
  const linkText = isUrlInLabel ? label : `${label} [Enlace institucional]`;
  let safeUrl = "#";
  try {
    const parsed = new URL(url);
    if ((parsed.protocol === "https:" || parsed.protocol === "http:") && !parsed.username && !parsed.password) {
      safeUrl = parsed.toString();
    }
  } catch {}
  return `<a href="${escHtml(
    safeUrl
  )}" target="_blank" rel="noopener noreferrer" style="font-size:${tam};color:${colorAcento};font-family:${fontStack};text-decoration:underline;font-weight:600;">${escHtml(
    linkText
  )}</a>`;
}

function assignNewSubContentIds(obj: any): void {
  if (Array.isArray(obj)) {
    for (const item of obj) assignNewSubContentIds(item);
  } else if (obj && typeof obj === "object") {
    if ("subContentId" in obj || ("library" in obj && "params" in obj)) {
      obj.subContentId = globalThis.crypto.randomUUID();
    }
    for (const val of Object.values(obj)) {
      assignNewSubContentIds(val);
    }
  }
}

function collectUsedFiles(obj: any, acc = new Set<string>()): Set<string> {
  if (Array.isArray(obj)) {
    for (const item of obj) collectUsedFiles(item, acc);
  } else if (obj && typeof obj === "object") {
    if (
      typeof obj.path === "string" &&
      !obj.path.startsWith("http://") &&
      !obj.path.startsWith("https://")
    ) {
      const normalized: string = obj.path.replace(/\\/g, "/");
      const segments: string[] = normalized.split("/");
      if (
        normalized.startsWith("/") ||
        segments.some((segment) => segment === ".." || segment === "." || segment.length === 0) ||
        normalized.includes("\u0000")
      ) {
        throw new Error("La plantilla o el recurso contiene una ruta de archivo no permitida.");
      }
      acc.add(normalized);
    }
    for (const val of Object.values(obj)) {
      collectUsedFiles(val, acc);
    }
  }
  return acc;
}

function makeImageElement(
  baseCoords: { x: number; y: number; width: number; height: number },
  svgAsset: GeneratedSvgAsset
) {
  const pngFilename = svgAsset.filename.replace(/\.svg$/i, ".png");
  return {
    x: baseCoords.x,
    y: baseCoords.y,
    width: baseCoords.width,
    height: baseCoords.height,
    backgroundOpacity: 0,
    displayAsButton: false,
    buttonSize: "big",
    goToSlideType: "specified",
    invisible: false,
    action: {
      library: "H5P.Image 1.1",
      metadata: {
        contentType: "Image",
        license: "CC BY-SA",
        title: svgAsset.altText.slice(0, 80),
      },
      params: {
        decorative: false,
        contentName: "Imagen",
        alt: svgAsset.altText,
        title: svgAsset.altText,
        expandImage: "Ampliar imagen",
        minimizeImage: "Minimizar imagen",
        file: {
          path: `images/${pngFilename}`,
          mime: "image/png",
          copyright: {
            license: "CC BY-SA",
            title: svgAsset.altText.slice(0, 60),
            author: "Equipo 35 HAS - Digitatón UAO 2026",
            year: "2026",
          },
          width: svgAsset.width,
          height: svgAsset.height,
        },
      },
      subContentId: crypto.randomUUID(),
    },
  };
}

function makePendingImageElements(
  baseCoords: { x: number; y: number; width: number; height: number },
  description: string
) {
  const shapeEl = {
    ...baseCoords,
    backgroundOpacity: 0,
    displayAsButton: false,
    buttonSize: "big",
    goToSlideType: "specified",
    invisible: false,
    action: {
      library: "H5P.Shape 1.0",
      metadata: { contentType: "Shapes", license: "U" },
      params: {
        type: "rectangle",
        shape: {
          fillColor: FONDO,
          borderWidth: "2",
          borderStyle: "dashed",
          borderColor: NARANJA,
          borderRadius: "4",
        },
        line: {
          borderColor: "#000000",
          borderWidth: "1",
          borderStyle: "solid",
        },
      },
    },
  };
  const textEl = {
    x: baseCoords.x + 2,
    y: baseCoords.y + baseCoords.height / 2 - 8,
    width: Math.max(baseCoords.width - 4, 10),
    height: 16,
    backgroundOpacity: 0,
    displayAsButton: false,
    buttonSize: "big",
    goToSlideType: "specified",
    invisible: false,
    alwaysDisplayComments: false,
    solution: "",
    action: {
      library: "H5P.AdvancedText 1.1",
      metadata: {
        contentType: "Text",
        license: "U",
        title: "Imagen pendiente",
      },
      params: {
        text: `<p style="text-align:center;"><span style="font-size:0.75em;color:${NARANJA};"><strong>IMAGEN PENDIENTE</strong><br>${escHtml(
          description
        )}</span></p>`,
      },
    },
  };
  return [shapeEl, textEl];
}

function makeAudioElement(
  audioPath: string,
  title: string,
  coords = { x: 92, y: 3.5, width: 5.5, height: 5.5 }
) {
  return {
    x: coords.x,
    y: coords.y,
    width: coords.width,
    height: coords.height,
    backgroundOpacity: 0,
    displayAsButton: true,
    buttonSize: "big",
    goToSlideType: "specified",
    invisible: false,
    action: {
      library: "H5P.Audio 1.5",
      metadata: {
        contentType: "Audio",
        license: "U",
        title: title || "Narración de voz (Locución Académica)",
      },
      params: {
        fitToWrapper: false,
        playerMode: "minimal",
        controls: true,
        autoplay: false,
        playAudio: "Reproducir narración",
        pauseAudio: "Pausar narración",
        contentName: "Narración de Audio",
        audioNotSupported: "Tu navegador no soporta reproducción de audio",
        files: [
          {
            path: audioPath,
            mime: "audio/mpeg",
            copyright: { license: "U" },
          },
        ],
      },
      subContentId: crypto.randomUUID(),
    },
  };
}

// -----------------------------------------------------------------------------
// Constructores de los 19 Tipos de Actividades Interactivas H5P
// -----------------------------------------------------------------------------

function buildInteractionElement(
  spec: SlideInteractionSpec,
  coords = { x: 43, y: 26, width: 50, height: 60 },
  extraLibsNeeded: Set<string>
): any {
  const feedbackText =
    spec.feedback ||
    "¡Excelente trabajo! Has verificado tu comprensión de los fundamentos de Matemáticas Discretas.";

  switch (spec.type) {
    case "single_choice_set":
    case "audio_quiz": {
      const questions = spec.questions?.length
        ? spec.questions
        : [
            {
              question:
                "¿Qué estándar se emplea para representar números reales en punto flotante en una máquina?",
              answers: [
                "El protocolo IEEE-754 (32 y 64 bits).",
                "El código ASCII de 8 bits.",
                "La norma Unicode UTF-8.",
              ],
            },
          ];
      return {
        ...coords,
        backgroundOpacity: 0,
        displayAsButton: false,
        buttonSize: "big",
        goToSlideType: "specified",
        invisible: false,
        action: {
          library: "H5P.SingleChoiceSet 1.11",
          metadata: {
            contentType: "Single Choice Set",
            license: "U",
            title: "Analiza y responde",
          },
          params: {
            choices: questions.map((q) => ({
              subContentId: crypto.randomUUID(),
              question: `<p><strong>${escHtml(q.question)}</strong></p>\n`,
              answers: q.answers.map((a) => `<p>${escHtml(a)}</p>\n`),
            })),
            overallFeedback: [{ from: 0, to: 100, feedback: feedbackText }],
            behaviour: {
              autoContinue: true,
              timeoutCorrect: 1800,
              timeoutWrong: 2500,
              soundEffectsEnabled: true,
              enableRetry: true,
              enableSolutionsButton: true,
              passPercentage: 100,
            },
            l10n: {
              nextButtonLabel: "Siguiente pregunta",
              retryButtonLabel: "Reintentar",
              solutionViewTitle: "Ver solución",
              correctText: "¡Correcto!",
              incorrectText: "Incorrecto, revisa el concepto.",
              shouldSelect: "Debió seleccionarse",
              shouldNotSelect: "No debió seleccionarse",
              muteButtonLabel: "Silenciar sonido",
              closeButtonLabel: "Cerrar",
              slideOfTotal: "Pregunta :num de :total",
              scoreBarLabel: "Obtuviste :num de :total puntos",
              solutionListQuestionNumber: "Pregunta :num",
              a11yShowSolution: "Mostrar la solución correcta.",
              a11yRetry: "Reiniciar el cuestionario.",
              nextButton: "Siguiente",
              showResultsButtonLabel: "Mostrar resultados",
              resultHeader: "Tu resultado:",
              totalScore: ":score de :maxScore correctas",
              resultTableHeader: "Pregunta",
              resultScoreTableHeader: "Puntaje",
              correctAnswerIntroduction: "Respuesta correcta:",
            },
          },
        },
      };
    }

    case "multi_choice":
    case "multimedia_choice": {
      const mc = spec.multiChoice || {
        question:
          "Selecciona cuáles de las siguientes afirmaciones son verdaderas respecto a la representación IEEE-754:",
        options: [
          {
            text: "A 32 bits utiliza 1 bit de signo, 8 de exponente (sesgo 127) y 23 de mantisa.",
            correct: true,
            feedback: "¡Correcto! Esa es la estructura exacta de binary32.",
          },
          {
            text: "A 64 bits utiliza 1 bit de signo, 11 de exponente (sesgo 1023) y 52 de mantisa.",
            correct: true,
            feedback: "¡Muy bien! Permite ~15-17 dígitos decimales de precisión.",
          },
          {
            text: "Puede representar exactamente todos los números irracionales como π o √2.",
            correct: false,
            feedback:
              "Revisa: toda representación en n bits es finita y solo aproxima irracionales.",
          },
        ],
      };
      return {
        ...coords,
        backgroundOpacity: 0,
        displayAsButton: false,
        buttonSize: "big",
        goToSlideType: "specified",
        invisible: false,
        action: {
          library: "H5P.MultiChoice 1.16",
          metadata: {
            contentType: "Multiple Choice",
            license: "U",
            title: "Selección Múltiple",
          },
          params: {
            media: { disableImageZooming: false },
            question: `<p><strong>${escHtml(mc.question)}</strong></p>\n`,
            answers: mc.options.map((o) => ({
              correct: o.correct,
              text: `<div>${escHtml(o.text)}</div>\n`,
              tipsAndFeedback: {
                tip: "",
                chosenFeedback: `<div>${escHtml(
                  o.feedback ||
                    (o.correct ? "¡Muy bien!" : "Revisa este concepto.")
                )}</div>\n`,
                notChosenFeedback: "",
              },
            })),
            overallFeedback: [{ from: 0, to: 100, feedback: feedbackText }],
            behaviour: {
              enableRetry: true,
              enableSolutionsButton: true,
              enableCheckButton: true,
              type: "auto",
              singlePoint: false,
              randomAnswers: false,
              showSolutionsRequiresInput: true,
              confirmCheckDialog: false,
              confirmRetryDialog: false,
              autoCheck: false,
              passPercentage: 100,
              showScorePoints: true,
            },
            UI: {
              checkAnswerButton: "Verificar",
              submitAnswerButton: "Enviar",
              showSolutionButton: "Ver solución",
              tryAgainButton: "Reintentar",
              tipsLabel: "Ver pista",
              scoreBarLabel: "Obtuviste :num de :total puntos",
              tipAvailable: "Pista disponible",
              feedbackAvailable: "Retroalimentación disponible",
              readFeedback: "Leer retroalimentación",
              wrongAnswer: "Respuesta incorrecta",
              correctAnswer: "Respuesta correcta",
              shouldCheck: "Debió marcarse",
              shouldNotCheck: "No debió marcarse",
              noInput: "Selecciona al menos una opción antes de verificar",
              a11yCheck: "Verificar las respuestas seleccionadas.",
              a11yShowSolution: "Mostrar la solución correcta.",
              a11yRetry: "Reiniciar el ejercicio.",
            },
            confirmCheck: {
              header: "¿Finalizar?",
              body: "¿Deseas verificar tu respuesta?",
              cancelLabel: "Cancelar",
              confirmLabel: "Verificar",
            },
            confirmRetry: {
              header: "¿Reintentar?",
              body: "¿Deseas reiniciar tu intento?",
              cancelLabel: "Cancelar",
              confirmLabel: "Confirmar",
            },
          },
        },
      };
    }

    case "drag_text":
    case "sort_algorithm_steps": {
      const defaultDrag =
        spec.type === "sort_algorithm_steps"
          ? "Paso 1: Determinar el bit de *signo* (0 positivo, 1 negativo).\nPaso 2: Convertir la parte entera y fraccionaria a base *binaria*.\nPaso 3: Normalizar en notación científica *1.M* por potencia de 2.\nPaso 4: Sumar el sesgo *127* (o 1023 en 64 bits) al exponente.\nPaso 5: Empaquetar Signo, *Exponente* y Mantisa."
          : "Los números *naturales* (ℕ) sirven para contar, los *enteros* (ℤ) incluyen negativos, los *racionales* (ℚ) se expresan como fracción a/b y los *irracionales* como π tienen infinitos decimales no periódicos.";
      return {
        ...coords,
        backgroundOpacity: 0,
        displayAsButton: false,
        buttonSize: "big",
        goToSlideType: "specified",
        invisible: false,
        action: {
          library: "H5P.DragText 1.10",
          metadata: {
            contentType: "Drag the Words",
            license: "U",
            title: "Arrastra las palabras",
          },
          params: {
            media: { disableImageZooming: false },
            taskDescription: `<p><strong>${escHtml(
              spec.instruction ||
                "Arrastra cada concepto o paso algorítmico al lugar que le corresponde:"
            )}</strong></p>`,
            textField: spec.textField || defaultDrag,
            overallFeedback: [{ from: 0, to: 100, feedback: feedbackText }],
            checkAnswer: "Verificar",
            submitAnswer: "Enviar",
            tryAgain: "Reintentar",
            showSolution: "Mostrar solución",
            dropZoneIndex: "Zona @index.",
            empty: "La zona @index está vacía.",
            contains: "La zona @index contiene @draggable.",
            ariaDraggableIndex: "@index de @count elementos.",
            tipLabel: "Mostrar pista",
            correctText: "¡Correcto!",
            incorrectText: "¡Incorrecto!",
            resetDropTitle: "Reiniciar casilla",
            resetDropDescription: "¿Seguro que deseas vaciar esta casilla?",
            grabbed: "Elemento seleccionado.",
            cancelledDragging: "Arrastre cancelado.",
            correctAnswer: "Respuesta correcta:",
            feedbackHeader: "Retroalimentación",
            behaviour: {
              enableRetry: true,
              enableSolutionsButton: true,
              enableCheckButton: true,
              instantFeedback: false,
            },
            scoreBarLabel: "Obtuviste :num de :total puntos",
            a11yCheck: "Verificar respuestas.",
            a11yShowSolution: "Mostrar solución.",
            a11yRetry: "Reintentar actividad.",
          },
        },
      };
    }

    case "blanks":
    case "combination_lock": {
      const isLock = spec.type === "combination_lock";
      const questionsList = (
        spec.textField ||
        (isLock
          ? "1. Decodifica la trama ASCII 01010101 01000001 01001111: *UAO*\n2. Bit de signo de (-12.5)₁₀ en IEEE-754: *1*\n3. Exponente sesgado (3 + 127) en decimal: *130*"
          : "En IEEE-754 de 32 bits hay *1* bit de signo, *8* bits de exponente con sesgo *127* y *23* bits de mantisa.")
      )
        .split("\n")
        .map((line) => `<p>${escHtml(line)}</p>`);

      return {
        ...coords,
        backgroundOpacity: 0,
        displayAsButton: false,
        buttonSize: "big",
        goToSlideType: "specified",
        invisible: false,
        action: {
          library: "H5P.Blanks 1.14",
          metadata: {
            contentType: "Fill in the Blanks",
            license: "U",
            title: isLock ? "Candado Binario" : "Completa los espacios",
          },
          params: {
            media: { disableImageZooming: false },
            text: `<p><strong>${escHtml(
              spec.instruction ||
                (isLock
                  ? "Candado Binario: Escribe los valores exactos para desbloquear el reto:"
                  : "Completa los valores numéricos o binarios en cada espacio:")
            )}</strong></p>`,
            questions: questionsList,
            overallFeedback: [{ from: 0, to: 100, feedback: feedbackText }],
            showSolutions: "Ver solución",
            tryAgain: "Reintentar",
            checkAnswer: isLock ? "Desbloquear Candado" : "Verificar",
            submitAnswer: "Enviar",
            notFilledOut: "Completa todos los campos antes de ver la solución",
            answerIsCorrect: "':ans' es correcto",
            answerIsWrong: "':ans' es incorrecto",
            answeredCorrectly: "Respondido correctamente",
            answeredIncorrectly: "Respondido incorrectamente",
            solutionLabel: "Respuesta correcta:",
            inputLabel: "Campo @num de @total",
            inputHasTipLabel: "Pista disponible",
            tipLabel: "Pista",
            behaviour: {
              enableRetry: true,
              enableSolutionsButton: true,
              enableCheckButton: true,
              autoCheck: false,
              caseSensitive: false,
              showSolutionsRequiresInput: true,
              separateLines: false,
              confirmCheckDialog: false,
              confirmRetryDialog: false,
              acceptSpellingErrors: false,
              allowRetryIfCorrect: true,
            },
            scoreBarLabel: "Obtuviste :num de :total puntos",
            a11yCheck: "Verificar respuestas.",
            a11yShowSolution: "Mostrar solución.",
            a11yRetry: "Reiniciar.",
            a11yCheckingModeHeader: "Modo verificación",
            confirmCheck: {
              header: "¿Verificar?",
              body: "¿Deseas comprobar tus respuestas?",
              cancelLabel: "Cancelar",
              confirmLabel: "Verificar",
            },
            confirmRetry: {
              header: "¿Reintentar?",
              body: "¿Deseas borrar e intentar de nuevo?",
              cancelLabel: "Cancelar",
              confirmLabel: "Confirmar",
            },
          },
        },
      };
    }

    case "true_false": {
      const tf = spec.trueFalse || {
        question:
          "En aritmética de punto flotante IEEE-754 (32 o 64 bits), solo es posible representar exactamente un subconjunto finito de los números racionales.",
        correct: true,
      };
      return {
        ...coords,
        backgroundOpacity: 0,
        displayAsButton: false,
        buttonSize: "big",
        goToSlideType: "specified",
        invisible: false,
        action: {
          library: "H5P.TrueFalse 1.8",
          metadata: {
            contentType: "True/False Question",
            license: "U",
            title: "Verdadero o Falso",
          },
          params: {
            media: { disableImageZooming: false },
            question: `<p><strong>${escHtml(tf.question)}</strong></p>`,
            correct: tf.correct ? "true" : "false",
            behaviour: {
              enableRetry: true,
              enableSolutionsButton: true,
              enableCheckButton: true,
              confirmCheckDialog: false,
              confirmRetryDialog: false,
              autoCheck: false,
              feedbackOnCorrect: feedbackText,
              feedbackOnWrong:
                "Revisa la relación entre conjuntos infinitos (ℝ) y registros finitos de bits.",
            },
            l10n: {
              trueText: "Verdadero",
              falseText: "Falso",
              score: "Obtuviste @score de @total puntos",
              checkAnswer: "Verificar",
              submitAnswer: "Enviar",
              showSolutionButton: "Ver solución",
              tryAgain: "Reintentar",
              wrongAnswerMessage: "Respuesta incorrecta",
              correctAnswerMessage: "¡Respuesta correcta!",
              scoreBarLabel: "Obtuviste :num de :total puntos",
              a11yCheck: "Verificar respuesta.",
              a11yShowSolution: "Mostrar solución.",
              a11yRetry: "Reintentar.",
            },
            confirmCheck: {
              header: "¿Finalizar?",
              body: "¿Deseas verificar?",
              cancelLabel: "Cancelar",
              confirmLabel: "Verificar",
            },
            confirmRetry: {
              header: "¿Reintentar?",
              body: "¿Deseas reintentar?",
              cancelLabel: "Cancelar",
              confirmLabel: "Confirmar",
            },
          },
        },
      };
    }

    case "mark_the_words": {
      extraLibsNeeded.add("H5P.MarkTheWords-1.11");
      return {
        ...coords,
        backgroundOpacity: 0,
        displayAsButton: false,
        buttonSize: "big",
        goToSlideType: "specified",
        invisible: false,
        action: {
          library: "H5P.MarkTheWords 1.11",
          metadata: {
            contentType: "Mark the Words",
            license: "U",
            title: "Señala los elementos correctos",
          },
          params: {
            media: { disableImageZooming: false },
            taskDescription: `<p><strong>${escHtml(
              spec.instruction ||
                "Haz clic sobre las palabras o bloques binarios correctos dentro del enunciado:"
            )}</strong></p>`,
            textField:
              spec.textField ||
              "<p>En una máquina digital, el texto se codifica con *ASCII* (1 byte = *8* bits), mientras que los reales usan *IEEE-754* dividiendo el registro en *Signo*, *Exponente* y *Mantisa*.</p>",
            overallFeedback: [{ from: 0, to: 100, feedback: feedbackText }],
            checkAnswerButton: "Verificar",
            submitAnswerButton: "Enviar",
            tryAgainButton: "Reintentar",
            showSolutionButton: "Ver solución",
            behaviour: {
              enableRetry: true,
              enableSolutionsButton: true,
              enableCheckButton: true,
              showScorePoints: true,
            },
            correctAnswer: "¡Correcto!",
            incorrectAnswer: "Incorrecto",
            missedAnswer: "Faltó seleccionar",
            displaySolutionDescription: "Se muestran las respuestas correctas.",
            scoreBarLabel: "Obtuviste :num de :total puntos",
            a11yFullTextLabel: "Texto completo",
            a11yClickableTextLabel: "Texto interactivo para marcar palabras",
            a11ySolutionModeHeader: "Modo solución",
            a11yCheckingHeader: "Modo verificación",
            a11yCheck: "Verificar.",
            a11yShowSolution: "Ver solución.",
            a11yRetry: "Reintentar.",
          },
        },
      };
    }

    case "dialogcards": {
      const cards = spec.cards?.length
        ? spec.cards
        : [
            {
              front: "¿Qué es el sesgo (Bias) en IEEE-754 de 32 bits?",
              back: "Es el valor 127 que se suma al exponente real (E = e + 127) para representar exponentes positivos y negativos sin bit de signo adicional.",
            },
            {
              front: "¿Cuántos bits ocupa cada carácter en el código ASCII estándar extendido?",
              back: "Ocupa 1 byte (8 bits), permitiendo representar 2⁸ = 256 combinaciones (0 a 255 en decimal).",
            },
            {
              front: "¿Qué elementos componen un lenguaje formal o computacional?",
              back: "Un alfabeto finito de símbolos, una operación de concatenación y reglas formales de sintaxis, gramática y semántica.",
            },
            {
              front: "¿Qué modela formalmente una Máquina de Turing?",
              back: "Abstrae cualquier proceso algorítmico mediante una cinta de celdas, un cabezal lector/escritor y una tabla de transición de estados finitos.",
            },
          ];
      return {
        ...coords,
        backgroundOpacity: 0,
        displayAsButton: false,
        buttonSize: "big",
        goToSlideType: "specified",
        invisible: false,
        action: {
          library: "H5P.Dialogcards 1.9",
          metadata: {
            contentType: "Dialog Cards",
            license: "U",
            title: "Flashcards de Repaso",
          },
          params: {
            title: "",
            description: "",
            mode: "normal",
            dialogs: cards.map((c) => ({
              text: `<p style="text-align:center;"><strong>${escHtml(
                c.front
              )}</strong></p>\n`,
              answer: `<p style="text-align:center;">${escHtml(c.back)}</p>\n`,
              tips: {},
            })),
            behaviour: {
              enableRetry: true,
              disableBackwardsNavigation: false,
              scaleTextNotCard: true,
              randomCards: false,
              maxProficiency: 5,
              quickProgression: false,
            },
            answer: "Voltear tarjeta",
            next: "Siguiente",
            prev: "Anterior",
            retry: "Volver a empezar",
            correctAnswer: "¡Lo sabía!",
            incorrectAnswer: "Debo repasarlo",
            round: "Ronda @round",
            cardsLeft: "Tarjetas restantes: @number",
            nextRound: "Pasar a la ronda @round",
            startOver: "Empezar de nuevo",
            showSummary: "Ver resumen",
            summary: "Resumen",
            summaryCardsRight: "Tarjetas dominadas:",
            summaryCardsWrong: "Tarjetas por repasar:",
            summaryCardsNotShown: "Tarjetas no vistas:",
            summaryOverallScore: "Puntaje total",
            summaryCardsCompleted: "Tarjetas completadas:",
            summaryCompletedRounds: "Rondas completadas:",
            summaryAllDone: "¡Excelente! Dominaste todas las tarjetas.",
            progressText: "Tarjeta @card de @total",
            cardFrontLabel: "Pregunta",
            cardBackLabel: "Respuesta",
            tipButtonLabel: "Ver pista",
            audioNotSupported: "Tu navegador no soporta audio",
            confirmStartingOver: {
              header: "¿Empezar de nuevo?",
              body: "Se reiniciará el recorrido de las tarjetas.",
              cancelLabel: "Cancelar",
              confirmLabel: "Reiniciar",
            },
          },
        },
      };
    }

    case "summary": {
      const groups = spec.summaryGroups?.length
        ? spec.summaryGroups
        : [
            {
              statements: [
                "En IEEE-754 de 32 bits un número real se divide en 1 bit de signo, 8 de exponente (sesgo 127) y 23 de mantisa normalizada.",
                "En IEEE-754 de 32 bits se guardan todos los decimales infinitos de un número irracional sin pérdida.",
                "El código ASCII se utiliza para representar números reales en notación científica.",
              ],
            },
            {
              statements: [
                "El código ASCII asigna un byte (8 bits) a cada carácter, permitiendo convertir nombres completos en cadenas de 0s y 1s y revertir el proceso.",
                "El proceso inverso de ASCII a texto no es posible porque la conversión binaria pierde información.",
              ],
            },
          ];
      return {
        ...coords,
        backgroundOpacity: 0,
        displayAsButton: false,
        buttonSize: "big",
        goToSlideType: "specified",
        invisible: false,
        action: {
          library: "H5P.Summary 1.10",
          metadata: {
            contentType: "Summary",
            license: "U",
            title: "Síntesis Interactiva",
          },
          params: {
            intro: `<p><strong>${escHtml(
              spec.instruction ||
                "Selecciona la afirmación verdadera en cada etapa para construir el resumen del módulo:"
            )}</strong></p>`,
            summaries: groups.map((g) => ({
              subContentId: crypto.randomUUID(),
              summary: g.statements.map((s) => `<p>${escHtml(s)}</p>\n`),
              tip: g.tip || "",
            })),
            overallFeedback: [{ from: 0, to: 100, feedback: feedbackText }],
            solvedLabel: "Avance:",
            scoreLabel: "Intentos incorrectos:",
            resultLabel: "Tu resultado:",
            labelCorrect: "¡Correcto!",
            labelIncorrect: "Incorrecto, intenta nuevamente.",
            alternativeIncorrectLabel: "Incorrecto",
            labelCorrectAnswers: "Afirmaciones correctas:",
            tipButtonLabel: "Ver pista",
            scoreBarLabel: "Obtuviste :num de :total puntos",
            progressText: "Paso :num de :total",
          },
        },
      };
    }

    case "exportable_text_area": {
      extraLibsNeeded.add("H5P.ExportableTextArea-1.3");
      const ep = spec.exportablePrompt || {
        label:
          "Asistente de Reporte Técnico (Justificación Matemática IEEE-754 y ASCII)",
        placeholder:
          "1. Escribe aquí el número real (x)₁₀ y el nombre completo elegidos por tu equipo...\n2. Explica cómo manejaste la parte entera, la parte fraccionaria y el sesgo 127/1023...\n3. Justifica cómo garantizaste que el proceso inverso recupere los datos sin errores...",
      };
      return {
        ...coords,
        backgroundOpacity: 0,
        displayAsButton: false,
        buttonSize: "big",
        goToSlideType: "specified",
        invisible: false,
        action: {
          library: "H5P.ExportableTextArea 1.3",
          metadata: {
            contentType: "Exportable Text Area",
            license: "U",
            title: ep.label,
          },
          params: {
            label: `<p><strong>${escHtml(ep.label)}</strong></p>`,
            placeholderText: ep.placeholder,
            index: 1,
            exportNotSupported:
              "La exportación no está soportada en este navegador",
            exportComments: true,
          },
        },
      };
    }

    case "audio_recorder": {
      extraLibsNeeded.add("H5P.AudioRecorder-1.0");
      return {
        ...coords,
        backgroundOpacity: 0,
        displayAsButton: false,
        buttonSize: "big",
        goToSlideType: "specified",
        invisible: false,
        action: {
          library: "H5P.AudioRecorder 1.0",
          metadata: {
            contentType: "Audio Recorder",
            license: "U",
            title: "Sustentación Oral",
          },
          params: {
            title:
              spec.instruction ||
              "Graba en 60 segundos la explicación de cómo tu algoritmo convierte un número real a IEEE-754 y realiza el proceso inverso:",
            l10n: {
              recordAnswer: "Grabar respuesta",
              pause: "Pausar",
              continue: "Continuar",
              download: "Descargar audio",
              done: "Listo",
              retry: "Volver a grabar",
              microphoneNotSupported:
                "Tu navegador no soporta grabación de micrófono.",
              microphoneInaccessible:
                "Permite el acceso al micrófono en tu navegador para grabar.",
              insecureNotAllowed:
                "El acceso al micrófono requiere HTTPS o localhost.",
              statusReadyToRecord:
                "Presiona 'Grabar respuesta' para iniciar tu sustentación oral.",
              statusRecording: "Grabando...",
              statusPaused: "Grabación en pausa.",
              statusFinishedRecording:
                "¡Grabación lista! Escúchala o descárgala para adjuntarla a tu entrega.",
              downloadRecording:
                "Descarga tu grabación de audio o escúchala aquí.",
              retryDialogHeaderText: "¿Volver a grabar?",
              retryDialogBodyText: "Se reemplazará tu grabación actual.",
              retryDialogConfirmText: "Volver a grabar",
              retryDialogCancelText: "Cancelar",
              statusCantCreateTheAudioFile:
                "No se pudo generar el archivo de audio.",
            },
          },
        },
      };
    }

    case "interactive_table": {
      extraLibsNeeded.add("H5P.Table-1.2");
      const tbl = spec.tableData || {
        headers: ["Carácter", "Decimal (DEC)", "Hexadecimal (HEX)", "Binario (8 bits)"],
        rows: [
          ["'U'", "85", "0x55", "01010101"],
          ["'A'", "65", "0x41", "01000001"],
          ["'O'", "79", "0x4F", "01001111"],
          ["' ' (Espacio)", "32", "0x20", "00100000"],
        ],
      };
      const thead = `<thead><tr>${tbl.headers
        .map(
          (h) =>
            `<th style="background:#8A1428;color:#FFFFFF;padding:5px 8px;border:1px solid #CBD5E1;line-height:1.2;text-align:left;">${escHtml(
              h
            )}</th>`
        )
        .join("")}</tr></thead>`;
      const tbody = `<tbody>${tbl.rows
        .map(
          (r, ri) =>
            `<tr style="background:${
              ri % 2 === 0 ? "#FFFFFF" : "#E0F3FA"
            };">${r
              .map(
                (c, ci) =>
                  `<td style="padding:5px 8px;border:1px solid #CBD5E1;font-family:${
                    ci < 4 ? "'JetBrains Mono', monospace" : "inherit"
                  };font-weight:${ci < 4 ? "700" : "500"};line-height:1.2;">${escHtml(
                    c
                  )}</td>`
              )
              .join("")}</tr>`
        )
        .join("")}</tbody>`;
      return {
        ...coords,
        backgroundOpacity: 0,
        displayAsButton: false,
        buttonSize: "big",
        goToSlideType: "specified",
        invisible: false,
        action: {
          library: "H5P.Table 1.2",
          metadata: {
            contentType: "Table",
            license: "U",
            title: "Tabla Técnica",
          },
          params: {
            text: `<figure class="table" style="margin:0;"><table class="h5p-table" style="width:100%;border-collapse:collapse;font-size:0.78em;line-height:1.2;">${thead}${tbody}</table></figure>`,
          },
        },
      };
    }

    case "drag_question":
    default: {
      // Fallback to DragText so it renders cleanly without background image coordinate mismatches
      return buildInteractionElement(
        { ...spec, type: "drag_text" },
        coords,
        extraLibsNeeded
      );
    }
  }
}

// -----------------------------------------------------------------------------
// Compilador de un Slide individual clonado de fiuao-6-215
// -----------------------------------------------------------------------------

function compileSlideFromSpec(
  templateSlides: any[],
  slideSpec: HasSlideSpec,
  generatedSvgs: Map<string, GeneratedSvgAsset>,
  extraLibsNeeded: Set<string>,
  projectFontId?: string,
  projectFontScale?: "compact" | "normal" | "large",
  projectTemplateId?: string,
  selectedTemplateId?: string
): any {
  const selectedTheme = getUaoTemplate(selectedTemplateId)?.theme;
  const tmpl = selectedTheme || getPresentationTemplate(projectTemplateId);
  const colorPrimary = tmpl.colors.primary;
  const colorAccent = tmpl.colors.accent;
  const colorAccentText = readableTextColor(colorAccent, tmpl.colors.textPrimary);
  const colorBackground = tmpl.colors.background;
  const colorCardBg = tmpl.colors.cardBg;
  const colorTextPrimary = tmpl.colors.textPrimary;
  const colorTextMuted = tmpl.colors.textMuted;
  const colorHighlightBg = tmpl.colors.highlightBg;

  const layout = findSlideLayout(slideSpec.templateSlide);
  const targetSlideNum =
    slideSpec.templateSlide &&
    slideSpec.templateSlide >= 1 &&
    slideSpec.templateSlide <= templateSlides.length
      ? slideSpec.templateSlide
      : layout.slideNumber;
  const slideNum = Math.min(Math.max(targetSlideNum, 1), 32);
  const raw = JSON.parse(JSON.stringify(templateSlides[slideNum - 1]));
  const compositionShapes = getUaoCompositionShapeElements(
    slideSpec.compositionId,
    layout.templateNumber,
    tmpl.colors
  );
  const fontStack = resolveFontCssStack(projectFontId || tmpl.recommendedFont);
  const scale = slideSpec.fontScale || projectFontScale || "normal";
  const boxMode = slideSpec.boxLayout || "expanded";
  const sz = (em: string) => scaleEmSize(em, scale);

  raw.slideBackgroundSelector = { fillGlobalBackground: colorBackground };
  raw.keywords = [{ main: (slideSpec.menuTitle || "Plantilla").slice(0, 35) }];
  if (slideSpec.key) {
    raw._clave = slideSpec.key;
  }

  // Resolver recurso SVG únicamente para slides que definen diagrama técnico o esquema personalizado
  let svgAsset: GeneratedSvgAsset | null = null;
  const diagramKey = slideSpec.svgDiagramId;
  if (diagramKey && BUILTIN_RETO11_SVGS[diagramKey]) {
    svgAsset = BUILTIN_RETO11_SVGS[diagramKey];
  } else if (slideSpec.customSvg) {
    svgAsset = generateCustomDiagramSvg({
      id: slideSpec.id,
      ...slideSpec.customSvg,
      theme: tmpl.colors,
    });
  }
  if (svgAsset) {
    const pngName = svgAsset.filename.replace(/\.svg$/i, ".png");
    generatedSvgs.set(svgAsset.filename, svgAsset);
    generatedSvgs.set(pngName, svgAsset);
  }
  const hasVisualAsset = Boolean(svgAsset || slideSpec.imagePendingDescription);
  const reserveVisualSpace = supportsVisualSpace(slideNum) &&
    (slideSpec.reserveVisualSpace ?? hasVisualAsset);

  const els: any[] = raw.elements;
  const toRemove = new Set<number>();
  const replacements = new Map<number, any[]>();
  const additions: any[] = [];

  const handleImageSlot = (imgIdx: number) => {
    if (!els[imgIdx]) return;
    const baseCoords = {
      x: els[imgIdx].x,
      y: els[imgIdx].y,
      width: els[imgIdx].width,
      height: els[imgIdx].height,
    };
    if (!reserveVisualSpace) {
      toRemove.add(imgIdx);
    } else if (
      slideSpec.reserveVisualSpace !== true &&
      slideSpec.imagePendingDescription &&
      !svgAsset
    ) {
      replacements.set(
        imgIdx,
        makePendingImageElements(baseCoords, slideSpec.imagePendingDescription)
      );
    } else if (svgAsset) {
      replacements.set(imgIdx, [makeImageElement(baseCoords, svgAsset)]);
    } else {
      // Mantener libre la columna visual sin mostrar un marcador falso.
      toRemove.add(imgIdx);
    }
  };

  const handleReferencesPopup = (
    popupIdx: number,
    rectIdx: number,
    labelIdx: number
  ) => {
    const refs = [...(slideSpec.apaReferences || [])];
    if (svgAsset?.apaCitation && !refs.includes(svgAsset.apaCitation)) {
      refs.push(svgAsset.apaCitation);
    }
    if (refs.length > 0 && els[popupIdx]?.action?.params) {
      els[popupIdx].action.params.text =
        `<div style="background:#FFFFFF;color:#0F172A;padding:12px 14px;border-radius:8px;border:1px solid #CBD5E1;">` +
        `<p style="margin:0 0 8px 0;font-weight:700;color:#0F172A;font-family:${fontStack};font-size:${sz("0.85em")};">Fuentes y Referencias Académicas:</p>` +
        htmlLista(refs, sz("0.78em"), fontStack) +
        `</div>`;
      if (els[rectIdx]?.action?.params?.shape) {
        els[rectIdx].action.params.shape.fillColor = colorAccent;
        els[rectIdx].action.params.shape.borderRadius = "6";
        els[rectIdx].action.params.shape.borderWidth = "0";
      }
      if (els[labelIdx]?.action?.params) {
        els[labelIdx].action.params.text = `<p><span style="font-size:0.75em;color:#FFFFFF;font-family:${fontStack};"><strong>Referencias</strong></span></p>`;
      }
    } else {
      toRemove.add(popupIdx);
      toRemove.add(rectIdx);
      toRemove.add(labelIdx);
    }
  };

  switch (slideNum) {
    case 1: {
      // Slide 1: Conoce cómo navegar (solo en Actividad 0)
      break;
    }
    case 2: {
      // Portada UAO / Personalizada según plantilla seleccionada
      if (tmpl.templateNumber !== 1 && els[0]) {
        els[0] = {
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          action: {
            library: "H5P.Shape 1.0",
            params: {
              shape: {
                type: "rectangle",
                fillColor: colorPrimary,
                borderWidth: "0",
                borderColor: "rgba(0,0,0,0)",
                borderRadius: "0",
              },
            },
            metadata: { contentType: "Shape", license: "U", title: "Fondo Portada" },
            subContentId: "cover-shape-" + (slideSpec.id || "1"),
          },
          backgroundOpacity: 0,
          displayAsButton: false,
          buttonSize: "big",
          goToSlideType: "specified",
          invisible: false,
          solution: "",
          alwaysDisplayComments: false,
        };
      }
      const fullTitle = joinTitleParts(slideSpec.titleBlack, slideSpec.titleAccent);
      els[3].x = 7;
      els[3].y = 24;
      els[3].width = 40;
      els[3].height = 12;
      els[3].action.params.text = `<p style="margin:0;line-height:1.25;font-family:${fontStack};"><span style="font-size:${sz(
        "1.15em"
      )};color:#FFFFFF;opacity:0.95;font-family:${fontStack};"><strong>${escHtml(
        slideSpec.subtitle || `Actividad ${slideSpec.id}`
      )}</strong></span></p>`;
      const titleFontSize =
        fullTitle.length > 70
          ? sz("0.98em")
          : fullTitle.length > 45
          ? sz("1.12em")
          : sz("1.30em");
      els[4].x = 7;
      els[4].y = 36;
      els[4].width = 42;
      els[4].height = 40;
      els[4].action.params.text = `<h2 style="margin:0;line-height:1.22;font-family:${fontStack};"><span style="font-size:${titleFontSize};color:#FFFFFF;font-family:${fontStack};"><strong>${escHtml(
        fullTitle
      )}</strong></span></h2>`;
      break;
    }
    case 4: {
      // Imagen izq (0), subtítulo (1), cuerpo (3), destacado (4), título (6), refs (5,7,8)
      els[6].x = 6.9;
      els[6].y = 9;
      els[6].width = 86;
      els[6].height = 13;
      els[6].action.params.text = htmlTitulo(
        slideSpec.titleBlack,
        slideSpec.titleAccent || "",
        sz("1.32em"),
        "h2",
        fontStack,
        colorTextPrimary,
        colorAccent
      );

      const hasVisual = reserveVisualSpace;
      const hasBottomBox = Boolean(slideSpec.highlightBox || slideSpec.pendingNote);

      if (hasVisual) {
        // Con imagen en columna izquierda y texto/destacado en columna derecha
        els[1].x = 51.5;
        els[1].y = 22;
        els[1].width = 43;
        els[1].height = 8;
        els[1].action.params.text = `<p style="margin:0;line-height:1.2;font-family:${fontStack};"><span style="font-size:${sz(
          "1.02em"
        )};color:${colorAccentText};font-family:${fontStack};"><strong>${escHtml(
          slideSpec.subtitle || slideSpec.menuTitle
        )}</strong></span></p>`;

        els[3].x = 51.5;
        els[3].y = 30.5;
        els[3].width = 43.5;
        els[3].height = hasBottomBox ? 32 : 56;
        els[3].action.params.text = htmlParrafos(
          slideSpec.paragraphs,
          sz("0.82em"),
          colorTextPrimary,
          fontStack
        );

        if (slideSpec.highlightBox) {
          els[2].x = 51;
          els[2].y = 63.5;
          els[2].width = 44;
          els[2].height = 24;
          if (els[2]?.action?.params?.shape) {
            els[2].action.params.shape.fillColor = colorHighlightBg;
            els[2].action.params.shape.borderColor = colorAccent;
          }
          els[4].x = 52.5;
          els[4].y = 65.5;
          els[4].width = 41;
          els[4].height = 20;
          els[4].action.params.text = htmlDestacado(
            slideSpec.highlightBox,
            sz("0.82em"),
            fontStack,
            colorTextPrimary
          );
        } else if (slideSpec.pendingNote) {
          els[2].x = 51;
          els[2].y = 63.5;
          els[2].width = 44;
          els[2].height = 24;
          els[4].x = 52.5;
          els[4].y = 65.5;
          els[4].width = 41;
          els[4].height = 20;
          els[4].action.params.text = htmlPendiente(
            slideSpec.pendingNote,
            sz("0.82em"),
            fontStack
          );
        } else {
          toRemove.add(2);
          toRemove.add(4);
        }
        handleImageSlot(0);
      } else {
        // Sin imagen: disposición ejecutiva de ancho completo (full-width)
        toRemove.add(0);
        els[1].x = 6.9;
        els[1].y = 22;
        els[1].width = 86.2;
        els[1].height = 7;
        els[1].action.params.text = `<p style="margin:0;line-height:1.2;font-family:${fontStack};"><span style="font-size:${sz(
          "1.02em"
        )};color:${colorAccentText};font-family:${fontStack};"><strong>${escHtml(
          slideSpec.subtitle || slideSpec.menuTitle
        )}</strong></span></p>`;

        els[3].x = 6.9;
        els[3].y = 29.5;
        els[3].width = 86.2;
        els[3].height = hasBottomBox ? 34 : 58;
        els[3].action.params.text = htmlParrafos(
          slideSpec.paragraphs,
          sz("0.85em"),
          colorTextPrimary,
          fontStack
        );

        if (slideSpec.highlightBox) {
          els[2].x = 6.9;
          els[2].y = 64.5;
          els[2].width = 86.2;
          els[2].height = 22.5;
          if (els[2]?.action?.params?.shape) {
            els[2].action.params.shape.fillColor = colorHighlightBg;
            els[2].action.params.shape.borderColor = colorAccent;
            els[2].action.params.shape.borderWidth = "2";
            els[2].action.params.shape.borderRadius = "10";
          }
          els[4].x = 8.5;
          els[4].y = 66.5;
          els[4].width = 83;
          els[4].height = 18.5;
          els[4].action.params.text = htmlDestacado(
            slideSpec.highlightBox,
            sz("0.84em"),
            fontStack,
            colorTextPrimary
          );
        } else if (slideSpec.pendingNote) {
          els[2].x = 6.9;
          els[2].y = 64.5;
          els[2].width = 86.2;
          els[2].height = 22.5;
          els[4].x = 8.5;
          els[4].y = 66.5;
          els[4].width = 83;
          els[4].height = 18.5;
          els[4].action.params.text = htmlPendiente(
            slideSpec.pendingNote,
            sz("0.82em"),
            fontStack
          );
        } else {
          toRemove.add(2);
          toRemove.add(4);
        }
      }
      handleReferencesPopup(5, 7, 8);
      break;
    }
    case 5: {
      // Slide 5: Objetivos / ¿Qué aprenderás? (3 tarjetas de competencia)
      if (els[9]) {
        els[9].x = 5;
        els[9].y = 7;
        els[9].width = 90;
        els[9].height = 14;
        els[9].action.params.text = htmlTitulo(
          slideSpec.titleBlack,
          slideSpec.titleAccent || "",
          sz("1.32em"),
          "h2",
          fontStack,
          colorTextPrimary,
          colorAccent
        );
      }

      if (els[0]) {
        toRemove.add(0);
      }

      const cards =
        slideSpec.stepsCards && slideSpec.stepsCards.length >= 3
          ? slideSpec.stepsCards
          : [
              {
                title:
                  slideSpec.stepsCards?.[0]?.title ||
                  slideSpec.bullets?.[0] ||
                  "Analizar y Traducir",
                description:
                  slideSpec.stepsCards?.[0]?.description ||
                  slideSpec.paragraphs[0] ||
                  "Comprender la representación de datos continuos en sistemas digitales binarios.",
              },
              {
                title:
                  slideSpec.stepsCards?.[1]?.title ||
                  slideSpec.bullets?.[1] ||
                  "Modelar con Precisión",
                description:
                  slideSpec.stepsCards?.[1]?.description ||
                  slideSpec.paragraphs[1] ||
                  "Analizar el impacto de la memoria finita y el redondeo aritmético en computadores.",
              },
              {
                title:
                  slideSpec.stepsCards?.[2]?.title ||
                  slideSpec.bullets?.[2] ||
                  "Validar y Resolver",
                description:
                  slideSpec.stepsCards?.[2]?.description ||
                  slideSpec.paragraphs[2] ||
                  (slideSpec.paragraphs.length > 1
                    ? slideSpec.paragraphs[1]
                    : "Diseñar algoritmos estructurados para resolver problemas numéricos discretos."),
              },
            ];

      const xCoords = [5, 36, 67];
      const cardColors = [colorPrimary, colorAccent, colorPrimary];
      const bgIdxs = [1, 5, 6];
      const badgeShapeIdxs = [4, 12, 13];
      const badgeNumIdxs = [10, 15, 14];
      const titleIdxs = [3, 16, 11];
      const descIdxs = [2, 7, 8];

      for (let k = 0; k < 3; k++) {
        const xc = xCoords[k];
        const color = cardColors[k];
        const c = cards[k];

        if (els[bgIdxs[k]]) {
          els[bgIdxs[k]].x = xc;
          els[bgIdxs[k]].y = 35;
          els[bgIdxs[k]].width = 28;
          els[bgIdxs[k]].height = 54;
          if (els[bgIdxs[k]].action?.params?.shape) {
            els[bgIdxs[k]].action.params.shape.fillColor = colorCardBg;
            els[bgIdxs[k]].action.params.shape.borderColor = color;
            els[bgIdxs[k]].action.params.shape.borderWidth = "2";
            els[bgIdxs[k]].action.params.shape.borderRadius = "12";
          }
        }

        if (els[badgeShapeIdxs[k]]) {
          els[badgeShapeIdxs[k]].x = xc + 10;
          els[badgeShapeIdxs[k]].y = 29.5;
          els[badgeShapeIdxs[k]].width = 8;
          els[badgeShapeIdxs[k]].height = 9.5;
          if (els[badgeShapeIdxs[k]].action?.params?.shape) {
            els[badgeShapeIdxs[k]].action.params.shape.fillColor = color;
            els[badgeShapeIdxs[k]].action.params.shape.borderRadius = "8";
          }
        }

        if (els[badgeNumIdxs[k]]) {
          els[badgeNumIdxs[k]].x = xc + 10;
          els[badgeNumIdxs[k]].y = 30.2;
          els[badgeNumIdxs[k]].width = 8;
          els[badgeNumIdxs[k]].height = 8;
          els[badgeNumIdxs[k]].action.params.text = `<p style="text-align:center;margin:0;line-height:1;"><span style="font-size:${sz(
            "1.15em"
          )};font-weight:bold;color:#FFFFFF;font-family:${fontStack};">0${
            k + 1
          }</span></p>`;
        }

        if (els[titleIdxs[k]]) {
          els[titleIdxs[k]].x = xc + 1.5;
          els[titleIdxs[k]].y = 41;
          els[titleIdxs[k]].width = 25;
          els[titleIdxs[k]].height = 12;
          els[titleIdxs[k]].action.params.text = `<h3 style="text-align:center;margin:0;line-height:1.2;font-family:${fontStack};"><span style="font-size:${sz(
            "0.98em"
          )};color:${colorTextPrimary};font-family:${fontStack};"><strong>${escHtml(
            c.title
          )}</strong></span></h3>`;
        }

        if (els[descIdxs[k]]) {
          els[descIdxs[k]].x = xc + 1.5;
          els[descIdxs[k]].y = 54;
          els[descIdxs[k]].width = 25;
          els[descIdxs[k]].height = 33;
          els[descIdxs[k]].action.params.text = `<p style="text-align:center;margin:0;line-height:1.35;font-family:${fontStack};"><span style="font-size:${sz(
            "0.80em"
          )};color:${colorTextMuted};font-family:${fontStack};">${escHtml(
            c.description
          )}</span></p>`;
        }
      }
      break;
    }
    case 6: {
      // Ruta de 4 pasos (tarjetas numeradas)
      els[0].x = 6.5;
      els[0].y = 7;
      els[0].width = 87;
      els[0].height = 12;
      els[0].action.params.text = htmlTitulo(
        slideSpec.titleBlack,
        slideSpec.titleAccent || "",
        sz("1.32em"),
        "h2",
        fontStack,
        colorTextPrimary,
        colorAccent
      );
      const cards = slideSpec.stepsCards || [];
      const bgIdxs = [1, 2, 3, 4];
      const titleIdxs = [5, 6, 7, 8];
      const descIdxs = [9, 10, 11, 12];
      const badgeShapeIdxs = [13, 14, 15, 16];
      const badgeNumIdxs = [17, 18, 19, 20];
      const boxCoords = [
        { x: 5.5, y: 31, w: 21.5, h: 56 },
        { x: 28.2, y: 31, w: 21.5, h: 56 },
        { x: 51.0, y: 31, w: 21.5, h: 56 },
        { x: 73.8, y: 31, w: 21.5, h: 56 },
      ];
      for (let k = 0; k < 4; k++) {
        const c = cards[k] || {
          number: String(k + 1),
          title: `Paso ${k + 1}`,
          description: "",
        };
        const cardCol = k % 2 === 0 ? colorPrimary : colorAccent;
        if (els[bgIdxs[k]]) {
          els[bgIdxs[k]].y = 34;
          els[bgIdxs[k]].height = 52;
          if (els[bgIdxs[k]].action?.params?.shape) {
            els[bgIdxs[k]].action.params.shape.fillColor = colorCardBg;
            els[bgIdxs[k]].action.params.shape.borderColor = cardCol;
          }
        }
        if (els[badgeShapeIdxs[k]]) {
          els[badgeShapeIdxs[k]].y = 28.5;
          if (els[badgeShapeIdxs[k]].action?.params?.shape) {
            els[badgeShapeIdxs[k]].action.params.shape.fillColor = cardCol;
          }
        }
        if (els[badgeNumIdxs[k]]) {
          els[badgeNumIdxs[k]].y = 30.2;
          els[badgeNumIdxs[k]].action.params.text = `<p style="text-align:center;margin:0;line-height:1;"><span style="font-size:${sz(
            "1.3em"
          )};font-weight:bold;color:#FFFFFF;font-family:${fontStack};">${k + 1}</span></p>`;
        }
        els[titleIdxs[k]].x = boxCoords[k].x + 1.2;
        els[titleIdxs[k]].y = 42;
        els[titleIdxs[k]].width = 19;
        els[titleIdxs[k]].height = 17;
        els[titleIdxs[k]].action.params.text = `<p style="margin:0;line-height:1.15;font-family:${fontStack};"><span style="font-size:${sz(
          "0.82em"
        )};color:${colorTextPrimary};font-family:${fontStack};line-height:1.15;"><strong>${escHtml(
          c.title
        )}</strong></span></p>`;

        els[descIdxs[k]].x = boxCoords[k].x + 1.2;
        els[descIdxs[k]].y = 58;
        els[descIdxs[k]].width = 19;
        els[descIdxs[k]].height = 28;
        els[descIdxs[k]].action.params.text = htmlParrafos(
          [c.description],
          sz("0.76em"),
          colorTextMuted,
          fontStack
        );
        if (c.targetKey) {
          additions.push({
            x: boxCoords[k].x,
            y: boxCoords[k].y,
            width: boxCoords[k].w,
            height: boxCoords[k].h,
            goToSlide: c.targetKey,
            goToSlideType: "specified",
            invisible: true,
            backgroundOpacity: 0,
            displayAsButton: false,
            buttonSize: "big",
          });
        }
      }
      if (slideSpec.paragraphs.length > 0) {
        additions.push({
          x: 6.5,
          y: 19,
          width: 87,
          height: 9,
          backgroundOpacity: 0,
          displayAsButton: false,
          buttonSize: "big",
          goToSlideType: "specified",
          invisible: false,
          alwaysDisplayComments: false,
          solution: "",
          action: {
            library: "H5P.AdvancedText 1.1",
            metadata: { contentType: "Text", license: "U", title: "Intro Ruta" },
            params: {
              text: htmlParrafos(
                slideSpec.paragraphs,
                sz("0.8em"),
                colorTextPrimary,
                fontStack
              ),
            },
          },
        });
      }
      break;
    }
    case 7: {
      const hasVisual = reserveVisualSpace;
      const textX = hasVisual ? 49.5 : 6.9;
      const textWidth = hasVisual ? 46 : 86.2;
      els[3].x = textX;
      els[3].y = 14;
      els[3].width = textWidth;
      els[3].height = 16;
      els[3].action.params.text = htmlTitulo(
        slideSpec.titleBlack,
        slideSpec.titleAccent || "",
        sz("1.35em"),
        "h2",
        fontStack,
        colorTextPrimary,
        colorAccent
      );
      els[2].x = textX;
      els[2].y = 31;
      els[2].width = textWidth;
      els[2].height = 56;
      els[2].action.params.text =
        htmlParrafos(slideSpec.paragraphs, sz("0.84em"), colorTextPrimary, fontStack) +
        (slideSpec.pendingNote
          ? htmlPendiente(slideSpec.pendingNote, sz("0.82em"), fontStack)
          : "");
      handleImageSlot(4);
      handleReferencesPopup(5, 6, 7);
      break;
    }
    case 9: {
      const hasVisual = reserveVisualSpace;
      const contentWidth = hasVisual ? 34 : 86.2;
      if (els[0]?.action?.params?.shape) {
        els[0].action.params.shape.fillColor = colorHighlightBg;
      }
      if (els[9]?.action?.params?.shape) {
        els[9].action.params.shape.fillColor = colorPrimary;
      }
      els[1].width = 16;
      els[2].width = hasVisual ? 16 : 86.2;
      els[2].height = 9;
      els[2].action.params.text = `<p style="margin:0;line-height:1.2;font-family:${fontStack};"><span style="font-size:${sz(
        "0.95em"
      )};color:${colorAccentText};font-family:${fontStack};"><strong>${escHtml(
        slideSpec.subtitle || "Paso"
      )}</strong></span></p>`;
      els[5].x = 6.5;
      els[5].y = 25;
      els[5].width = contentWidth;
      els[5].height = 13;
      els[5].action.params.text = `<p style="margin:0;line-height:1.2;font-family:${fontStack};"><span style="font-size:${sz(
        "1.02em"
      )};color:${colorTextPrimary};font-family:${fontStack};"><strong>${escHtml(
        joinTitleParts(slideSpec.titleBlack, slideSpec.titleAccent)
      )}</strong></span></p>`;

      let bodyHtml = htmlParrafos(
        slideSpec.paragraphs,
        sz("0.78em"),
        colorTextPrimary,
        fontStack
      );
      if (slideSpec.bullets?.length) {
        bodyHtml += `<div style="margin-top:6px;">${htmlLista(
          slideSpec.bullets,
          sz("0.76em"),
          fontStack
        )}</div>`;
      }
      els[3].x = 6.5;
      els[3].y = 38;
      els[3].width = contentWidth;
      els[3].height = 54;
      els[3].action.params.text = bodyHtml;

      handleImageSlot(4);
      handleReferencesPopup(6, 7, 8);
      break;
    }
    case 14: {
      raw.slideBackgroundSelector = { fillGlobalBackground: colorBackground };
      if (els[0] && els[0].action?.params?.shape) {
        els[0].x = 0;
        els[0].y = 0;
        els[0].width = 38;
        els[0].height = 100;
        els[0].action.params.shape.fillColor = colorHighlightBg;
        els[0].action.params.shape.borderRadius = "0";
        els[0].action.params.shape.borderWidth = "0";
      }

      els[2].x = 4.5;
      els[2].y = 19;
      els[2].width = 32;
      els[2].height = 23;
      els[2].action.params.text = htmlTitulo(
        slideSpec.titleBlack,
        slideSpec.titleAccent || "",
        sz("1.12em"),
        "h2",
        fontStack,
        colorTextPrimary,
        colorAccent
      );
      els[3].x = 4.5;
      els[3].y = 43;
      els[3].width = 32;
      els[3].height = 48;
      els[3].y = 42;
      els[3].width = 32;
      els[3].height = 12;
      els[3].action.params.text = `<p style="margin:0;line-height:1.25;font-family:${fontStack};"><span style="font-size:${sz(
        "1.02em"
      )};color:${colorAccentText};font-family:${fontStack};"><strong>${escHtml(
        slideSpec.subtitle || "Fuentes de estudio"
      )}</strong></span></p>`;

      const listItemsHtml: string[] = [];
      if (slideSpec.links?.length) {
        for (const l of slideSpec.links) {
          listItemsHtml.push(
            `<li style="margin-bottom:0.3em;line-height:1.3;font-family:${fontStack};">${htmlEnlace(l.label, l.url, sz("0.82em"), fontStack, colorAccentText)}</li>`
          );
        }
      }
      if (slideSpec.bullets?.length) {
        for (const b of slideSpec.bullets) {
          listItemsHtml.push(
            `<li style="margin-bottom:0.3em;line-height:1.3;font-family:${fontStack};"><span style="font-size:${sz("0.82em")};color:${NEGRO};font-family:${fontStack};">${escHtml(b)}</span></li>`
          );
        }
      }

      let contentHtml = htmlParrafos(
        slideSpec.paragraphs,
        sz("0.82em"),
        colorTextPrimary,
        fontStack
      );
      if (listItemsHtml.length) {
        contentHtml += `<div style="margin-top:12px;"><ul style="margin:0;padding-left:1.2em;">${listItemsHtml.join("")}</ul></div>`;
      }
      if (slideSpec.highlightBox) {
        contentHtml += `<div style="margin-top:12px;">${htmlParrafos(
          [slideSpec.highlightBox],
          sz("0.82em"),
          colorTextPrimary,
          fontStack
        )}</div>`;
      }
      if (slideSpec.apaReferences?.length) {
        contentHtml += `<div style="margin-top:14px;padding:12px 14px;background:#F1F5F9;border-left:4px solid ${colorAccent};border-radius:6px;">` +
          `<p style="margin:0 0 6px 0;font-weight:700;font-size:${sz("0.80em")};color:${colorTextPrimary};font-family:${fontStack};">Referencias bibliográficas (APA 7):</p>` +
          htmlLista(slideSpec.apaReferences, sz("0.76em"), fontStack) +
          `</div>`;
      }

      els[1].x = 42;
      els[1].y = 10;
      els[1].width = 54;
      els[1].height = slideSpec.interaction ? 38 : 82;
      els[1].action.params.text = contentHtml;

      if (els[4]) {
        els[4].action.params.text = "";
      }
      toRemove.add(4);
      toRemove.add(5);
      toRemove.add(6);
      toRemove.add(7);
      handleReferencesPopup(8, 9, 10);
      if (slideSpec.interaction) {
        additions.push(
          buildInteractionElement(
            slideSpec.interaction,
            { x: 42, y: 50, width: 53.5, height: 42 },
            extraLibsNeeded
          )
        );
      }
      break;
    }
    case 19: {
      if (els[3]?.action?.params?.shape) {
        els[3].action.params.shape.fillColor = colorPrimary;
      }
      els[8].x = 6.8;
      els[8].y = 7.5;
      els[8].width = 62;
      els[8].height = 14;
      els[8].action.params.text = htmlTitulo(
        slideSpec.titleBlack,
        slideSpec.titleAccent || "",
        sz("1.25em"),
        "h2",
        fontStack,
        colorTextPrimary,
        colorAccent
      );

      let bodyHtml = htmlParrafos(
        slideSpec.paragraphs,
        sz("0.80em"),
        colorTextPrimary,
        fontStack
      );
      if (slideSpec.bullets?.length) {
        bodyHtml += `<div style="margin-top:6px;">${htmlLista(
          slideSpec.bullets,
          sz("0.78em"),
          fontStack
        )}</div>`;
      }

      const hasBox = Boolean(slideSpec.highlightBox || slideSpec.pendingNote);
      const hasVisual = reserveVisualSpace;
      const contentWidth = hasVisual ? 62 : 86.2;

      els[2].x = 6.8;
      els[2].y = 23;
      els[2].width = contentWidth;
      els[2].height = hasBox ? 35 : 66;
      els[2].action.params.text = bodyHtml;

      if (hasBox) {
        els[0].x = 6.0;
        els[0].y = 60;
        els[0].width = contentWidth + 0.5;
        els[0].height = 27;
        if (els[0].action?.params?.shape) {
          els[0].action.params.shape.fillColor = colorHighlightBg;
          els[0].action.params.shape.borderColor = colorAccent;
          els[0].action.params.shape.borderRadius = "8";
        }
        els[7].x = 7.8;
        els[7].y = 62;
        els[7].width = contentWidth - 3;
        els[7].height = 23;
        els[7].action.params.text = slideSpec.highlightBox
          ? htmlDestacado(slideSpec.highlightBox, sz("0.82em"), fontStack, colorTextPrimary)
          : htmlPendiente(slideSpec.pendingNote || "", sz("0.80em"), fontStack);
      } else {
        toRemove.add(0);
        toRemove.add(7);
      }
      handleImageSlot(1);
      handleReferencesPopup(4, 5, 6);
      break;
    }
    case 20:
    case 21:
    case 22:
    case 23:
    case 24:
    case 25:
    case 26:
    case 27:
    case 28: {
      const base25 = JSON.parse(JSON.stringify(templateSlides[25 - 1]));
      raw.elements = base25.elements;

      // Actividades con mucho texto corrido necesitan el ancho completo para no desbordar
      const WIDE_TYPES = [
        "interactive_table",
        "drag_text",
        "sort_algorithm_steps",
        "blanks",
        "combination_lock",
        "mark_the_words",
        "exportable_text_area",
      ];
      if (slideSpec.interaction && WIDE_TYPES.includes(slideSpec.interaction.type)) {
        raw.elements[0].x = 5;
        raw.elements[0].y = 5.5;
        raw.elements[0].width = 90;
        raw.elements[0].height = 12;
        raw.elements[0].action.params.text = htmlTitulo(
          slideSpec.titleBlack,
          slideSpec.titleAccent || "",
          sz("1.2em"),
          "h2",
          fontStack,
          colorTextPrimary,
          colorAccent
        );

        raw.elements[1].x = 5;
        raw.elements[1].y = 18;
        raw.elements[1].width = 90;
        raw.elements[1].height = 9;
        raw.elements[1].action.params.text = htmlParrafos(
          slideSpec.paragraphs,
          sz("0.8em"),
          colorTextPrimary,
          fontStack
        );

        if (raw.elements[2]) {
          raw.elements[2].x = 5;
          raw.elements[2].y = 28;
          raw.elements[2].width = 90;
          raw.elements[2].height = 64;
        }

        raw.elements[3] = buildInteractionElement(
          slideSpec.interaction,
          {
            x: 5.8,
            y: 29,
            width: 88.4,
            height: 62,
          },
          extraLibsNeeded
        );
      } else {
        const isWideWidget = boxMode === "wide";

        // Título siempre a lo ancho en la franja superior (una o dos líneas, nunca recortado)
        raw.elements[0].x = 5;
        raw.elements[0].y = 5.5;
        raw.elements[0].width = 90;
        raw.elements[0].height = 12;
        raw.elements[0].action.params.text = htmlTitulo(
          slideSpec.titleBlack,
          slideSpec.titleAccent || "",
          sz("1.2em"),
          "h2",
          fontStack,
          colorTextPrimary,
          colorAccent
        );

        const introHtml =
          htmlParrafos(slideSpec.paragraphs, sz("0.8em"), colorTextPrimary, fontStack) +
          (slideSpec.highlightBox
            ? htmlDestacado(slideSpec.highlightBox, sz("0.8em"), fontStack, colorTextPrimary)
            : "");

        if (slideSpec.interaction) {
          const boxX = isWideWidget ? 36 : 38;
          const boxW = 95 - boxX;
          raw.elements[1].x = 5;
          raw.elements[1].y = 20;
          raw.elements[1].width = boxX - 7;
          raw.elements[1].height = 68;
          raw.elements[1].action.params.text = introHtml;
          raw.elements[2].x = boxX;
          raw.elements[2].y = 19;
          raw.elements[2].width = boxW;
          raw.elements[2].height = 73;
          raw.elements[3] = buildInteractionElement(
            slideSpec.interaction,
            {
              x: boxX + 1.5,
              y: 20.5,
              width: boxW - 3,
              height: 70,
            },
            extraLibsNeeded
          );
        } else {
          raw.elements[1].x = 5;
          raw.elements[1].y = 20;
          raw.elements[1].width = 90;
          raw.elements[1].height = 68;
          raw.elements[1].action.params.text = introHtml;
          toRemove.add(2);
          toRemove.add(3);
        }
      }
      break;
    }
    case 31: {
      if (els[0]?.action?.params?.shape) {
        els[0].action.params.shape.fillColor = colorPrimary;
      }
      els[2].x = 8.5;
      els[2].y = 14;
      els[2].width = 36;
      els[2].height = 12;
      els[4].x = 8.5;
      els[4].y = 25;
      els[4].width = 36;
      els[4].height = 12;
      els[5].x = 8.5;
      els[5].y = 36;
      els[5].width = 39;
      els[5].height = 36;
      els[5].action.params.text =
        htmlParrafos(slideSpec.paragraphs, sz("0.78em"), colorTextPrimary, fontStack) +
        (slideSpec.pendingNote
          ? htmlPendiente(slideSpec.pendingNote, sz("0.78em"), fontStack)
          : "");
      if (slideSpec.subtitle) {
        els[3].x = 8.5;
        els[3].y = 68;
        els[3].width = 39;
        els[3].height = 12;
        els[3].action.params.text = `<p style="margin:0;line-height:1.25;font-family:${fontStack};"><span style="font-size:${sz(
          "1.05em"
        )};color:${colorAccentText};font-family:${fontStack};"><strong>${escHtml(
          slideSpec.subtitle
        )}</strong></span></p>`;
      }
      break;
    }
    case 32: {
      if (els[2]?.action?.params?.shape) {
        els[2].action.params.shape.fillColor = colorPrimary;
      }
      if (els[0]?.action?.params?.shape) {
        els[0].action.params.shape.fillColor = colorHighlightBg;
      }
      els[4].x = 7.4;
      els[4].y = 8;
      els[4].width = 85;
      els[4].height = 16;
      els[4].action.params.text = htmlTitulo(
        slideSpec.titleBlack || "Referencias",
        slideSpec.titleAccent || "bibliográficas (APA 7)",
        sz("1.32em"),
        "h2",
        fontStack,
        colorTextPrimary,
        colorAccent
      );
      const allRefs =
        slideSpec.apaReferences && slideSpec.apaReferences.length > 0
          ? slideSpec.apaReferences
          : slideSpec.paragraphs;
      const mid = Math.ceil(allRefs.length / 2);
      els[1].x = 7.4;
      els[1].y = 26;
      els[1].width = 39;
      els[1].height = 64;
      els[1].action.params.text = htmlLista(
        allRefs.slice(0, mid),
        sz("0.78em"),
        fontStack
      );
      els[3].x = 54;
      els[3].y = 26;
      els[3].width = 39;
      els[3].height = 64;
      els[3].action.params.text = htmlLista(
        allRefs.slice(mid),
        sz("0.78em"),
        fontStack
      );
      break;
    }
    default: {
      if (slideSpec.interaction) {
        return compileSlideFromSpec(
          templateSlides,
          { ...slideSpec, templateSlide: 25 },
          generatedSvgs,
          extraLibsNeeded,
          projectFontId,
          projectFontScale,
          projectTemplateId
        );
      }
      // Fallback al layout 4
      return compileSlideFromSpec(
        templateSlides,
        { ...slideSpec, templateSlide: 4 },
        generatedSvgs,
        extraLibsNeeded,
        projectFontId,
        projectFontScale,
        projectTemplateId
      );
    }
  }

  // Si el slide tiene narración de audio generada por Locución Académica (CO), inyectar reproductor H5P.Audio 1.5
  if (slideSpec.audioNarration?.audioFilePath) {
    additions.push(
      makeAudioElement(
        slideSpec.audioNarration.audioFilePath,
        `Narración (${slideSpec.audioNarration.voice}): ${slideSpec.menuTitle}`
      )
    );
  }

  // Consolidar elementos
  const finalElements: any[] = [];
  for (let i = 0; i < raw.elements.length; i++) {
    if (replacements.has(i)) {
      finalElements.push(...replacements.get(i)!);
    } else if (!toRemove.has(i)) {
      finalElements.push(raw.elements[i]);
    }
  }
  raw.elements = [...compositionShapes, ...finalElements, ...additions];
  const isTemplatePlaceholder = (html: string) => {
    const text = html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
    return /lorem\s+ipsum|t[ií]tulo\s*:|imagen\s+pendiente|apellido\s*,?\s*n\.|^m[oó]dulo\s+\d+\s*:/i.test(text);
  };
  raw.elements = raw.elements.filter((element: any) => {
    const text = element?.action?.params?.text;
    if (typeof text === "string" && isTemplatePlaceholder(text)) return false;
    if (element?.action?.library?.startsWith("H5P.Image") && /imagen pendiente/i.test(String(element?.action?.params?.alt || ""))) return false;
    return true;
  });
  const textElements = raw.elements.filter((element: any) => element?.action?.library?.startsWith("H5P.AdvancedText") && typeof element?.action?.params?.text === "string" && element.action.params.text.replace(/<[^>]*>/g, " ").trim());
  if (textElements.length === 0 && slideSpec.menuTitle) {
    raw.elements.push({ x: 6, y: 7, width: 88, height: 16, backgroundOpacity: 0, displayAsButton: false, buttonSize: "big", goToSlideType: "specified", invisible: false, action: { library: "H5P.AdvancedText 1.1", metadata: { contentType: "Text", license: "U", title: "Título de diapositiva" }, params: { text: htmlTitulo(slideSpec.titleBlack || slideSpec.menuTitle, slideSpec.titleAccent || "", "1.3em", "h2", fontStack, colorTextPrimary, colorAccentText) } } });
    const fallbackBody = [...(slideSpec.paragraphs || []), ...(slideSpec.bullets || [])].filter((text) => text.trim() && !isTemplatePlaceholder(text)).slice(0, 4);
    if (fallbackBody.length || !slideSpec.interaction) raw.elements.push({ x: 7, y: 28, width: 86, height: 58, backgroundOpacity: 0, displayAsButton: false, buttonSize: "big", goToSlideType: "specified", invisible: false, action: { library: "H5P.AdvancedText 1.1", metadata: { contentType: "Text", license: "U", title: "Contenido de diapositiva" }, params: { text: htmlParrafos(fallbackBody.length ? fallbackBody : [`Explora los conceptos principales de ${slideSpec.menuTitle}.`], "0.9em", colorTextPrimary, fontStack) } } });
  }
  return raw;
}

// -----------------------------------------------------------------------------
// Generador de código editable Python (compatible 100% con CLI propia ph5p)
// -----------------------------------------------------------------------------

export function generatePh5pPythonScript(spec: HasProjectSpec): string {
  const lines: string[] = [
    `"""${spec.title} — Generado automáticamente por HAS H5P Generator (EQ-35 UAO).`,
    `Curso: ${spec.courseName} | ${spec.moduleName}`,
    `Compatible con: python -I ph5p.py construir <curso>`,
    `"""`,
    `from h5pkit import Slide, titulo, parrafos, destacado, pendiente, lista, enlace, BLANCO`,
    ``,
    `T = PLANTILLA  # noqa: F821`,
    ``,
    `CAMBIOS_TEXTO = ${JSON.stringify(spec.textChanges || [], null, 4)}`,
    ``,
    `SLIDES = [`,
  ];

  for (const s of spec.slides) {
    const layout = findSlideLayout(s.templateSlide);
    lines.push(
      `    # [${s.id}] ${s.menuTitle} (${layout.name})`
    );
    lines.push(
      `    Slide(T.slide(${layout.slideNumber}), ${layout.slideNumber}).menu(${JSON.stringify(
        s.menuTitle
      )})`
    );
    if (s.key) {
      lines.push(`    .clave(${JSON.stringify(s.key)})`);
    }
    if (s.templateSlide === 2) {
      lines.push(
        `    .texto(3, f'<p><span style="font-size:1.625em;color:{BLANCO};">${escHtml(
          s.subtitle || "Actividad"
        )}</span></p>')`
      );
      lines.push(
        `    .texto(4, f'<h2><span style="font-size:1.4em;color:{BLANCO};">${escHtml(
          s.titleBlack + (s.titleAccent || "")
        )}</span></h2>')`
      );
    } else if (s.templateSlide === 5) {
      lines.push(
        `    .texto(9, titulo(${JSON.stringify(s.titleBlack)}, ${JSON.stringify(
          s.titleAccent || ""
        )}))`
      );
      const cards = s.stepsCards || [];
      const c0 = cards[0] || {
        title: "Competencia 1",
        description: s.paragraphs[0] || "",
      };
      const c1 = cards[1] || {
        title: "Competencia 2",
        description: s.paragraphs[1] || "",
      };
      const c2 = cards[2] || {
        title: "Competencia 3",
        description: s.paragraphs[2] || "",
      };
      lines.push(
        `    .texto(3, f'<h3><strong>${escHtml(c0.title)}</strong></h3>')`
      );
      lines.push(
        `    .texto(2, parrafos([${JSON.stringify(c0.description)}]))`
      );
      lines.push(
        `    .texto(16, f'<h3><strong>${escHtml(c1.title)}</strong></h3>')`
      );
      lines.push(
        `    .texto(7, parrafos([${JSON.stringify(c1.description)}]))`
      );
      lines.push(
        `    .texto(11, f'<h3><strong>${escHtml(c2.title)}</strong></h3>')`
      );
      lines.push(
        `    .texto(8, parrafos([${JSON.stringify(c2.description)}]))`
      );
    } else if (s.templateSlide === 25 && s.interaction?.questions) {
      lines.push(
        `    .texto(0, titulo(${JSON.stringify(s.titleBlack)}, ${JSON.stringify(
          s.titleAccent || ""
        )}))`
      );
      lines.push(
        `    .texto(1, parrafos(${s.paragraphs
          .map((p) => JSON.stringify(p))
          .join(", ")}))`
      );
      lines.push(
        `    .preguntas_unica(3, ${JSON.stringify(
          s.interaction.questions.map((q) => [q.question, q.answers])
        )}, retro=${JSON.stringify(
          s.interaction.feedback || "PENDIENTE: retroalimentación."
        )})`
      );
    }
    lines.push(`    .cerrar(),`);
  }

  lines.push(`]`);
  lines.push(`TITULO = ${JSON.stringify(spec.title)}`);
  return lines.join("\n");
}

// -----------------------------------------------------------------------------
// Generador de Libro de Moodle (Moodle Book JSON)
// -----------------------------------------------------------------------------

export function generateMoodleBookJson(spec: HasProjectSpec): any {
  return {
    subseccion: `${spec.title} (Versión Libro Accesible Moodle)`,
    seccion: 1,
    libro: {
      nombre: `${spec.title} — Libro Interactivo`,
      intro: `<p>Versión en formato Libro de Moodle generada por <strong>HAS H5P Generator</strong> para lectura ágil en dispositivos móviles y accesibilidad WCAG.</p>`,
      capitulos: spec.slides
        .filter((s) => s.templateSlide !== 1)
        .map((s) => ({
          titulo: s.menuTitle,
          sub: s.menuTitle.toLowerCase().includes("fuente"),
          html: [
            `<h3><span style="color:#8A1428;">${escHtml(
              s.titleBlack
            )}</span> <span style="color:#0099E6;">${escHtml(
              s.titleAccent || ""
            )}</span></h3>`,
            ...s.paragraphs.map((p) => `<p>${escHtml(p)}</p>`),
            s.templateSlide === 5 && s.stepsCards?.length
              ? `<ol>${s.stepsCards
                  .map(
                    (c) =>
                      `<li><strong>${escHtml(c.title)}:</strong> ${escHtml(
                        c.description
                      )}</li>`
                  )
                  .join("")}</ol>`
              : "",
            s.highlightBox
              ? `<div style="background:#E0F3FA;border-left:5px solid #8A1428;padding:12px;margin:10px 0;"><strong>${escHtml(
                  s.highlightBox
                )}</strong></div>`
              : "",
            s.bullets?.length
              ? `<ul>${s.bullets
                  .map((b) => `<li>${escHtml(b)}</li>`)
                  .join("")}</ul>`
              : "",
          ]
            .filter(Boolean)
            .join("\n"),
        })),
    },
  };
}

// -----------------------------------------------------------------------------
// Función Principal: Construye el paquete .h5p + carpeta de vista previa en vivo
// -----------------------------------------------------------------------------

export async function buildH5pPackageFromSpec(
  spec: HasProjectSpec,
  audioAssets: Map<string, Buffer> = new Map(),
  suppliedTemplateBuffer?: Buffer,
  rasterizeSvgToPng?: (svgContent: string) => Promise<Buffer>
): Promise<{
  h5pBuffer: Buffer;
  previewPath: string;
  downloadUrl: string;
  slidesCount: number;
  interactionsCount: number;
  ph5pScript: string;
  moodleBook: any;
}> {
  const fs = await import("fs");
  const path = await import("path");
  const os = await import("os");

  if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/.test(spec.id)) {
    throw new Error("El identificador del proyecto contiene caracteres no permitidos.");
  }

  // 1. Obtener plantilla.h5p desde disco local o desde Supabase Storage (con caché en /tmp para Vercel Serverless)
  const ph5pRoot =
    process.env.PH5P_ROOT_DIR ||
    path.resolve(process.cwd(), "..", "ph5p");
  const localZipPath = path.join(
    ph5pRoot,
    "plantillas",
    "fiuao-6-215",
    "plantilla.h5p"
  );
  const bundledZipPath = path.resolve(process.cwd(), "public", "templates", "fiuao-6-215", "plantilla.h5p");
  const tmpZipPath = path.join(os.tmpdir(), "fiuao-6-215-plantilla.h5p");

  let baseZipBuf: Buffer;
  if (suppliedTemplateBuffer?.length) {
    baseZipBuf = Buffer.from(suppliedTemplateBuffer);
  } else if (process.env.PH5P_TEMPLATE_PATH && fs.existsSync(process.env.PH5P_TEMPLATE_PATH)) {
    baseZipBuf = fs.readFileSync(process.env.PH5P_TEMPLATE_PATH);
  } else if (fs.existsSync(bundledZipPath)) {
    baseZipBuf = fs.readFileSync(bundledZipPath);
  } else if (fs.existsSync(localZipPath)) {
    baseZipBuf = fs.readFileSync(localZipPath);
  } else if (fs.existsSync(tmpZipPath)) {
    baseZipBuf = fs.readFileSync(tmpZipPath);
  } else {
    throw new Error(
      "No se encontró la plantilla H5P. Cárgala desde el servidor o define PH5P_TEMPLATE_PATH."
    );
  }

  const zip = await JSZip.loadAsync(baseZipBuf);
  const templateContentEntry = zip.file("content/content.json");
  const templateManifestEntry = zip.file("h5p.json");
  if (!templateContentEntry || !templateManifestEntry) {
    throw new Error("La plantilla H5P debe incluir h5p.json y content/content.json en la raíz del ZIP.");
  }
  const templateContentRaw = await templateContentEntry.async("string");
  const templateH5pRaw = await templateManifestEntry.async("string");
  const templateContent = JSON.parse(templateContentRaw);
  const templateH5pJson = JSON.parse(templateH5pRaw);
  const templateSlides = templateContent?.presentation?.slides;
  if (!Array.isArray(templateSlides) || templateSlides.length === 0) {
    throw new Error("content/content.json debe incluir presentation.slides con al menos una diapositiva.");
  }

  const generatedSvgs = new Map<string, GeneratedSvgAsset>();
  const extraLibsNeeded = new Set<string>();

  const slidesToCompile: HasSlideSpec[] =
    spec.includeNavigationGuide && spec.slides[0]?.templateSlide !== 1
      ? [
          {
            id: `${spec.id}-nav-guide`,
            key: "como-navegar",
            templateSlide: 1,
            menuTitle: "¿Cómo navegar?",
            titleBlack: "Conoce cómo",
            titleAccent: "navegar",
            paragraphs: [],
          },
          ...spec.slides,
        ]
      : spec.slides;

  const templateConfig =
    getUaoTemplate(spec.selectedTemplateId)?.theme ||
    getPresentationTemplate(spec.templateId);

  const compiledSlides = slidesToCompile.map((s, index) => {
    try {
      return compileSlideFromSpec(
        templateSlides,
        s,
        generatedSvgs,
        extraLibsNeeded,
        spec.fontFamily || templateConfig.recommendedFont,
        spec.globalFontScale,
        spec.templateId,
        spec.selectedTemplateId
      );
    } catch (error) {
      const detail = error instanceof Error ? error.message : "error desconocido";
      throw new Error(
        `No se pudo compilar la diapositiva ${index + 1} (layout ${s.templateSlide}); revisa que la plantilla base incluya los elementos del layout. ${detail}`
      );
    }
  });

  // Resolver enlaces internos goToSlide por clave -> índice 1-based
  const keyMap = new Map<string, number>();
  compiledSlides.forEach((s, idx) => {
    if (s._clave) keyMap.set(s._clave, idx + 1);
  });
  for (const s of compiledSlides) {
    for (const e of s.elements) {
      if (typeof e.goToSlide === "string") {
        e.goToSlide = keyMap.get(e.goToSlide) || 1;
      }
    }
    delete s._clave;
  }

  const finalContent = JSON.parse(JSON.stringify(templateContent));
  finalContent.presentation.slides = compiledSlides;
  for (const slide of finalContent.presentation.slides) {
    slide.elements = slide.elements.filter((element: any) => {
      if (!element?.action?.library?.startsWith("H5P.Image")) return true;
      const path = element?.action?.params?.file?.path;
      if (typeof path !== "string" || path.startsWith("http://") || path.startsWith("https://")) return true;
      const fileName = path.split("/").pop() || "";
      const baseName = fileName.replace(/\.[^.]+$/, "");
      return Boolean(zip.file(`content/${path}`) || generatedSvgs.has(fileName) || generatedSvgs.has(`${baseName}.svg`) || generatedSvgs.has(`${baseName}.png`));
    });
  }
  finalContent.presentation.globalBackgroundSelector = {
    fillGlobalBackground: templateConfig.colors.background,
  };
  if (finalContent.l10n) {
    finalContent.l10n.slides = "Diapositivas";
    finalContent.l10n.resultHeader = "Resultados";
    finalContent.l10n.amountCorrect = "@value / @max correctas";
    finalContent.l10n.amountCorrectAria = "@value de @max correctas";
    finalContent.l10n.scoreBarLabel = "Puntaje: @score de @maxScore";
  }

  assignNewSubContentIds(finalContent);

  // Actualizar h5p.json con título y dependencias adicionales usadas
  const finalH5pJson = JSON.parse(JSON.stringify(templateH5pJson));
  finalH5pJson.title = spec.title;
  finalH5pJson.language = "es";

  for (const libFolder of extraLibsNeeded) {
    const [machineName, ver] = libFolder.split("-");
    const [majorVersion, minorVersion] = ver.split(".");
    const exists = finalH5pJson.preloadedDependencies.some(
      (d: any) => d.machineName === machineName
    );
    if (!exists) {
      finalH5pJson.preloadedDependencies.push({
        machineName,
        majorVersion,
        minorVersion,
      });
    }
  }

  // Archivos referenciados dentro de content/
  const usedFiles = collectUsedFiles(finalContent);

  // Rescatar en memoria las imágenes nativas de la plantilla antes de limpiar content/
  const preservedTemplateFiles = new Map<string, Buffer>();
  for (const relPath of usedFiles) {
    const entry = zip.file(`content/${relPath}`);
    if (entry) {
      preservedTemplateFiles.set(relPath, await entry.async("nodebuffer"));
    }
  }

  // Limpiar el directorio content/ original de la plantilla para dejar solo los archivos usados
  for (const key of Object.keys(zip.files)) {
    if (key.startsWith("content/")) {
      delete (zip.files as any)[key];
    }
  }

  zip.file("h5p.json", JSON.stringify(finalH5pJson, null, 2));
  zip.file("content/content.json", JSON.stringify(finalContent));

  const rasterize = rasterizeSvgToPng ?? (async (svgContent: string) => {
    const sharp = eval("require")("sharp");
    return sharp(Buffer.from(svgContent, "utf-8"))
      .png({ quality: 95 })
      .toBuffer() as Promise<Buffer>;
  });


  // Inyectar imágenes rasterizadas PNG de alta resolución, audios MP3 y archivos nativos de la plantilla
  for (const relPath of usedFiles) {
    const fileName = path.basename(relPath);
    const baseName = fileName.replace(/\.[^.]+$/, "");
    const matchingSvgAsset =
      generatedSvgs.get(fileName) ||
      generatedSvgs.get(`${baseName}.png`) ||
      generatedSvgs.get(`${baseName}.svg`);

    if (matchingSvgAsset) {
      const pngBuffer = await rasterize(matchingSvgAsset.svgContent);
      // Garantizar que la ruta dentro del zip use extensión .png
      const targetRelPath = relPath.replace(/\.svg$/i, ".png");
      zip.file(`content/${targetRelPath}`, pngBuffer);
    } else if (audioAssets.has(relPath)) {
      const buf = audioAssets.get(relPath)!;
      zip.file(`content/${relPath}`, buf);
    } else if (preservedTemplateFiles.has(relPath)) {
      const buf = preservedTemplateFiles.get(relPath)!;
      zip.file(`content/${relPath}`, buf);
    }
  }

  // -----------------------------------------------------------------------------
  // Purgado estricto de directorios y validación H5P para Moodle / H5P Hub
  // -----------------------------------------------------------------------------
  // H5PValidator.php prohíbe entradas explícitas de directorio (claves que terminan en '/')
  // y evalúa los directorios como si fueran archivos sin extensión.
  // En paquetes H5P válidos NO deben existir entradas de directorios explícitas en el zip,
  // solo los archivos con sus rutas relativas ('content/content.json', 'content/images/...png', etc.).
  for (const key of Object.keys(zip.files)) {
    if (key.endsWith("/") || (zip.files[key] && (zip.files[key] as any).dir)) {
      delete (zip.files as any)[key];
    }
  }

  // Garantizar que NINGÚN archivo dentro de content/ tenga extensión .svg
  for (const key of Object.keys(zip.files)) {
    if (key.startsWith("content/") && key.toLowerCase().endsWith(".svg")) {
      delete (zip.files as any)[key];
    }
  }

  const h5pBuffer = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 3 },
  });

  try {
    fs.writeFileSync(path.join(os.tmpdir(), `${spec.id}.h5p`), h5pBuffer);
  } catch {}

  const interactionsCount = spec.slides.filter((s) => Boolean(s.interaction)).length;
  const ph5pScript = generatePh5pPythonScript(spec);
  const moodleBook = generateMoodleBookJson(spec);

  return {
    h5pBuffer,
    previewPath: `/api/h5p-preview/${spec.id}`,
    downloadUrl: `/api/h5p/download?id=${encodeURIComponent(spec.id)}`,
    slidesCount: compiledSlides.length,
    interactionsCount,
    ph5pScript,
    moodleBook,
  };
}
