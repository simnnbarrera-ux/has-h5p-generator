import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { buildH5pViewerUrl } from "./h5p-preview-url";

test("H5P preview iframe points to the HTML viewer, not the JSON manifest endpoint", () => {
  const url = buildH5pViewerUrl("project id/á", 7);
  assert.equal(url, "/preview-viewer/index.html?id=project+id%2F%C3%A1&v=7");
  assert.equal(url.startsWith("/api/h5p-preview/"), false);
});

test("H5P viewer sends preview cookies and never falls back to public static paths", () => {
  const viewerPath = fileURLToPath(new URL("../../public/preview-viewer/index.html", import.meta.url));
  const viewer = readFileSync(viewerPath, "utf8");
  assert.match(viewer, /__preview_check=1/);
  assert.match(viewer, /credentials: 'include'/);
  assert.match(viewer, /has-h5p-preview:reauthorize/);
  assert.equal(viewer.includes("initPlayer('/preview-h5p/"), false);
});
