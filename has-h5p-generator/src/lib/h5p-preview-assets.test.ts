import assert from "node:assert/strict";
import { test } from "node:test";
import JSZip from "jszip";
import { isH5pPreviewAssetPath } from "./h5p-preview-assets";

test("preview asset selection skips bundled H5P libraries but retains manifest and authored content", async () => {
  const zip = new JSZip();
  zip.file("h5p.json", "{}");
  zip.file("content/content.json", "{}");
  zip.file("content/images/slide-1.png", Buffer.from([1, 2, 3]));
  zip.file("H5P.CoursePresentation-1.27/library.json", "{}");
  zip.file("Shepherd-1.0/styles/tether.min.css", "/* library css */");
  zip.file("H5P.Audio-1.5/scripts/h5p-audio.js", "// library js");
  const buffer = await zip.generateAsync({ type: "nodebuffer" });
  const reopened = await JSZip.loadAsync(buffer);
  const selectedPaths = Object.keys(reopened.files).filter(isH5pPreviewAssetPath).sort();

  assert.deepEqual(selectedPaths, [
    "content/content.json",
    "content/images/slide-1.png",
    "h5p.json",
  ]);
  assert.equal(isH5pPreviewAssetPath("../content/content.json"), false);
});
