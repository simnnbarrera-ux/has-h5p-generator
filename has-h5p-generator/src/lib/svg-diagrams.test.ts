import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeCustomDiagram } from "./custom-diagram";
import { generateCustomDiagramSvg } from "./svg-diagrams";

const theme = {
  primary: "#123456",
  accent: "#0099E6",
  background: "#F8FAFC",
  cardBg: "#FFFFFF",
  cardBorder: "#CBD5E1",
  textPrimary: "#0F172A",
  textMuted: "#475569",
  badgeBg: "#123456",
  badgeText: "#FFFFFF",
  highlightBg: "#E0F3FA",
};

test("custom diagram renderer creates a real flowchart and XML-escapes labels", () => {
  const diagram = normalizeCustomDiagram({
    kind: "flow",
    title: "<script>alert(1)</script>",
    subtitle: "Proceso seguro",
    nodes: [
      { id: "start", label: "Entrada", type: "start" },
      { id: "check", label: "Validar datos", type: "decision" },
      { id: "end", label: "Resultado", type: "end" },
    ],
  });
  const asset = generateCustomDiagramSvg({ id: "test-flow", ...diagram, theme });
  assert.match(asset.svgContent, /marker-end="url\(#arrow\)"/);
  assert.match(asset.svgContent, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.equal(asset.svgContent.includes("<script>"), false);
  assert.match(asset.svgContent, /#123456/);
});

test("custom diagram renderer plots supplied graph points on labeled axes", () => {
  const diagram = normalizeCustomDiagram({
    kind: "graph",
    title: "Velocidad constante",
    subtitle: "Diagrama velocidad-tiempo",
    graph: {
      xLabel: "Tiempo (s)",
      yLabel: "Velocidad (m/s)",
      xMin: 0,
      xMax: 10,
      yMin: 0,
      yMax: 5,
      points: [{ x: 0, y: 3 }, { x: 10, y: 3 }],
    },
  });
  const asset = generateCustomDiagramSvg({ id: "test-graph", ...diagram, theme });
  assert.match(asset.svgContent, /M 140 318 L 860 318/);
  assert.match(asset.svgContent, /Tiempo \(s\)/);
  assert.match(asset.svgContent, /Velocidad \(m\/s\)/);
});
