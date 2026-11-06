export type StudioView = "landing" | "dashboard" | "wizard";
export type StudioStep = 1 | 2 | 3 | 4 | 5;

export interface StudioRoute {
  view: StudioView;
  step: StudioStep;
  projectId?: string;
}

const SAFE_PROJECT_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/;

function validProjectId(value: string | null): string | undefined {
  return value && SAFE_PROJECT_ID.test(value) ? value : undefined;
}

export function parseStudioRoute(pathname: string, search = ""): StudioRoute {
  const normalizedPath = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const projectId = validProjectId(params.get("project"));

  if (normalizedPath === "/" || normalizedPath === "/landing") {
    return { view: "landing", step: 1 };
  }
  if (
    normalizedPath === "/dashboard" ||
    normalizedPath === "/dashboard/mis-recursos" ||
    normalizedPath === "/dashboard/my-resources" ||
    normalizedPath === "/dashboard/resources"
  ) {
    return { view: "dashboard", step: 1 };
  }
  if (normalizedPath === "/dashboard/wizard") {
    return { view: "wizard", step: 1, ...(projectId ? { projectId } : {}) };
  }

  const stepMatch = normalizedPath.match(/^\/dashboard\/wizard\/step-([1-5])$/);
  if (stepMatch) {
    return {
      view: "wizard",
      step: Number(stepMatch[1]) as StudioStep,
      ...(projectId ? { projectId } : {}),
    };
  }

  return { view: "landing", step: 1 };
}

export function formatStudioRoute(route: StudioRoute): string {
  let pathname: string;
  if (route.view === "landing") pathname = "/landing";
  else if (route.view === "dashboard") pathname = "/dashboard/mis-recursos";
  else pathname = `/dashboard/wizard/step-${route.step}`;

  if (route.view === "wizard" && route.projectId && SAFE_PROJECT_ID.test(route.projectId)) {
    const params = new URLSearchParams({ project: route.projectId });
    return `${pathname}?${params.toString()}`;
  }
  return pathname;
}
