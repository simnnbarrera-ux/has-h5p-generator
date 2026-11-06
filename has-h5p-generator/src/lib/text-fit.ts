// Ajuste de texto a su caja para H5P.AdvancedText dentro de Course Presentation.
//
// Course Presentation solo autoajusta ContinuousText; el texto de AdvancedText que
// no cabe en su caja se desborda y se monta sobre los elementos de abajo (título
// en dos líneas encima del cuerpo, cuerpo encima del recuadro destacado...). El
// motor no puede medir en un navegador, así que estima la altura del HTML generado
// y, si no cabe, reduce proporcionalmente todos los font-size en em del elemento.
//
// Escala de referencia: Course Presentation escala la letra con el ancho
// (16px a 640px de ancho) y el área de diapositivas mide ~640x312 a esa escala,
// así que lo que cabe a 640px cabe a cualquier tamaño. Las medidas base por
// etiqueta se tomaron del reproductor real (Course Presentation 1.27).

export const CP_SLIDE_WIDTH_PX = 640;
export const CP_SLIDE_HEIGHT_PX = 312;

/** font-size computado de cada bloque dentro de AdvancedText a 640px de ancho. */
const BLOCK_BASE_PX: Record<string, number> = {
  p: 10.8,
  li: 12,
  h1: 24,
  h2: 20,
  h3: 16,
  h4: 13,
  h5: 11,
  h6: 10,
};
/** Sangría de un <li> (margin-left 1.5em del propio ítem). */
const LI_INDENT_EM = 1.5;
/** Los px fijos (padding de recuadros) no escalan; a ~1080px equivalen a ~0.6. */
const FIXED_PX_FACTOR = 0.6;
/** Ancho medio de un carácter respecto al tamaño de letra (sans-serif tipo Inter). */
const CHAR_WIDTH_RATIO = 0.52;
/** El corte por palabras deja huecos al final de cada línea. */
const WRAP_EFFICIENCY = 0.9;
/** Margen de seguridad: el texto debe ocupar como máximo esta fracción de la caja. */
const SAFETY = 0.94;
/** Escala mínima: por debajo el texto deja de ser legible. */
export const MIN_FIT_SCALE = 0.6;
const SCALE_STEP = 0.03;

const BLOCK_RE = /<(p|li|h[1-6])\b([^>]*)>([\s\S]*?)<\/\1>/gi;

function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x?[0-9a-f]+;/gi, "x");
}

function emList(html: string, prop: string): number[] {
  const re = new RegExp(`(?:^|[;"'\\s])${prop}\\s*:\\s*([0-9]*\\.?[0-9]+)em`, "gi");
  const out: number[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) out.push(parseFloat(m[1]));
  return out;
}

function unitlessLineHeight(style: string): number | null {
  const m = /line-height\s*:\s*([0-9]*\.?[0-9]+)\s*(?:;|"|'|$)/i.exec(style);
  return m ? parseFloat(m[1]) : null;
}

function pxSum(html: string, prop: string): number {
  const re = new RegExp(`${prop}\\s*:\\s*([0-9.]+)px`, "gi");
  let total = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) total += parseFloat(m[1]);
  return total;
}

/**
 * Pasa el font-size de los <span> al bloque (<p>/<li>) que los contiene.
 *
 * El alto de cada línea lo fija el bloque (su font-size por su line-height), no
 * el span: un <p> sin tamaño propio mide ~18px por línea aunque el texto sea de
 * ~10px. Así las líneas quedaban muy separadas y reducir la letra del span no
 * liberaba espacio. Con el tamaño en el bloque y los spans en proporción, el
 * texto se ve igual de grande pero el interlineado corresponde a su letra.
 */
