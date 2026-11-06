import assert from "node:assert/strict";
import { test } from "node:test";
import { safeProjectId, validateProjectSpec } from "./project-validation";

const minimalSpec: any = {
  id: "curso-1",
  title: "Curso de muestra",
  courseName: "Matemáticas Discretas",
  moduleName: "Módulo 1",
  templateId: "plantilla-1",
  slides: [{
    id: "portada-1",
    templateSlide: 2,
    menuTitle: "Portada",
    titleBlack: "Introducción",
    paragraphs: ["Contenido de prueba"],
  }],
};

test("safeProjectId removes path characters and reserves public demo IDs", () => {
  assert.equal(safeProjectId("../../mi proyecto"), "mi-proyecto");
  assert.notEqual(safeProjectId("matematicas-discretas-act1"), "matematicas-discretas-act1");
  assert.match(safeProjectId("../../../../"), /^recurso-[a-f0-9-]+$/);
});

test("validateProjectSpec keeps a valid spec and applies bounded defaults", () => {
  const spec = validateProjectSpec(minimalSpec);
  assert.equal(spec.id, "curso-1");
  assert.equal(spec.slides.length, 1);
  assert.equal(spec.defaultVoice, "es-CO-SalomeNeural");
  assert.equal(spec.slides[0].menuTitle, "Portada");
});

test("validateProjectSpec preserves the per-slide visual-space toggle", () => {
  const withReservedSpace = structuredClone(minimalSpec);
  withReservedSpace.slides[0].reserveVisualSpace = true;
  assert.equal(validateProjectSpec(withReservedSpace).slides[0].reserveVisualSpace, true);

  const withoutReservedSpace = structuredClone(minimalSpec);
  withoutReservedSpace.slides[0].reserveVisualSpace = false;
  assert.equal(validateProjectSpec(withoutReservedSpace).slides[0].reserveVisualSpace, false);

  const invalid = structuredClone(minimalSpec);
  invalid.slides[0].reserveVisualSpace = "yes";
  assert.throws(() => validateProjectSpec(invalid), /reserveVisualSpace no es válido/);
});

test("validateProjectSpec rejects active or credential-bearing links", () => {
  const unsafe = structuredClone(minimalSpec);
  unsafe.slides[0] = {
    ...unsafe.slides[0],
    links: [{ label: "ataque", url: "javascript:alert(1)" }],
  };
  assert.throws(() => validateProjectSpec(unsafe), /URL inválida|Solo se permiten/);

  const withCredentials = structuredClone(minimalSpec);
  withCredentials.slides[0] = {
    ...withCredentials.slides[0],
    links: [{ label: "enlace", url: "https://user:pass@example.org/" }],
  };
  assert.throws(() => validateProjectSpec(withCredentials), /Solo se permiten/);
});

test("validateProjectSpec rejects invalid slide counts and template numbers", () => {
  assert.throws(() => validateProjectSpec({ ...minimalSpec, slides: [] }), /entre 1 y/);
  const invalidSlide = structuredClone(minimalSpec);
  invalidSlide.slides[0].templateSlide = 0;
  assert.throws(() => validateProjectSpec(invalidSlide), /plantilla inválida/);
});

test("validateProjectSpec rejects active markup inside H5P interactions", () => {
  const unsafe = structuredClone(minimalSpec);
  unsafe.slides[0].interaction = {
    type: "multi_choice",
    multiChoice: {
      question: "¿Cuál opción es válida?",
      options: [
        { text: "<img src=x onerror=alert(1)>", correct: false },
        { text: "Texto seguro", correct: true },
      ],
    },
  };
  assert.throws(() => validateProjectSpec(unsafe), /marcado activo no permitido/);
});

test("validateProjectSpec drops browser-supplied audio paths and unknown fields", () => {
  const input = structuredClone(minimalSpec);
  input.browserOnlySecret = "not retained";
  input.slides[0].audioNarration = {
    text: "Narración",
    voice: "es-CO-SalomeNeural",
    audioFilePath: "../../private.mp3",
  };
  const result = validateProjectSpec(input);
  assert.equal("browserOnlySecret" in result, false);
  assert.equal(result.slides[0].audioNarration?.audioFilePath, undefined);
});
