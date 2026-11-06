import { randomUUID } from "node:crypto";
import { H5P_FONT_OPTIONS } from "./h5p-catalog";
import { isUaoTemplateId } from "./uao-template-catalog";
import type { HasProjectSpec, HasSlideSpec, SlideInteractionSpec } from "./h5p-engine";

const SAFE_ID = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/;
const RESERVED_IDS = new Set(["matematicas-discretas-act0", "matematicas-discretas-act1"]);
const MAX_SLIDES = 40;

export class ProjectValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProjectValidationError";
  }
}
const MAX_TEXT = 20_000;
const MAX_LIST_ITEMS = 100;
const ALLOWED_TEMPLATES = new Set(Array.from({ length: 9 }, (_, index) => `plantilla-${index + 1}`));
const ALLOWED_FONT_SCALES = new Set(["compact", "normal", "large"]);
const ALLOWED_BOX_LAYOUTS = new Set(["balanced", "expanded", "wide"]);
const ALLOWED_INTERACTIONS = new Set<SlideInteractionSpec["type"]>([
  "single_choice_set", "multi_choice", "drag_text", "blanks", "true_false",
  "mark_the_words", "summary", "drag_question", "multimedia_choice", "dialogcards",
  "audio_quiz", "interactive_video", "exportable_text_area", "audio_recorder",
  "interactive_table", "sort_algorithm_steps", "combination_lock", "chat_simulator",
  "game_map_route",
]);

export function isSafeProjectId(value: unknown): value is string {
  return typeof value === "string" && SAFE_ID.test(value);
}

export function safeProjectId(value: unknown): string {
  if (isSafeProjectId(value) && !RESERVED_IDS.has(value)) return value;
  const normalized = typeof value === "string"
    ? value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    : "";
  const slug = normalized.replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48);
  return slug && SAFE_ID.test(slug) && !RESERVED_IDS.has(slug)
    ? slug
    : `recurso-${randomUUID()}`;
}

function cleanText(value: unknown, field: string, max = MAX_TEXT, fallback = ""): string {
  if (value === undefined || value === null) return fallback;
  if (typeof value !== "string") throw new ProjectValidationError(`El campo ${field} debe ser texto.`);
  const cleaned = value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "").trim();
  if (cleaned.length > max) throw new ProjectValidationError(`El campo ${field} supera el límite de ${max} caracteres.`);
  return cleaned;
}

function requiredText(value: unknown, field: string, max: number): string {
  const result = cleanText(value, field, max);
  if (!result) throw new ProjectValidationError(`El campo ${field} es obligatorio.`);
  return result;
}

function textList(value: unknown, field: string, maxItems = MAX_LIST_ITEMS, maxText = MAX_TEXT): string[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || value.length > maxItems) {
    throw new ProjectValidationError(`El campo ${field} debe ser una lista de hasta ${maxItems} textos.`);
  }
  return value.map((item, index) => cleanText(item, `${field}[${index}]`, maxText));
}

function assertJsonComplexity(root: unknown, maxNodes = 25_000, maxDepth = 32): void {
  const stack: Array<{ value: unknown; depth: number }> = [{ value: root, depth: 0 }];
  let nodes = 0;
  while (stack.length) {
    const { value, depth } = stack.pop()!;
    nodes += 1;
    if (nodes > maxNodes || depth > maxDepth) {
      throw new ProjectValidationError("La estructura del proyecto supera la complejidad permitida.");
    }
    if (!value || typeof value !== "object") continue;
    const children = Array.isArray(value) ? value : Object.values(value as Record<string, unknown>);
    for (const child of children) stack.push({ value: child, depth: depth + 1 });
  }
}

function safeKey(value: unknown, field: string): string {
  const key = requiredText(value, field, 80);
  if (!/^[A-Za-z0-9_-]+$/.test(key)) throw new ProjectValidationError(`El campo ${field} solo admite letras, números, guion y guion bajo.`);
  return key;
}

function boundedUrl(value: unknown, field: string, httpsOnly = false): string {
  const raw = requiredText(value, field, 2_000);
  let parsed: URL;
  try { parsed = new URL(raw); } catch { throw new ProjectValidationError(`URL inválida en ${field}.`); }
  const protocols = httpsOnly ? ["https:"] : ["https:", "http:"];
  if (!protocols.includes(parsed.protocol) || parsed.username || parsed.password) {
    throw new ProjectValidationError(`Solo se permiten enlaces ${httpsOnly ? "HTTPS" : "HTTP(S)"} sin credenciales en ${field}.`);
  }
  return parsed.toString();
}

