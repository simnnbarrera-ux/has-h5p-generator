import assert from "node:assert/strict";
import { test } from "node:test";
import { buildH5pViewerUrl } from "./h5p-preview-url";

test("H5P preview iframe points to the HTML viewer, not the JSON manifest endpoint", () => {
  const url = buildH5pViewerUrl("project id/á", 7);
  assert.equal(url, "/preview-viewer/index.html?id=project+id%2F%C3%A1&v=7");
  assert.equal(url.startsWith("/api/h5p-preview/"), false);
});