export function moveSpanFontSizesToBlocks(html: string): string {
  return html.replace(BLOCK_RE, (whole, tag: string, attrs: string, inner: string) => {
    const lower = tag.toLowerCase();
    if (lower !== "p" && lower !== "li") return whole;
    if (/font-size/i.test(attrs)) return whole;
    if (/<(p|li|ul|ol|div|table)\b/i.test(inner)) return whole;
    const sizes = emList(inner, "font-size");
    if (!sizes.length) return whole;
    const blockEm = Math.max(...sizes);
    const newInner = inner.replace(/(font-size\s*:\s*)([0-9]*\.?[0-9]+)em/gi, (_a, prefix: string, value: string) => {
      const ratio = Math.round((parseFloat(value) / blockEm) * 1000) / 1000;
      return `${prefix}${ratio}em`;
    });
    let newAttrs: string;
    if (/style\s*=\s*"/i.test(attrs)) {
      newAttrs = attrs.replace(/style\s*=\s*"/i, `style="font-size:${blockEm}em;`);
    } else {
      newAttrs = `${attrs} style="font-size:${blockEm}em;"`;
    }
    return `<${tag}${newAttrs}>${newInner}</${tag}>`;
  });
}

/** Alto estimado (px a escala 640x312) del HTML dentro de una caja de `widthPct` de ancho. */
export function estimateTextHeightPx(html: string, widthPct: number, scale = 1): number {
  const boxWidth = (widthPct / 100) * CP_SLIDE_WIDTH_PX;
  let height = 0;
  let cursor = 0;
  BLOCK_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  const re = new RegExp(BLOCK_RE.source, "gi");
  while ((m = re.exec(html))) {
    const between = html.slice(cursor, m.index);
    cursor = m.index + m[0].length;
    const paddedBoxes = (between.match(/<div[^>]*padding\s*:\s*\d+px/gi) || []).length;
    height += (pxSum(between, "margin-top") + paddedBoxes * 24) * FIXED_PX_FACTOR;
    const paddingX = paddedBoxes ? 28 * FIXED_PX_FACTOR : 0;

    const tag = m[1].toLowerCase();
    const attrs = m[2];
    const inner = m[3];
    const text = decodeEntities(inner.replace(/<[^>]*>/g, "")).replace(/\s+/g, " ").trim();
    const base = BLOCK_BASE_PX[tag] ?? 10.8;
    const blockEm = (emList(attrs, "font-size")[0] ?? 1) * scale;
    const blockPx = base * (emList(attrs, "font-size").length ? blockEm : 1);
    const spanEms = emList(inner, "font-size");
    const spanFactor = spanEms.length ? Math.max(...spanEms) : 1;
    // Sin font-size en el bloque, el span escala solo; con él, ya va incluido arriba.
    const textPx = emList(attrs, "font-size").length ? blockPx * spanFactor : base * spanFactor * scale;
    const blockLh = unitlessLineHeight(attrs) ?? 1.35;
    const spanLh = unitlessLineHeight(inner) ?? 1.25;
    const lineHeight = Math.max(blockPx * blockLh, textPx * spanLh);

    const indent = tag === "li" ? LI_INDENT_EM * blockPx : 0;
    const usable = Math.max(boxWidth - indent - paddingX, 20);
    const bold = /<strong|<b>|font-weight\s*:\s*(700|bold)/i.test(inner + attrs) || tag.startsWith("h");
    const textWidth = text.length * textPx * CHAR_WIDTH_RATIO * (bold ? 1.07 : 1);
    const lines = Math.max(1, Math.ceil(textWidth / (usable * WRAP_EFFICIENCY)));
    height += lines * lineHeight;

    const margin = /margin\s*:\s*0\s+0\s+([0-9.]+)em/i.exec(attrs) || /margin-bottom\s*:\s*([0-9.]+)em/i.exec(attrs);
    height += (margin ? parseFloat(margin[1]) : tag === "li" ? 0.3 : 0) * blockPx;
  }
  return height;
}

export function scaleHtmlFontSizes(html: string, factor: number): string {
  if (factor >= 0.999) return html;
  // Solo se escala el tamaño exterior de cada bloque; los spans ya están en proporción.
  return html.replace(BLOCK_RE, (whole, tag: string, attrs: string, inner: string) => {
    const scaleValue = (s: string) =>
      s.replace(/(font-size\s*:\s*)([0-9]*\.?[0-9]+)em/gi, (_a, prefix: string, value: string) =>
        `${prefix}${Math.round(parseFloat(value) * factor * 1000) / 1000}em`
      );
    if (/font-size/i.test(attrs)) return `<${tag}${scaleValue(attrs)}>${inner}</${tag}>`;
    return `<${tag}${attrs}>${scaleValue(inner)}</${tag}>`;
  });
}

/** Mayor escala (<= 1) con la que el HTML cabe en la caja; nunca menor que MIN_FIT_SCALE. */
export function findFittingScale(html: string, widthPct: number, heightPct: number): number {
  const boxHeight = (heightPct / 100) * CP_SLIDE_HEIGHT_PX * SAFETY;
  let scale = 1;
  while (scale > MIN_FIT_SCALE && estimateTextHeightPx(html, widthPct, scale) > boxHeight) {
    scale = Math.round((scale - SCALE_STEP) * 1000) / 1000;
  }
  return Math.max(scale, MIN_FIT_SCALE);
}

/**
 * Normaliza y reduce la letra de cada H5P.AdvancedText que no cabe en su caja.
 * Los popups (displayAsButton) se omiten: Course Presentation los dimensiona
 * según su contenido.
 */
export function fitTextElementsToBoxes(elements: any[]): void {
  for (const element of elements) {
    if (!element || element.displayAsButton) continue;
    const library = element?.action?.library;
    const original = element?.action?.params?.text;
    if (typeof library !== "string" || !library.startsWith("H5P.AdvancedText")) continue;
    if (typeof original !== "string" || !original.trim()) continue;
    const width = Number(element.width);
    const height = Number(element.height);
    if (!(width > 0) || !(height > 0)) continue;
    const html = moveSpanFontSizesToBlocks(original);
    const scale = findFittingScale(html, width, height);
    element.action.params.text = scaleHtmlFontSizes(html, scale);
  }
}