function validateInteraction(value: unknown, index: number): SlideInteractionSpec {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ProjectValidationError(`La interacción de la diapositiva ${index + 1} no es válida.`);
  }
  const input = value as Record<string, any>;
  const serialized = JSON.stringify(input);
  if (/<\s*(?:script|iframe|object|embed|svg|img|audio|video|style|link|meta|form|input|button)\b|\bon[a-z]+\s*=|\bstyle\s*=|javascript\s*:|data\s*:\s*text\/html/i.test(serialized)) {
    throw new ProjectValidationError(`La interacción de la diapositiva ${index + 1} contiene marcado activo no permitido.`);
  }
  if (typeof input.type !== "string" || !ALLOWED_INTERACTIONS.has(input.type as SlideInteractionSpec["type"])) {
    throw new ProjectValidationError(`Tipo de interacción no permitido en la diapositiva ${index + 1}.`);
  }
  const prefix = `slides[${index}].interaction`;
  const interactionType = input.type as SlideInteractionSpec["type"];
  const output: SlideInteractionSpec = { type: interactionType };
  for (const key of ["instruction", "feedback"] as const) {
    if (input[key] !== undefined) output[key] = cleanText(input[key], `${prefix}.${key}`, 2_000);
  }

  if (input.questions !== undefined) {
    if (!Array.isArray(input.questions) || input.questions.length > 30) throw new ProjectValidationError(`${prefix}.questions no es válido.`);
    output.questions = input.questions.map((question: any, qIndex: number) => {
      if (!question || typeof question !== "object") throw new ProjectValidationError(`Pregunta ${qIndex + 1} no válida.`);
      const answers = textList(question.answers, `${prefix}.questions[${qIndex}].answers`, 20, 1_000);
      if (answers.length < 2) throw new ProjectValidationError(`La pregunta ${qIndex + 1} debe tener al menos dos respuestas.`);
      return {
        question: requiredText(question.question, `${prefix}.questions[${qIndex}].question`, 1_000),
        answers,
      };
    });
  }
  if (input.multiChoice !== undefined) {
    const choice = input.multiChoice;
    if (!choice || typeof choice !== "object" || !Array.isArray(choice.options) || choice.options.length < 2 || choice.options.length > 30) {
      throw new ProjectValidationError(`${prefix}.multiChoice no es válido.`);
    }
    output.multiChoice = {
      question: requiredText(choice.question, `${prefix}.multiChoice.question`, 1_000),
      options: choice.options.map((option: any, optionIndex: number) => {
        if (!option || typeof option !== "object" || typeof option.correct !== "boolean") throw new ProjectValidationError(`Opción ${optionIndex + 1} no válida.`);
        return {
          text: requiredText(option.text, `${prefix}.multiChoice.options[${optionIndex}].text`, 1_000),
          correct: option.correct,
          ...(option.feedback !== undefined ? { feedback: cleanText(option.feedback, `${prefix}.multiChoice.options[${optionIndex}].feedback`, 1_000) } : {}),
        };
      }),
    };
  }
  if (input.textField !== undefined) {
    const textField = cleanText(input.textField, `${prefix}.textField`, 8_000);
    if (/<\s*(script|iframe|object|embed|svg|img|audio|video)\b|\bon[a-z]+\s*=|javascript\s*:/i.test(textField)) {
      throw new ProjectValidationError(`${prefix}.textField contiene marcado activo no permitido.`);
    }
    output.textField = textField;
  }
  if (input.trueFalse !== undefined) {
    if (!input.trueFalse || typeof input.trueFalse.question !== "string" || typeof input.trueFalse.correct !== "boolean") {
      throw new ProjectValidationError(`${prefix}.trueFalse no es válido.`);
    }
    output.trueFalse = {
      question: requiredText(input.trueFalse.question, `${prefix}.trueFalse.question`, 1_000),
      correct: input.trueFalse.correct,
    };
  }
  if (input.cards !== undefined) {
    if (!Array.isArray(input.cards) || input.cards.length < 1 || input.cards.length > 50) throw new ProjectValidationError(`${prefix}.cards no es válido.`);
    output.cards = input.cards.map((card: any, cardIndex: number) => {
      if (!card || typeof card !== "object") throw new ProjectValidationError(`Tarjeta ${cardIndex + 1} no válida.`);
      return {
        front: requiredText(card.front, `${prefix}.cards[${cardIndex}].front`, 1_000),
        back: requiredText(card.back, `${prefix}.cards[${cardIndex}].back`, 2_000),
      };
    });
  }
  if (input.summaryGroups !== undefined) {
    if (!Array.isArray(input.summaryGroups) || input.summaryGroups.length > 20) throw new ProjectValidationError(`${prefix}.summaryGroups no es válido.`);
    output.summaryGroups = input.summaryGroups.map((group: any, groupIndex: number) => {
      if (!group || typeof group !== "object") throw new ProjectValidationError(`Grupo ${groupIndex + 1} no válido.`);
      const statements = textList(group.statements, `${prefix}.summaryGroups[${groupIndex}].statements`, 20, 1_000);
      if (statements.length < 2) throw new ProjectValidationError(`El grupo ${groupIndex + 1} debe incluir al menos dos afirmaciones.`);
      return { statements, ...(group.tip !== undefined ? { tip: cleanText(group.tip, `${prefix}.summaryGroups[${groupIndex}].tip`, 1_000) } : {}) };
    });
  }
  if (input.exportablePrompt !== undefined) {
    const prompt = input.exportablePrompt;
    if (!prompt || typeof prompt !== "object") throw new ProjectValidationError(`${prefix}.exportablePrompt no es válido.`);
    output.exportablePrompt = {
      label: requiredText(prompt.label, `${prefix}.exportablePrompt.label`, 500),
      placeholder: cleanText(prompt.placeholder, `${prefix}.exportablePrompt.placeholder`, 1_000),
    };
  }
  if (input.tableData !== undefined) {
    const table = input.tableData;
    if (!table || typeof table !== "object" || !Array.isArray(table.rows) || table.rows.length > 60) throw new ProjectValidationError(`${prefix}.tableData no es válido.`);
    const headers = textList(table.headers, `${prefix}.tableData.headers`, 16, 500);
    const rows = table.rows.map((row: unknown, rowIndex: number) => {
      const cells = textList(row, `${prefix}.tableData.rows[${rowIndex}]`, 16, 500);
      if (headers.length && cells.length !== headers.length) throw new ProjectValidationError(`La fila ${rowIndex + 1} debe tener ${headers.length} celdas.`);
      return cells;
    });
    output.tableData = { headers, rows };
  }
  if (input.videoUrl !== undefined) output.videoUrl = boundedUrl(input.videoUrl, `${prefix}.videoUrl`, true);
  if (input.chatMessages !== undefined) {
    if (!Array.isArray(input.chatMessages) || input.chatMessages.length > 40) throw new ProjectValidationError(`${prefix}.chatMessages no es válido.`);
    output.chatMessages = input.chatMessages.map((message: any, messageIndex: number) => {
      if (!message || typeof message !== "object") throw new ProjectValidationError(`Mensaje ${messageIndex + 1} no válido.`);
      return {
        speaker: requiredText(message.speaker, `${prefix}.chatMessages[${messageIndex}].speaker`, 100),
        role: requiredText(message.role, `${prefix}.chatMessages[${messageIndex}].role`, 80),
        text: requiredText(message.text, `${prefix}.chatMessages[${messageIndex}].text`, 2_000),
      };
    });
  }
  if (input.stepsToOrder !== undefined) output.stepsToOrder = textList(input.stepsToOrder, `${prefix}.stepsToOrder`, 40, 1_000);
  return output;
}

