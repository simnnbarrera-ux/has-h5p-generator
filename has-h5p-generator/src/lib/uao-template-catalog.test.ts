import { deepStrictEqual, equal, notEqual, ok, throws } from "node:assert/strict";
import { existsSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { RETO11_ACT1_SPEC } from "./reto11-seed";
import { validateProjectSpec, ProjectValidationError } from "./project-validation";
import {
  UAO_TEMPLATE_CATALOG,
  getUaoTemplate,
  isUaoTemplateId,
} from "./uao-template-catalog";

test("el catálogo UAO contiene 20 diseños ordenados y sin IDs duplicados", () => {
  equal(UAO_TEMPLATE_CATALOG.length, 20);
  equal(new Set(UAO_TEMPLATE_CATALOG.map((item) => item.id)).size, 20);
  deepStrictEqual(
    ["facultad", "marca", "composicion"].map(
      (group) => UAO_TEMPLATE_CATALOG.filter((item) => item.group === group).length
    ),
    [5, 5, 10]
  );
});

test("cada diseño tiene paleta, vista previa y modo de generación coherente", () => {
  for (const item of UAO_TEMPLATE_CATALOG) {
    ok(item.theme.colors.primary.startsWith("#"));
    ok(item.theme.colors.accent.startsWith("#"));
    ok(item.previewImage || item.previewHtml);
    const previewPath = (item.previewImage || item.previewHtml)?.split("#", 1)[0];
    ok(
      previewPath && existsSync(path.join(process.cwd(), "public", previewPath.replace(/^\//, ""))),
      `No existe el preview de ${item.id}`
    );
    if (item.group === "facultad") {
      equal(item.generationMode, "h5p-base");
      equal(item.slideCount, 34);
      ok(item.h5pStoragePath?.startsWith("templates/uao/facultad/"));
    } else if (item.group === "composicion") {
      equal(item.generationMode, "composition-overlay");
      equal(item.slideCount, 9);
      equal(item.h5pStoragePath, undefined);
    } else {
      equal(item.generationMode, "adapted-theme");
      equal(item.slideCount, 9);
      equal(item.h5pStoragePath, undefined);
    }
  }
});

test("project validation conserva IDs oficiales y rechaza IDs arbitrarios", () => {
  const withTemplate = {
    ...structuredClone(RETO11_ACT1_SPEC),
    id: "catalog-template-validation",
    selectedTemplateId: "facultad-2",
  };
  const validated = validateProjectSpec(withTemplate);
  equal(validated.selectedTemplateId, "facultad-2");
  equal(validated.baseTemplateId, "facultad-2");
  const legacyComposition = validateProjectSpec({ ...withTemplate, selectedTemplateId: "composicion-03" });
  equal(legacyComposition.selectedTemplateId, "facultad-1");
  equal(legacyComposition.baseTemplateId, "facultad-1");
  const independentPaletteAndBase = validateProjectSpec({
    ...withTemplate,
    selectedTemplateId: "plantilla-2",
    baseTemplateId: "facultad-5",
  });
  equal(independentPaletteAndBase.selectedTemplateId, "plantilla-2");
  equal(independentPaletteAndBase.baseTemplateId, "facultad-5");
  equal(isUaoTemplateId("composicion-10"), true);
  equal(isUaoTemplateId("../../private-file"), false);
  ok(getUaoTemplate("plantilla-4"));

  throws(
    () => validateProjectSpec({ ...withTemplate, selectedTemplateId: "../../private-file" }),
    (error: unknown) => error instanceof ProjectValidationError
  );
  throws(
    () => validateProjectSpec({ ...withTemplate, baseTemplateId: "plantilla-2" }),
    (error: unknown) => error instanceof ProjectValidationError
  );
  notEqual(validated.templateId, validated.selectedTemplateId);
});
