import layouts from "./uao-composition-layouts.json";
import { getUaoTemplate, isUaoCompositionId } from "./uao-template-catalog";

type Palette = {
  primary: string;
  accent: string;
  background: string;
  cardBg: string;
  cardBorder: string;
  textPrimary: string;
  textMuted: string;
  badgeBg: string;
  badgeText: string;
  highlightBg: string;
};

type ShapeElement = Record<string, unknown> & {
  action: {
    library: string;
    metadata: { contentType: string; license: string };
    params: Record<string, unknown>;
  };
};

type LayoutCatalog = Record<string, { slides: ShapeElement[][] }>;
const COMPOSITION_LAYOUTS = layouts as LayoutCatalog;

function normalizeColor(value: string): string {
  const hex = value.trim().toLowerCase();
  const rgb = hex.match(/^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*[\d.]+)?\s*\)$/);
  if (rgb) {
    return `#${rgb.slice(1, 4).map((part) => Number(part).toString(16).padStart(2, "0")).join("")}`;
  }
  return hex;
}

function createColorMap(source: Palette, target: Palette): Map<string, string> {
  const pairs: Array<[string, string]> = [
    [source.primary, target.primary],
    [source.accent, target.accent],
    [source.background, target.background],
    [source.cardBg, target.cardBg],
    [source.cardBorder, target.cardBorder],
    [source.textPrimary, target.textPrimary],
    [source.textMuted, target.textMuted],
    [source.badgeBg, target.badgeBg],
    [source.badgeText, target.badgeText],
    [source.highlightBg, target.highlightBg],
  ];
  const result = new Map<string, string>();
  for (const [from, to] of pairs) {
    const key = normalizeColor(from);
    if (key && !result.has(key)) result.set(key, to);
  }
  return result;
}

function remapColors(value: unknown, colorMap: Map<string, string>): unknown {
  if (typeof value === "string") return colorMap.get(normalizeColor(value)) || value;
  if (Array.isArray(value)) return value.map((item) => remapColors(item, colorMap));
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, remapColors(item, colorMap)])
  );
}

/** Returns sanitized H5P.Shape elements for the matching one of the nine slide archetypes. */
export function getUaoCompositionShapeElements(
  compositionId: string | undefined,
  layoutNumber: number,
  targetPalette: Palette
): ShapeElement[] {
  if (!isUaoCompositionId(compositionId) || !Number.isInteger(layoutNumber) || layoutNumber < 1 || layoutNumber > 9) {
    return [];
  }

  const sourcePalette = getUaoTemplate(compositionId)?.theme.colors;
  const shapes = COMPOSITION_LAYOUTS[compositionId]?.slides[layoutNumber - 1];
  if (!sourcePalette || !Array.isArray(shapes)) return [];

  const colorMap = createColorMap(sourcePalette, targetPalette);
  return shapes.map((element) => ({
    ...element,
    action: {
      ...element.action,
      params: remapColors(element.action.params, colorMap) as Record<string, unknown>,
    },
  }));
}