function validateSlide(value: unknown, index: number): HasSlideSpec {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new ProjectValidationError(`La diapositiva ${index + 1} no es válida.`);
  const slide = value as Record<string, any>;
  if (!Number.isInteger(slide.templateSlide) || slide.templateSlide < 1 || slide.templateSlide > 32) {
    throw new ProjectValidationError(`La diapositiva ${index + 1} tiene una plantilla inválida.`);
  }
  const output: HasSlideSpec = {
    id: safeProjectId(slide.id || `slide-${index + 1}`),
    templateSlide: slide.templateSlide,
    menuTitle: requiredText(slide.menuTitle ?? "Diapositiva", `slides[${index}].menuTitle`, 100),
    titleBlack: cleanText(slide.titleBlack ?? "", `slides[${index}].titleBlack`, 300),
    paragraphs: textList(slide.paragraphs ?? [], `slides[${index}].paragraphs`, 100),
  };
  if (slide.key !== undefined) output.key = safeKey(slide.key, `slides[${index}].key`);
  for (const key of ["titleAccent", "subtitle", "highlightBox", "pendingNote", "imagePendingDescription"] as const) {
    if (slide[key] !== undefined) output[key] = cleanText(slide[key], `slides[${index}].${key}`, 2_000);
  }
  for (const key of ["bullets", "apaReferences"] as const) {
    if (slide[key] !== undefined) output[key] = textList(slide[key], `slides[${index}].${key}`, 100, 2_000) as any;
  }
  if (slide.links !== undefined) {
    if (!Array.isArray(slide.links) || slide.links.length > 30) throw new ProjectValidationError(`Los enlaces de la diapositiva ${index + 1} no son válidos.`);
    output.links = slide.links.map((link: any, linkIndex: number) => {
      if (!link || typeof link !== "object") throw new ProjectValidationError(`Enlace ${linkIndex + 1} inválido.`);
      return {
        label: requiredText(link.label, `slides[${index}].links[${linkIndex}].label`, 300),
        url: boundedUrl(link.url, `slides[${index}].links[${linkIndex}].url`),
      };
    });
  }
  if (slide.stepsCards !== undefined) {
    if (!Array.isArray(slide.stepsCards) || slide.stepsCards.length > 20) throw new ProjectValidationError(`stepsCards de la diapositiva ${index + 1} no es válido.`);
    output.stepsCards = slide.stepsCards.map((card: any, cardIndex: number) => {
      if (!card || typeof card !== "object") throw new ProjectValidationError(`Tarjeta ${cardIndex + 1} no válida.`);
      return {
        number: requiredText(card.number, `slides[${index}].stepsCards[${cardIndex}].number`, 20),
        title: requiredText(card.title, `slides[${index}].stepsCards[${cardIndex}].title`, 300),
        description: cleanText(card.description, `slides[${index}].stepsCards[${cardIndex}].description`, 2_000),
        ...(card.targetKey !== undefined ? { targetKey: safeKey(card.targetKey, `slides[${index}].stepsCards[${cardIndex}].targetKey`) } : {}),
      };
    });
  }
  if (slide.svgDiagramId !== undefined) output.svgDiagramId = safeKey(slide.svgDiagramId, `slides[${index}].svgDiagramId`);
  if (slide.reserveVisualSpace !== undefined) {
    if (typeof slide.reserveVisualSpace !== "boolean") {
      throw new ProjectValidationError(`reserveVisualSpace no es válido en la diapositiva ${index + 1}.`);
    }
    output.reserveVisualSpace = slide.reserveVisualSpace;
  }
  if (slide.customSvg !== undefined) {
    const svg = slide.customSvg;
    if (!svg || typeof svg !== "object") throw new ProjectValidationError(`customSvg de la diapositiva ${index + 1} no es válido.`);
    output.customSvg = {
      title: requiredText(svg.title, `slides[${index}].customSvg.title`, 120),
      subtitle: cleanText(svg.subtitle, `slides[${index}].customSvg.subtitle`, 200),
      ...(svg.formula !== undefined ? { formula: cleanText(svg.formula, `slides[${index}].customSvg.formula`, 400) } : {}),
      highlights: textList(svg.highlights, `slides[${index}].customSvg.highlights`, 10, 300),
    };
  }
  if (slide.audioNarration !== undefined) {
    if (!slide.audioNarration || typeof slide.audioNarration !== "object") throw new ProjectValidationError(`La narración de la diapositiva ${index + 1} no es válida.`);
    output.audioNarration = {
      text: cleanText(slide.audioNarration.text ?? "", `slides[${index}].audioNarration.text`, 4_000),
      voice: cleanText(slide.audioNarration.voice ?? "es-CO-SalomeNeural", `slides[${index}].audioNarration.voice`, 80),
    };
  }
  if (slide.interaction !== undefined) output.interaction = validateInteraction(slide.interaction, index);
  if (slide.fontScale !== undefined) {
    if (!ALLOWED_FONT_SCALES.has(slide.fontScale)) throw new ProjectValidationError(`fontScale no válido en diapositiva ${index + 1}.`);
    output.fontScale = slide.fontScale;
  }
  if (slide.boxLayout !== undefined) {
    if (!ALLOWED_BOX_LAYOUTS.has(slide.boxLayout)) throw new ProjectValidationError(`boxLayout no válido en diapositiva ${index + 1}.`);
    output.boxLayout = slide.boxLayout;
  }
  return output;
}

