export type UaoTemplateGroup = "facultad" | "marca" | "composicion";
export type UaoTemplateGenerationMode = "h5p-base" | "adapted-theme" | "composition-overlay";

export interface UaoTemplateColors {
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
}

export interface UaoTemplateTheme {
  id: string;
  templateNumber: number;
  name: string;
  shortName: string;
  category: string;
  description: string;
  pedagogicalStyle: string;
  recommendedFont: string;
  colors: UaoTemplateColors;
}

export interface UaoTemplateEntry {
  id: string;
  name: string;
  group: UaoTemplateGroup;
  groupLabel: string;
  style: string;
  slideCount: number;
  previewImage?: string;
  previewHtml?: string;
  generationMode: UaoTemplateGenerationMode;
  compatibilityNote: string;
  h5pStoragePath?: string;
  theme: UaoTemplateTheme;
}

function colors(
  primary: string,
  accent: string,
  background: string,
  cardBorder: string,
  highlightBg: string,
  cardBg = "#FFFFFF",
  textPrimary = "#1A1A1A",
  textMuted = "#525252"
): UaoTemplateColors {
  return {
    primary,
    accent,
    background,
    cardBg,
    cardBorder,
    textPrimary,
    textMuted,
    badgeBg: primary,
    badgeText: "#FFFFFF",
    highlightBg,
  };
}

function entry(args: {
  id: string;
  name: string;
  shortName: string;
  group: UaoTemplateGroup;
  style: string;
  index: number;
  palette: UaoTemplateColors;
  recommendedFont?: string;
}): UaoTemplateEntry {
  const isFaculty = args.group === "facultad";
  const groupLabel =
    args.group === "facultad"
      ? "Facultad"
      : args.group === "marca"
      ? "Marca UAO"
      : "Composición";
  const previewBase =
    args.group === "composicion"
      ? `/uao-templates/composiciones/${args.id}.html#mini-1`
      : `/uao-templates/vistas-previas/${args.id}.png`;
  const compatibilityNote = isFaculty
    ? "Base H5P completa de Facultad. Su paleta define la identidad visual y conserva las interacciones compatibles."
    : args.group === "composicion"
      ? "Composición real extraída del paquete H5P del ZIP: sus formas y distribución se aplican al layout equivalente de cada diapositiva generada."
      : "Paleta e identidad visual de Marca UAO. Se aplica al H5P completo sin reemplazar su contenido ni sus interacciones.";

  return {
    id: args.id,
    name: args.name,
    group: args.group,
    groupLabel,
    style: args.style,
    slideCount: isFaculty ? 34 : 9,
    ...(args.group === "composicion"
      ? { previewHtml: previewBase }
      : { previewImage: previewBase }),
    generationMode: isFaculty
      ? "h5p-base"
      : args.group === "composicion"
        ? "composition-overlay"
        : "adapted-theme",
    compatibilityNote,
    ...(isFaculty
      ? { h5pStoragePath: `templates/uao/facultad/${args.id}.h5p` }
      : {}),
    theme: {
      id: args.id,
      templateNumber: args.index + 10,
      name: args.name,
      shortName: args.shortName,
      category: groupLabel,
      description: compatibilityNote,
      pedagogicalStyle: args.style || groupLabel,
      recommendedFont: args.recommendedFont || "plus_jakarta",
      colors: args.palette,
    },
  };
}

const editorialPalette = colors(
  "#8A1428",
  "#FF051E",
  "#FBF5EC",
  "#E8D8CC",
  "#F3E4DC"
);
const outlinePalette = colors(
  "#1A1A1A",
  "#FF051E",
  "#FBF5EC",
  "#C9B7A9",
  "#F3E4DC"
);

