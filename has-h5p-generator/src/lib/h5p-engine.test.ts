import assert from "node:assert/strict";
import { test } from "node:test";
import JSZip from "jszip";
import { normalizeCustomDiagram } from "./custom-diagram";
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

test("compositionId adds real H5P.Shape elements to the matching generated slide layout", async () => {
  const build = async (compositionId?: string) => {
    const result = await buildH5pPackageFromSpec({
      id: `composition-test-${compositionId || "base"}`,
      title: "Prueba de composición",
      courseName: "Curso de prueba",
      moduleName: "Unidad 1",
      activityNumber: 1,
      templateId: "plantilla-1",
      selectedTemplateId: "facultad-1",
      defaultVoice: "es-CO-SalomeNeural",
      includeNavigationGuide: false,
      auditReport: [],
      textChanges: [],
      slides: [{
        id: "slide-1",
        templateSlide: 9,
        menuTitle: "Esquema",
        titleBlack: "Diagrama técnico",
        paragraphs: ["Texto de prueba."],
        ...(compositionId ? { compositionId } : {}),
      }],
    });
    const zip = await JSZip.loadAsync(result.h5pBuffer);
    const content = JSON.parse(await zip.file("content/content.json")!.async("text"));
    return content.presentation.slides[0].elements as any[];
  };

  const baseElements = await build();
  const composedElements = await build("composicion-02");
  const baseShapeCount = baseElements.filter((element) => element.action?.library?.startsWith("H5P.Shape")).length;
  const composedShapes = composedElements.filter((element) => element.action?.library?.startsWith("H5P.Shape"));
  assert.ok(composedShapes.length > baseShapeCount, "Debe incorporar las formas estructurales de la composición seleccionada.");
  assert.ok(composedElements.some((element) => element.action?.params?.text?.includes("Texto de prueba.")), "La composición no debe desplazar ni borrar el texto del slide.");
  const ids = composedShapes.map((element) => element.action.subContentId);
  assert.equal(new Set(ids).size, ids.length, "Cada forma debe recibir un subContentId nuevo y único.");
});

test("reserveVisualSpace leaves a blank column on image layouts and releases width when disabled", async () => {
  for (const templateSlide of [4, 7, 9, 19]) {
    const buildSlide = async (reserveVisualSpace: boolean) => {
      const result = await buildH5pPackageFromSpec({
        id: `visual-space-${templateSlide}-${reserveVisualSpace}`,
        title: "Prueba visual",
        courseName: "Curso de prueba",
        moduleName: "Unidad 1",
        activityNumber: 1,
        templateId: "plantilla-1",
        defaultVoice: "es-CO-SalomeNeural",
        includeNavigationGuide: false,
        auditReport: [],
        textChanges: [],
        slides: [{
          id: "slide-1",
          templateSlide,
          menuTitle: "Concepto",
          titleBlack: "Idea central",
          paragraphs: ["Texto de prueba para verificar el ancho."],
          reserveVisualSpace,
        }],
      } as any);
      const zip = await JSZip.loadAsync(result.h5pBuffer);
      const content = JSON.parse(await zip.file("content/content.json")!.async("text"));
      const elements = content.presentation.slides[0].elements as any[];
      const bodyElement = elements.find((element) =>
        typeof element.action?.params?.text === "string" &&
        element.action.params.text.includes("Texto de prueba para verificar el ancho.")
      );
      return {
        bodyWidth: bodyElement?.width,
        hasImageElement: elements.some((element) => element.action?.library?.startsWith("H5P.Image")),
      };
    };

    const reserved = await buildSlide(true);
    const expanded = await buildSlide(false);
    assert.equal(reserved.hasImageElement, false, `El layout ${templateSlide} debe quedar en blanco sin recurso.`);
    assert.equal(expanded.hasImageElement, false, `El layout ${templateSlide} no debe conservar una imagen oculta.`);
    assert.equal(typeof reserved.bodyWidth, "number", `No se encontró el texto del layout ${templateSlide}.`);
    assert.equal(typeof expanded.bodyWidth, "number", `No se encontró el texto expandido del layout ${templateSlide}.`);
    assert.ok(expanded.bodyWidth > reserved.bodyWidth, `El layout ${templateSlide} debe ampliar el texto al apagar la reserva.`);
  }
});

test("buildH5pPackageFromSpec uses the injected SVG rasterizer", async () => {
  let rasterizedSvg = "";
  const result = await buildH5pPackageFromSpec({
    id: "rasterizer-injection-test",
    title: "Prueba de rasterizador",
    courseName: "Curso de prueba",
    moduleName: "Unidad 1",
    activityNumber: 1,
    templateId: "plantilla-1",
    defaultVoice: "es-CO-SalomeNeural",
    includeNavigationGuide: false,
    auditReport: [],
    textChanges: [],
    slides: [{
      id: "slide-1",
      key: "concepto",
      templateSlide: 9,
      menuTitle: "Conjuntos numéricos",
      titleBlack: "Conjuntos",
      titleAccent: "numéricos",
      paragraphs: ["Representación de conjuntos."],
      svgDiagramId: "conjuntos_numericos",
    }],
  }, new Map(), undefined, async (svgContent) => {
    rasterizedSvg = svgContent;
    return Buffer.from("test-png");
  });

  assert.match(rasterizedSvg, /<svg/i);
  assert.ok(result.h5pBuffer.length > 0);
});


test("structured AI diagrams are rasterized and embedded in the H5P package", async () => {
  let rasterizedSvg = "";
  const result = await buildH5pPackageFromSpec({
    id: "custom-diagram-integration-test",
    title: "Prueba de diagrama",
    courseName: "Curso de prueba",
    moduleName: "Unidad 1",
    activityNumber: 1,
    templateId: "plantilla-1",
    selectedTemplateId: "facultad-1",
    defaultVoice: "es-CO-SalomeNeural",
    includeNavigationGuide: false,
    auditReport: [],
    textChanges: [],
    slides: [{
      id: "diagram-slide",
      templateSlide: 9,
      menuTitle: "Flujo de datos",
      titleBlack: "Flujo de datos",
      paragraphs: ["Entrada", "Validación"],
      reserveVisualSpace: true,
      customSvg: normalizeCustomDiagram({
        kind: "flow",
        title: "Flujo de validación",
        subtitle: "Procesamiento de una solicitud",
        nodes: [
          { id: "input", label: "Entrada", type: "start" },
          { id: "check", label: "Validar datos", type: "decision" },
          { id: "result", label: "Resultado", type: "end" },
        ],
      }),
    }],
  } as any, new Map(), undefined, async (svgContent) => {
    rasterizedSvg = svgContent;
    return Buffer.from("test-png");
  });

  assert.match(rasterizedSvg, /marker-end="url\(#arrow\)"/);
  const zip = await JSZip.loadAsync(result.h5pBuffer);
  const pngFiles = Object.keys(zip.files).filter((path) => path.endsWith(".png"));
  assert.ok(pngFiles.some((path) => path.endsWith("has-custom-diagram-slide.png")));
  const content = JSON.parse(await zip.file("content/content.json")!.async("text"));
  assert.ok(content.presentation.slides[0].elements.some((element: any) => element.action?.library?.startsWith("H5P.Image")));
});
