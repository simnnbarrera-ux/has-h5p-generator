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
