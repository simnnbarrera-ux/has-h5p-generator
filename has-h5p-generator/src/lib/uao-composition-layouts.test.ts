import assert from "node:assert/strict";
import { test } from "node:test";
import { getUaoCompositionShapeElements } from "./uao-composition-layouts";
import { UAO_TEMPLATE_CATALOG } from "./uao-template-catalog";

const palette = {
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

test("all ten UAO compositions expose nine safe shape-layout variants", () => {
  const compositionIds = UAO_TEMPLATE_CATALOG.filter((template) => template.group === "composicion").map((template) => template.id);
  assert.equal(compositionIds.length, 10);

  for (const compositionId of compositionIds) {
    let totalShapes = 0;
    for (let layout = 1; layout <= 9; layout += 1) {
      const shapes = getUaoCompositionShapeElements(compositionId, layout, palette);
      totalShapes += shapes.length;
      assert.ok(shapes.every((element) => element.action.library.startsWith("H5P.Shape")));
      assert.ok(shapes.every((element) => !("subContentId" in element.action)));
    }
    assert.ok(totalShapes > 0, `${compositionId} should provide at least one decorative shape`);
  }
});

test("composition loader rejects a palette ID and out-of-range layout", () => {
  assert.deepEqual(getUaoCompositionShapeElements("facultad-1", 1, palette), []);
  assert.deepEqual(getUaoCompositionShapeElements("composicion-01", 10, palette), []);
});

test("composition shapes adopt the selected palette instead of retaining the ZIP's source tint", () => {
  const elements = getUaoCompositionShapeElements("composicion-01", 1, palette);
  const serialized = JSON.stringify(elements).toLowerCase();
  assert.ok(serialized.includes("#123456"));
  assert.equal(serialized.includes("#ac0b32"), false);
});
