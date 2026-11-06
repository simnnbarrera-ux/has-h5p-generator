/** Only the package manifest and authored content are private per-project preview files. */
export function isH5pPreviewAssetPath(relativePath: string): boolean {
  if (relativePath.endsWith("/")) return false;
  return relativePath === "h5p.json" || relativePath.startsWith("content/");
}