export const UAO_TEMPLATE_CATALOG: UaoTemplateEntry[] = [
  entry({
    id: "facultad-1",
    name: "Plantilla Facultad 1",
    shortName: "Facultad 1 · Azul",
    group: "facultad",
    style: "Azul institucional",
    index: 0,
    palette: colors("#0099E6", "#1D5CFF", "#E0F3FA", "#B8E3F3", "#FEF3C7"),
  }),
  entry({
    id: "facultad-2",
    name: "Plantilla Facultad 2",
    shortName: "Facultad 2 · Violeta",
    group: "facultad",
    style: "Violeta contemporáneo",
    index: 1,
    palette: colors("#9B4CD7", "#7C3AED", "#F3EAFA", "#E3CDF4", "#FEF3C7"),
  }),
  entry({
    id: "facultad-3",
    name: "Plantilla Facultad 3",
    shortName: "Facultad 3 · Naranja",
    group: "facultad",
    style: "Naranja energético",
    index: 2,
    palette: colors("#FF4503", "#DB3B03", "#FFE9E1", "#FFC4B0", "#FEF3C7"),
  }),
  entry({
    id: "facultad-4",
    name: "Plantilla Facultad 4",
    shortName: "Facultad 4 · Turquesa",
    group: "facultad",
    style: "Turquesa fresco",
    index: 3,
    palette: colors("#00C6A1", "#0F766E", "#E1FAF4", "#A7F3D0", "#CCFBF1"),
  }),
  entry({
    id: "facultad-5",
    name: "Plantilla Facultad 5",
    shortName: "Facultad 5 · Rosa",
    group: "facultad",
    style: "Rosa vibrante",
    index: 4,
    palette: colors("#FF74C4", "#E668B0", "#FFEEF8", "#FBCFE8", "#FCE7F3"),
  }),
  entry({
    id: "plantilla-1",
    name: "Plantilla 1 · Crema y rojo",
    shortName: "Crema y rojo",
    group: "marca",
    style: "Paleta crema, rojo y grafito",
    index: 5,
    palette: colors("#FF051E", "#8A1428", "#FBF5EC", "#E8D8CC", "#F3E4DC"),
  }),
  entry({
    id: "plantilla-2",
    name: "Plantilla 2 · Granate",
    shortName: "Granate",
    group: "marca",
    style: "Paleta granate y crema",
    index: 6,
    palette: colors("#8A1428", "#AC0B32", "#FBF5EC", "#E8D8CC", "#F3E4DC"),
  }),
  entry({
    id: "plantilla-3",
    name: "Plantilla 3 · Contorno",
    shortName: "Contorno",
    group: "marca",
    style: "Contornos de alto contraste",
    index: 7,
    palette: outlinePalette,
  }),
  entry({
    id: "plantilla-4",
    name: "Plantilla 4 · Foto y rojo",
    shortName: "Foto y rojo",
    group: "marca",
    style: "Paleta editorial con acento rojo",
    index: 8,
    palette: colors("#8A1428", "#FF051E", "#FBF5EC", "#E8D8CC", "#F3E4DC"),
  }),
  entry({
    id: "plantilla-5",
    name: "Plantilla 5 · Coral",
    shortName: "Coral",
    group: "marca",
    style: "Paleta coral, granate y crema",
    index: 9,
    palette: colors("#FF836C", "#8A1428", "#FBF5EC", "#F4C7B8", "#FCE1D9"),
  }),
  entry({
    id: "composicion-01",
    name: "Plantilla 1 · Editorial",
    shortName: "Editorial",
    group: "composicion",
    style: "Composición editorial",
    index: 10,
    palette: editorialPalette,
    recommendedFont: "merriweather",
  }),
  entry({
    id: "composicion-02",
    name: "Plantilla 2 · Bloques de color",
    shortName: "Bloques de color",
    group: "composicion",
    style: "Bloques de color",
    index: 11,
    palette: colors("#8A1428", "#FF051E", "#FBF5EC", "#E8D8CC", "#F3E4DC"),
  }),
  entry({
    id: "composicion-03",
    name: "Plantilla 3 · Círculos",
    shortName: "Círculos",
    group: "composicion",
    style: "Composición de círculos",
    index: 12,
    palette: colors("#8A1428", "#FF051E", "#FBF5EC", "#E8D8CC", "#F3E4DC"),
  }),
  entry({
    id: "composicion-04",
    name: "Plantilla 4 · Riel lateral",
    shortName: "Riel lateral",
    group: "composicion",
    style: "Jerarquía con riel lateral",
    index: 13,
    palette: colors("#AC0B32", "#FF051E", "#FBF5EC", "#E8D8CC", "#F3E4DC"),
  }),
  entry({
    id: "composicion-05",
    name: "Plantilla 5 · Tarjeta flotante",
    shortName: "Tarjeta flotante",
    group: "composicion",
    style: "Tarjeta flotante",
    index: 14,
    palette: colors("#8A1428", "#FF051E", "#FBF5EC", "#E8D8CC", "#F3E4DC"),
  }),
  entry({
    id: "composicion-06",
    name: "Plantilla 6 · Mosaico",
    shortName: "Mosaico",
    group: "composicion",
    style: "Mosaico modular",
    index: 15,
    palette: colors("#8A1428", "#FF051E", "#FBF5EC", "#E8D8CC", "#F3E4DC"),
  }),
  entry({
    id: "composicion-07",
    name: "Plantilla 7 · Contorno",
    shortName: "Contorno",
    group: "composicion",
    style: "Contorno de alto contraste",
    index: 16,
    palette: outlinePalette,
  }),
  entry({
    id: "composicion-08",
    name: "Plantilla 8 · Pestañas",
    shortName: "Pestañas",
    group: "composicion",
    style: "Composición por pestañas",
    index: 17,
    palette: colors("#8A1428", "#FF051E", "#FBF5EC", "#E8D8CC", "#F3E4DC"),
  }),
  entry({
    id: "composicion-09",
    name: "Plantilla 9 · Centrada",
    shortName: "Centrada",
    group: "composicion",
    style: "Composición centrada",
    index: 18,
    palette: colors("#8A1428", "#FF051E", "#FBF5EC", "#E8D8CC", "#F3E4DC"),
  }),
  entry({
    id: "composicion-10",
    name: "Plantilla 10 · Escalonada",
    shortName: "Escalonada",
    group: "composicion",
    style: "Composición escalonada",
    index: 19,
    palette: colors("#8A1428", "#FF836C", "#FBF5EC", "#E8D8CC", "#F3E4DC"),
  }),
];

export const DEFAULT_UAO_TEMPLATE_ID = "facultad-1";

export function getUaoTemplate(id?: string | null): UaoTemplateEntry | undefined {
  return UAO_TEMPLATE_CATALOG.find((template) => template.id === id);
}

export function isUaoTemplateId(value: unknown): value is string {
  return typeof value === "string" && UAO_TEMPLATE_CATALOG.some((template) => template.id === value);
}

export function isUaoCompositionId(value: unknown): value is string {
  return typeof value === "string" && getUaoTemplate(value)?.group === "composicion";
}

export function isUaoPaletteId(value: unknown): value is string {
  const group = typeof value === "string" ? getUaoTemplate(value)?.group : undefined;
  return group === "facultad" || group === "marca";
}

export function isUaoBaseTemplateId(value: unknown): value is string {
  return typeof value === "string" && getUaoTemplate(value)?.generationMode === "h5p-base";
}
