import assert from "node:assert/strict";
import { test } from "node:test";
import JSZip from "jszip";
import { buildH5pPackageFromSpec } from "./h5p-engine";

test("buildH5pPackageFromSpec rejects a template missing required root manifests", async () => {
  const template = new JSZip();
  template.file("h5p.json", JSON.stringify({ title: "broken" }));
  const buffer = await template.generateAsync({ type: "nodebuffer" });
  await assert.rejects(
    () => buildH5pPackageFromSpec({ id: "test-project", title: "Test", slides: [] } as any, new Map(), buffer),
    /La plantilla H5P debe incluir h5p\.json y content\/content\.json/
  );
});

test("buildH5pPackageFromSpec builds successfully using bundled template", async () => {
  const result = await buildH5pPackageFromSpec({
    id: "test-build-success",
    title: "Test Unitario",
    courseName: "Ingeniería de Software",
    moduleName: "Módulo 1",
    activityNumber: 1,
    templateId: "plantilla-1",
    defaultVoice: "es-CO-SalomeNeural",
    includeNavigationGuide: false,
    auditReport: [],
    textChanges: [],
    slides: [
      {
        id: "slide-1",
        key: "portada",
        templateSlide: 1,
        menuTitle: "Portada",
        titleBlack: "Introducción",
        titleAccent: "General",
        paragraphs: ["Texto de prueba para verificación unitaria."],
      },
    ],
  });
  assert.ok(result.h5pBuffer.length > 0);
  assert.equal(result.slidesCount, 1);
  assert.ok(result.previewPath.includes("test-build-success"));
});