export function validateProjectSpec(value: unknown): HasProjectSpec {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new ProjectValidationError("El campo spec debe ser un objeto.");
  assertJsonComplexity(value);
  const input = value as Record<string, any>;
  if (!Array.isArray(input.slides) || input.slides.length < 1 || input.slides.length > MAX_SLIDES) {
    throw new ProjectValidationError(`El proyecto debe tener entre 1 y ${MAX_SLIDES} diapositivas.`);
  }
  const templateId = cleanText(input.templateId ?? "plantilla-1", "templateId", 40);
  if (!ALLOWED_TEMPLATES.has(templateId)) throw new ProjectValidationError("La plantilla seleccionada no es válida.");
  let selectedTemplateId: string | undefined;
  if (input.selectedTemplateId !== undefined) {
    selectedTemplateId = cleanText(input.selectedTemplateId, "selectedTemplateId", 40);
    if (!isUaoTemplateId(selectedTemplateId)) {
      throw new ProjectValidationError("El diseño seleccionado no pertenece al catálogo UAO.");
    }
  }
  const activityNumber = input.activityNumber === undefined ? 1 : input.activityNumber;
  if (!Number.isInteger(activityNumber) || activityNumber < 1 || activityNumber > 1_000) {
    throw new ProjectValidationError("activityNumber debe ser un entero entre 1 y 1.000.");
  }
  if (input.includeNavigationGuide !== undefined && typeof input.includeNavigationGuide !== "boolean") {
    throw new ProjectValidationError("includeNavigationGuide debe ser booleano.");
  }

  const spec: HasProjectSpec = {
    id: safeProjectId(input.id),
    title: requiredText(input.title ?? "Recurso educativo", "title", 200),
    courseName: requiredText(input.courseName ?? "Curso", "courseName", 200),
    moduleName: requiredText(input.moduleName ?? "Módulo 1", "moduleName", 200),
    activityNumber,
    templateId,
    ...(selectedTemplateId ? { selectedTemplateId } : {}),
    defaultVoice: cleanText(input.defaultVoice ?? "es-CO-SalomeNeural", "defaultVoice", 80),
    includeNavigationGuide: input.includeNavigationGuide ?? false,
    slides: input.slides.map(validateSlide),
    auditReport: textList(input.auditReport ?? [], "auditReport", 100, 2_000),
    textChanges: textList(input.textChanges ?? [], "textChanges", 100, 2_000),
  };
  if (input.fontFamily !== undefined) {
    const font = cleanText(input.fontFamily, "fontFamily", 80);
    if (!H5P_FONT_OPTIONS.some((option) => option.id === font)) throw new ProjectValidationError("fontFamily no está disponible.");
    spec.fontFamily = font;
  }
  if (input.globalFontScale !== undefined) {
    if (!ALLOWED_FONT_SCALES.has(input.globalFontScale)) throw new ProjectValidationError("globalFontScale no es válido.");
    spec.globalFontScale = input.globalFontScale;
  }
  return spec;
}

export async function readBoundedJson<T>(request: Request, maxBytes = 1_000_000): Promise<T> {
  const declaredLength = Number(request.headers.get("content-length") || "0");
  if (declaredLength > maxBytes) throw new ProjectValidationError("El cuerpo de la solicitud supera el tamaño permitido.");
  const raw = await request.text();
  if (Buffer.byteLength(raw, "utf8") > maxBytes) throw new ProjectValidationError("El cuerpo de la solicitud supera el tamaño permitido.");
  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new ProjectValidationError("El cuerpo de la solicitud no contiene JSON válido.");
  }
}
