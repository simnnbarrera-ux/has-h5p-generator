import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

type H5pLibraryManifest = {
  preloadedJs?: Array<{ path?: string }>;
  preloadedCss?: Array<{ path?: string }>;
};

test("every H5P library preloaded JavaScript and CSS asset exists", () => {
  const libraryRoot = join(process.cwd(), "public", "h5p-libs");
  assert.ok(existsSync(libraryRoot), "public/h5p-libs must be present");

  const missing: string[] = [];
  for (const entry of readdirSync(libraryRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;

    const libraryDirectory = join(libraryRoot, entry.name);
    const manifestPath = join(libraryDirectory, "library.json");
    if (!existsSync(manifestPath)) continue;

    const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as H5pLibraryManifest;
    for (const field of ["preloadedJs", "preloadedCss"] as const) {
      for (const asset of manifest[field] ?? []) {
        const relativePath = asset.path ?? "";
        if (!relativePath || relativePath.startsWith("/") || relativePath.split(/[\\/]/).includes("..")) {
          missing.push(`${entry.name}/${relativePath || "<empty path>"} (invalid path)`);
          continue;
        }
        const assetPath = join(libraryDirectory, relativePath);
        if (!existsSync(assetPath)) missing.push(`${entry.name}/${relativePath}`);
      }
    }
  }

  assert.deepEqual(missing, [], `Missing H5P preloaded assets:\n${missing.join("\n")}`);
});
