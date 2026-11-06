import test from "node:test";
import assert from "node:assert/strict";
import {
  estimateTextHeightPx,
  findFittingScale,
  fitTextElementsToBoxes,
  moveSpanFontSizesToBlocks,
  MIN_FIT_SCALE,
} from "./text-fit";
import { fitBoxToAspect } from "./h5p-engine";

const para = (text: string, em = "0.8em") =>
  `<p style="margin:0 0 0.45em 0;line-height:1.35;"><span style="font-size:${em};color:#000;">${text}</span></p>`;

test("text-fit: el tamaño del span pasa al párrafo y el span queda en proporción", () => {
  const out = moveSpanFontSizesToBlocks(para("Hola"));
  assert.match(out, /<p style="font-size:0\.8em;margin/);
  assert.match(out, /<span style="font-size:1em;/);
});

test("text-fit: los títulos (h2) no se normalizan", () => {
  const html = `<h2 style="margin:0;"><span style="font-size:1.25em;">Título</span></h2>`;
  assert.equal(moveSpanFontSizesToBlocks(html), html);
});

test("text-fit: un texto corto en una caja grande no se reduce", () => {
  const html = moveSpanFontSizesToBlocks(para("Texto breve."));
  assert.equal(findFittingScale(html, 80, 40), 1);
});

test("text-fit: un texto largo en una caja pequeña se reduce sin bajar del mínimo", () => {
  const long = "Revisa el material de referencia seleccionado por el docente. ".repeat(12);
  const html = moveSpanFontSizesToBlocks(para(long));
  const scale = findFittingScale(html, 30, 20);
  assert.ok(scale < 1);
  assert.ok(scale >= MIN_FIT_SCALE);
});

test("text-fit: la reducción hace caber el texto cuando es posible", () => {
  const text = "Lleva tus respuestas de verificación conceptual para debatir dos casos críticos. ".repeat(3);
  const html = moveSpanFontSizesToBlocks(para(text));
  const before = estimateTextHeightPx(html, 60, 1);
  const scale = findFittingScale(html, 60, (before / 312) * 100 * 0.8);
  assert.ok(estimateTextHeightPx(html, 60, scale) < before);
});

test("text-fit: fitTextElementsToBoxes ignora popups y otras librerías", () => {
  const long = "Texto ".repeat(300);
  const popup = { width: 10, height: 5, displayAsButton: true, action: { library: "H5P.AdvancedText 1.1", params: { text: para(long) } } };
  const image = { width: 10, height: 5, action: { library: "H5P.Image 1.1", params: { text: para(long) } } };
  const body = { width: 20, height: 10, action: { library: "H5P.AdvancedText 1.1", params: { text: para(long) } } };
  const popupBefore = popup.action.params.text;
  fitTextElementsToBoxes([popup, image, body]);
  assert.equal(popup.action.params.text, popupBefore);
  assert.equal(image.action.params.text, para(long));
  assert.notEqual(body.action.params.text, para(long));
});

test("fitBoxToAspect: la imagen conserva su proporción y queda centrada", () => {
  const box = { x: 40, y: 10, width: 52.8, height: 76 };
  const fitted = fitBoxToAspect(box, 860, 560);
  const aspect = (fitted.width * 640) / (fitted.height * 312);
  assert.ok(Math.abs(aspect - 860 / 560) < 0.01);
  assert.ok(fitted.width <= box.width + 1e-9 && fitted.height <= box.height + 1e-9);
  assert.ok(Math.abs(fitted.x + fitted.width / 2 - (box.x + box.width / 2)) < 1e-9);
  assert.ok(Math.abs(fitted.y + fitted.height / 2 - (box.y + box.height / 2)) < 1e-9);
});
