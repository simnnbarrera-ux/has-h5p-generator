export function buildH5pViewerUrl(projectId: string, version?: string | number): string {
  const params = new URLSearchParams({ id: projectId });
  if (version !== undefined) params.set("v", String(version));
  return `/preview-viewer/index.html?${params.toString()}`;
}
