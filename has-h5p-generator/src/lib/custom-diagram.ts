export type CustomDiagramKind = "flow" | "comparison" | "concept" | "timeline" | "graph";
export type CustomDiagramNodeKind = "start" | "process" | "decision" | "end" | "data";

export interface CustomDiagramNode {
  id: string;
  label: string;
  detail?: string;
  type: CustomDiagramNodeKind;
}

export interface CustomDiagramEdge {
  from: string;
  to: string;
  label?: string;
}

export interface CustomDiagramGraph {
  xLabel: string;
  yLabel: string;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  points: Array<{ x: number; y: number }>;
}

export interface CustomDiagramSpec {
  kind: CustomDiagramKind;
  title: string;
  subtitle: string;
  formula?: string;
  highlights: string[];
  nodes: CustomDiagramNode[];
  edges: CustomDiagramEdge[];
  graph?: CustomDiagramGraph;
}

const ALLOWED_KINDS = new Set<CustomDiagramKind>(["flow", "comparison", "concept", "timeline", "graph"]);
const ALLOWED_NODE_KINDS = new Set<CustomDiagramNodeKind>(["start", "process", "decision", "end", "data"]);

function cleanText(value: unknown, maxLength: number, fallback = ""): string {
  if (typeof value !== "string") return fallback;
  return value
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength) || fallback;
}

function finiteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function safeNodeId(value: unknown, index: number): string {
  const normalized = typeof value === "string" ? value.toLowerCase().replace(/[^a-z0-9_-]/g, "-").replace(/^-+|-+$/g, "").slice(0, 32) : "";
  return normalized || `n${index + 1}`;
}

export function normalizeCustomDiagram(value: unknown, fallbackTitle = "Diagrama educativo"): CustomDiagramSpec {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("El diagrama generado no tiene una estructura válida.");
  }
  const input = value as Record<string, unknown>;
  const kind = input.kind === undefined ? "concept" : input.kind;
  if (typeof kind !== "string" || !ALLOWED_KINDS.has(kind as CustomDiagramKind)) {
    throw new Error("El tipo de diagrama generado no está permitido.");
  }

  const title = cleanText(input.title, 80, cleanText(fallbackTitle, 80, "Diagrama educativo"));
  const subtitle = cleanText(input.subtitle, 120, "Representación visual del tema");
  const formula = cleanText(input.formula, 160);
  const highlights = Array.isArray(input.highlights)
    ? input.highlights.slice(0, 4).map((item) => cleanText(item, 160)).filter(Boolean)
    : [];

  const rawNodes = Array.isArray(input.nodes) ? input.nodes.slice(0, 8) : [];
  const usedIds = new Set<string>();
  let nodes = rawNodes.flatMap((item, index) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return [];
    const node = item as Record<string, unknown>;
    let id = safeNodeId(node.id, index);
    if (usedIds.has(id)) id = `${id}-${index + 1}`;
    usedIds.add(id);
    const nodeKind = typeof node.type === "string" && ALLOWED_NODE_KINDS.has(node.type as CustomDiagramNodeKind)
      ? node.type as CustomDiagramNodeKind
      : "process";
    const label = cleanText(node.label, 72);
    if (!label) return [];
    const detail = cleanText(node.detail, 110);
    return [{ id, label, ...(detail ? { detail } : {}), type: nodeKind }];
  });

  if (kind !== "graph" && nodes.length < 2) {
    const labels = (highlights.length >= 2 ? highlights : [...highlights, title, subtitle]).filter(Boolean).slice(0, 4);
    nodes = labels.slice(0, Math.max(2, labels.length)).map((label, index) => ({
      id: `n${index + 1}`,
      label: cleanText(label, 72, `Paso ${index + 1}`),
      type: (index === 0 ? "start" : index === labels.length - 1 ? "end" : "process") as CustomDiagramNodeKind,
    }));
  }

  const nodeIds = new Set(nodes.map((node) => node.id));
  const rawEdges = Array.isArray(input.edges) ? input.edges.slice(0, 12) : [];
  let edges = rawEdges.flatMap((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return [];
    const edge = item as Record<string, unknown>;
    if (typeof edge.from !== "string" || typeof edge.to !== "string" || !nodeIds.has(edge.from) || !nodeIds.has(edge.to) || edge.from === edge.to) return [];
    const label = cleanText(edge.label, 48);
    return [{ from: edge.from, to: edge.to, ...(label ? { label } : {}) }];
  });

  if ((kind === "flow" || kind === "timeline") && edges.length === 0) {
    edges = nodes.slice(0, -1).map((node, index) => ({ from: node.id, to: nodes[index + 1].id }));
  } else if (kind === "concept" && edges.length === 0) {
    edges = nodes.slice(1).map((node) => ({ from: nodes[0].id, to: node.id }));
  }

  let graph: CustomDiagramGraph | undefined;
  if (kind === "graph") {
    if (!input.graph || typeof input.graph !== "object" || Array.isArray(input.graph)) {
      throw new Error("El gráfico requiere ejes y puntos numéricos válidos.");
    }
    const rawGraph = input.graph as Record<string, unknown>;
    const xMin = rawGraph.xMin;
    const xMax = rawGraph.xMax;
    const yMin = rawGraph.yMin;
    const yMax = rawGraph.yMax;
    const points = Array.isArray(rawGraph.points)
      ? rawGraph.points.slice(0, 12).flatMap((point) => {
          if (!point || typeof point !== "object" || Array.isArray(point)) return [];
          const candidate = point as Record<string, unknown>;
          if (!finiteNumber(candidate.x) || !finiteNumber(candidate.y)) return [];
          return [{ x: candidate.x, y: candidate.y }];
        })
      : [];
    if (
      !finiteNumber(xMin) || !finiteNumber(xMax) || !finiteNumber(yMin) || !finiteNumber(yMax) ||
      xMin >= xMax || yMin >= yMax || points.length < 2 ||
      [xMin, xMax, yMin, yMax, ...points.flatMap((point) => [point.x, point.y])].some((number) => Math.abs(number) > 1_000_000) ||
      points.some((point) => point.x < xMin || point.x > xMax || point.y < yMin || point.y > yMax)
    ) {
      throw new Error("El gráfico requiere rangos crecientes y al menos dos puntos dentro de los ejes.");
    }
    graph = {
      xLabel: cleanText(rawGraph.xLabel, 48, "x"),
      yLabel: cleanText(rawGraph.yLabel, 48, "y"),
      xMin,
      xMax,
      yMin,
      yMax,
      points,
    };
  }

  if (kind !== "graph" && nodes.length < 2) {
    throw new Error("El diagrama debe incluir al menos dos elementos.");
  }

  return {
    kind: kind as CustomDiagramKind,
    title,
    subtitle,
    ...(formula ? { formula } : {}),
    highlights,
    nodes,
    edges,
    ...(graph ? { graph } : {}),
  };
}
