import assert from "node:assert/strict";
import { test } from "node:test";
import JSZip from "jszip";
import { validateH5pBuffer } from "./h5p-validator";

async function packageBuffer(content: unknown, files: Record<string, string> = {}) {
  const zip = new JSZip();
  zip.file("h5p.json", JSON.stringify({ mainLibrary: "H5P.CoursePresentation" }));
  zip.file("content/content.json", JSON.stringify(content));
  for (const [name, value] of Object.entries(files)) zip.file(`content/${name}`, value);
  return zip.generateAsync({ type: "nodebuffer" });
}

test("validateH5pBuffer accepts an H5P archive with required manifests", async () => {
  const buffer = await packageBuffer({ title: "Ejemplo", slides: [] });
  await assert.doesNotReject(validateH5pBuffer(buffer));
});

test("validateH5pBuffer rejects a missing referenced asset", async () => {
  const buffer = await packageBuffer({ image: { path: "images/missing.png" } });
  await assert.rejects(validateH5pBuffer(buffer), /Falta un archivo referenciado/);
});

test("validateH5pBuffer rejects SVG assets inside content", async () => {
  const buffer = await packageBuffer(
    { image: { path: "images/diagram.svg" } },
    { "images/diagram.svg": "<svg></svg>" }
  );
  await assert.rejects(validateH5pBuffer(buffer), /SVG/);
});

test("validateH5pBuffer rejects non-ZIP payloads", async () => {
  await assert.rejects(validateH5pBuffer(Buffer.from("not a zip")), /ZIP H5P válido/);
});
