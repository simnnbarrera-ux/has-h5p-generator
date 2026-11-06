import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeCustomDiagram } from "./custom-diagram";

test("normalizeCustomDiagram builds safe sequential connectors for a flow", () => {
  const diagram = normalizeCustomDiagram({
    kind: "flow",
    title: "Proceso",
    subtitle: "Tres etapas",
    nodes: [
      { id: "inicio", label: "Inicio", type: "start" },
      { id: "proceso", label: "Procesar datos" },
      { id: "fin", label: "Fin", type: "end" },
    ],
  });
  assert.equal(diagram.nodes.length, 3);
  assert.deepEqual(diagram.edges, [
    { from: "inicio", to: "proceso" },
    { from: "proceso", to: "fin" },
  ]);
});

test("normalizeCustomDiagram converts legacy customSvg data to a concept diagram", () => {
  const diagram = normalizeCustomDiagram({
    title: "Tema anterior",
    subtitle: "Descripción",
    highlights: ["Idea A", "Idea B"],
  });
  assert.equal(diagram.kind, "concept");
  assert.equal(diagram.nodes.length, 2);
  assert.equal(diagram.edges[0].from, diagram.nodes[0].id);
});

test("normalizeCustomDiagram rejects graph points outside the declared axes", () => {
  assert.throws(() => normalizeCustomDiagram({
    kind: "graph",
    title: "Velocidad",
    subtitle: "Constante",
    graph: {
      xLabel: "Tiempo",
      yLabel: "Velocidad",
      xMin: 0,
      xMax: 10,
      yMin: 0,
      yMax: 5,
      points: [{ x: 0, y: 3 }, { x: 11, y: 3 }],
    },
  }), /rangos crecientes/);
});
