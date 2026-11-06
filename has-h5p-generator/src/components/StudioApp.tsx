"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  LayoutDashboard,
  Sparkles,
  LogIn,
  LogOut,
  User,
  Type,
} from "lucide-react";
import ParticleBackground from "./ParticleBackground";
import LandingView from "./LandingView";
import DashboardView from "./DashboardView";
import WizardSteps from "./WizardSteps";
import AuthModal from "./AuthModal";
import H5pPreviewModal from "./H5pPreviewModal";
import HasLogo from "./HasLogo";
import { HasProfile, HasProjectRecord, supabasePublic } from "@/lib/supabase";
import {
  getSeedProjectRecords,
  INITIAL_RETO11_PROJECTS,
  RETO11_ACT1_SPEC,
} from "@/lib/reto11-seed";
import { HasProjectSpec, resolveFontCssStack } from "@/lib/h5p-engine";
import { H5P_FONT_OPTIONS } from "@/lib/h5p-catalog";
import { apiFetch } from "@/lib/api-client";
import { createDemoProfile, type DemoProfileName } from "@/lib/demo-mode";
import { formatStudioRoute, parseStudioRoute, type StudioRoute, type StudioStep, type StudioView } from "@/lib/studio-route";

const EMPTY_PROFILE: HasProfile = {
  email: "",
  full_name: "",
  faculty: "",
  program: "",
  role: "professor",
  daily_quota: 0,
  preferred_voice: "es-CO-SalomeNeural",
};

function getPublicSeedProjects(): HasProjectRecord[] {
  return getSeedProjectRecords().map((project) => ({
    ...project,
    user_email: "",
  }));
}

export default function StudioApp() {
  const [activeView, setActiveView] = useState<StudioView>("landing");
  const [wizardStep, setWizardStep] = useState<StudioStep>(1);
  const [routeProjectId, setRouteProjectId] = useState<string | undefined>();
  const routeRef = useRef<StudioRoute>({ view: "landing", step: 1 });
  const [profile, setProfile] = useState<HasProfile>(EMPTY_PROFILE);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const demoModeRef = useRef(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const hasStudioAccess = isAuthenticated || isDemoMode;

  // Projects list
  const [projects, setProjects] = useState<HasProjectRecord[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  // Active working spec in Wizard
  const [workingSpec, setWorkingSpec] = useState<HasProjectSpec>(RETO11_ACT1_SPEC);

  // Compilation state
  const [compiling, setCompiling] = useState(false);
  const [compilationResult, setCompilationResult] = useState<any>(null);
  const currentSpecSnapshot = JSON.stringify(workingSpec);
  const activeCompilationResult = compilationResult?.sourceSpecSnapshot === currentSpecSnapshot
    ? compilationResult
    : null;

  // Preview Modal
  const [previewProject, setPreviewProject] = useState<HasProjectRecord | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewTab, setPreviewTab] = useState<"player" | "python" | "moodle">(
    "player"
  );
  const [previewIsPublicDemo, setPreviewIsPublicDemo] = useState(false);

  const navigateToRoute = useCallback((route: StudioRoute, replace = false) => {
    const target = formatStudioRoute(route);
    if (`${window.location.pathname}${window.location.search}` !== target) {
      window.history[replace ? "replaceState" : "pushState"]({ hasH5pRoute: true }, "", target);
    }
    routeRef.current = route;
    setActiveView(route.view);
    setWizardStep(route.step);
    setRouteProjectId(route.projectId);
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  useEffect(() => {
    const syncRouteFromLocation = () => {
      const route = parseStudioRoute(window.location.pathname, window.location.search);
      const canonical = formatStudioRoute(route);
      if (`${window.location.pathname}${window.location.search}` !== canonical) {
        window.history.replaceState({ hasH5pRoute: true }, "", canonical);
      }
      routeRef.current = route;
      setActiveView(route.view);
      setWizardStep(route.step);
      setRouteProjectId(route.projectId);
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    };
    syncRouteFromLocation();
    window.addEventListener("popstate", syncRouteFromLocation);
    return () => window.removeEventListener("popstate", syncRouteFromLocation);
  }, []);

  const refreshAuthenticatedProjects = async (): Promise<HasProjectRecord[]> => {
    if (demoModeRef.current) return [];
    const response = await apiFetch("/api/projects");
    const data: {
      profile?: HasProfile;
      projects?: HasProjectRecord[];
      error?: string;
    } = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || "No se pudieron cargar los proyectos.");
    }

    if (!data.profile) {
      throw new Error("La respuesta no contiene un perfil autenticado.");
    }

    const nextProjects = Array.isArray(data.projects) && data.projects.length > 0 ? data.projects : getPublicSeedProjects();
    setProfile(data.profile);
    setProjects(nextProjects);
    return nextProjects;
  };

  const startDemoProfile = (name: DemoProfileName) => {
    demoModeRef.current = true;
    setIsDemoMode(true);
    setIsAuthenticated(true);
    setProfile(createDemoProfile(name));
    setProjects(getPublicSeedProjects());
    setLoadingProjects(false);
    setCompilationResult(null);
    navigateToRoute({ view: "dashboard", step: 1 });
    setIsAuthModalOpen(false);
  };

  // El cliente anónimo solo usa seeds locales; los proyectos privados requieren sesión.
  useEffect(() => {
    let cancelled = false;

    async function loadInitial() {
      setLoadingProjects(true);
      try {
        const { data: sessionData } = await supabasePublic.auth.getSession();
        if (cancelled || demoModeRef.current) return;
        if (sessionData.session?.user) {
          const loadedProjects = await refreshAuthenticatedProjects();
          if (!cancelled) {
            const requestedProjectId = routeRef.current.projectId;
            const requestedProject = requestedProjectId
              ? loadedProjects.find((project) => project.id === requestedProjectId)
              : undefined;
            if (requestedProject?.project_spec) setWorkingSpec(requestedProject.project_spec);
            setIsAuthenticated(true);
            if (routeRef.current.view === "landing") {
              navigateToRoute({ view: "dashboard", step: 1 }, true);
            } else if (requestedProjectId && !requestedProject) {
              navigateToRoute({ view: "dashboard", step: 1 }, true);
            }
          }
        } else if (!cancelled) {
          setProfile(EMPTY_PROFILE);
          setProjects(getPublicSeedProjects());
          setIsAuthenticated(false);
          if (routeRef.current.view !== "landing") {
            navigateToRoute({ view: "landing", step: 1 }, true);
          }
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Error cargando proyectos autenticados:", error);
          setProfile(EMPTY_PROFILE);
          setProjects(getPublicSeedProjects());
          setIsAuthenticated(false);
          if (routeRef.current.view !== "landing") {
            navigateToRoute({ view: "landing", step: 1 }, true);
          }
        }
      } finally {
        if (!cancelled) setLoadingProjects(false);
      }
    }

    loadInitial();
    return () => {
      cancelled = true;
    };
  }, [navigateToRoute]);

  useEffect(() => {
    if (loadingProjects) return;
    if (!hasStudioAccess && routeRef.current.view !== "landing") {
      navigateToRoute({ view: "landing", step: 1 }, true);
    } else if (hasStudioAccess && routeRef.current.view === "landing") {
      navigateToRoute({ view: "dashboard", step: 1 }, true);
    }
  }, [activeView, hasStudioAccess, loadingProjects, navigateToRoute]);

  useEffect(() => {
    if (!hasStudioAccess || loadingProjects || !routeProjectId) return;
    const requestedProject = projects.find((project) => project.id === routeProjectId);
    if (requestedProject?.project_spec && workingSpec.id !== routeProjectId) {
      const timer = window.setTimeout(() => {
        setWorkingSpec(requestedProject.project_spec);
        setCompilationResult(null);
      }, 0);
      return () => window.clearTimeout(timer);
    }
    if (!requestedProject && activeView === "wizard") {
      const timer = window.setTimeout(() => {
        navigateToRoute({ view: "dashboard", step: 1 }, true);
      }, 0);
      return () => window.clearTimeout(timer);
    }
  }, [activeView, hasStudioAccess, loadingProjects, navigateToRoute, projects, routeProjectId, workingSpec.id]);

  // Update dynamic font styling on body or wrapper
  const currentFontCss = resolveFontCssStack(workingSpec.fontFamily);

  // Open project in Wizard
  const handleOpenProjectInWizard = (projectId: string) => {
    const found = projects.find((p) => p.id === projectId);
    if (found && found.project_spec) {
      setWorkingSpec(found.project_spec);
    } else {
      const seed = INITIAL_RETO11_PROJECTS.find((p) => p.id === projectId);
      if (seed) setWorkingSpec(seed);
    }
    const isSavedProject = projects.some((project) => project.id === projectId);
    navigateToRoute({
      view: "wizard",
      step: 1,
      ...(isSavedProject ? { projectId } : {}),
    });
  };

  // Open project in Preview modal
  const handleOpenPreviewModal = (
    projectId: string,
    tab: "player" | "python" | "moodle" = "player",
    isPublicDemo = false
  ) => {
    const found = projects.find((p) => p.id === projectId);
    if (found) {
      setPreviewProject(found);
      setPreviewTab(tab);
      setPreviewIsPublicDemo(isPublicDemo);
      setPreviewModalOpen(true);
      return;
    } else {
      const seed = INITIAL_RETO11_PROJECTS.find((p) => p.id === projectId);
      if (seed) {
        setPreviewProject({
          id: seed.id,
          user_email: "",
          title: seed.title,
          course_name: seed.courseName,
          module_name: seed.moduleName,
          activity_number: seed.activityNumber,
          template_id: seed.templateId,
          project_spec: seed,
          slides_count: seed.slides.length,
          interactions_count: seed.slides.filter((s) => Boolean(s.interaction)).length,
          status: "ready",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        setPreviewTab(tab);
        setPreviewIsPublicDemo(isPublicDemo);
        setPreviewModalOpen(true);
      }
    }
  };

  // Compile package via /api/h5p/build
  const handleCompilePackage = async (
    overrideSpec?: HasProjectSpec
  ): Promise<any> => {
    setCompiling(true);
    const targetSpec = overrideSpec || workingSpec;
    try {
      const res = await apiFetch("/api/h5p/build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spec: targetSpec,
          synthesizeAudio: true,
        }),
      });
      const data: { success?: boolean; error?: string } & Record<string, any> =
        await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Error desconocido al compilar.");
      }
      if (data.success) {
        const normalizedSpec = data.project?.project_spec || targetSpec;
        setWorkingSpec(normalizedSpec);
        setCompilationResult({ ...data, sourceSpecSnapshot: JSON.stringify(normalizedSpec) });
        await refreshAuthenticatedProjects();
        if (data.project?.id && routeRef.current.view === "wizard") {
          navigateToRoute({
            view: "wizard",
            step: routeRef.current.step,
            projectId: data.project.id,
          }, true);
        }
        return data;
      } else {
        throw new Error(data.error || "Error desconocido al compilar.");
      }
    } catch (error: unknown) {
      alert(
        "Error en la solicitud de compilación: " +
          (error instanceof Error ? error.message : "Error desconocido")
      );
      return null;
    } finally {
      setCompiling(false);
    }
  };

  // Logout
  const handleLogout = async () => {
    if (!demoModeRef.current) await supabasePublic.auth.signOut();
    demoModeRef.current = false;
    setIsDemoMode(false);
    setIsAuthenticated(false);
    setProfile(EMPTY_PROFILE);
    setProjects(getPublicSeedProjects());
    setCompilationResult(null);
    navigateToRoute({ view: "landing", step: 1 });
  };

  return (
    <div
      className="min-h-screen relative flex flex-col bg-[#F8FAFC] text-slate-900 selection:bg-rose-100 selection:text-[#8A1428]"
      style={{ fontFamily: currentFontCss }}
    >
      {/* Subtle Interactive Particle Canvas Background */}
      <ParticleBackground />

      {/* Top Main Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/90 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand & Identity */}
          <div
            onClick={() => navigateToRoute({ view: hasStudioAccess ? "dashboard" : "landing", step: 1 })}
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer select-none group shrink-0"
          >
            <HasLogo size={38} className="group-hover:scale-105 transition-transform shrink-0" />
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-extrabold text-sm sm:text-base text-slate-900 tracking-tight leading-none">
                  HAS H5P <span className="text-[#8A1428]">Generator</span>
                </span>
                <span className="text-[9px] sm:text-[10px] font-bold text-white bg-[#8A1428] px-1.5 py-0.5 rounded uppercase tracking-wider">
                  EQ-35
                </span>
              </div>
              <div className="text-[9px] sm:text-[10px] text-slate-500 font-medium leading-none mt-1 truncate max-w-[150px] sm:max-w-none">
                Campus Digital UAO · Digitatón 2026 (Reto 11)
              </div>
            </div>
          </div>

          {/* View Navigation Switcher (Only visible when authenticated) */}
          {hasStudioAccess && (
            <nav className="hidden md:flex items-center gap-1 bg-slate-100/90 p-1 rounded-2xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => navigateToRoute({ view: "dashboard", step: 1 })}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                  activeView === "dashboard"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-[#8A1428]" />
                <span>Mis Recursos</span>
                <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded-full">
                  {projects.length}
                </span>
              </button>
              {isAuthenticated && (
                <button
                  type="button"
                  onClick={() => navigateToRoute({ view: "wizard", step: 1, ...(routeProjectId ? { projectId: routeProjectId } : {}) })}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                    activeView === "wizard"
                      ? "bg-[#8A1428] text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Estudio Wizard</span>
                </button>
              )}
            </nav>
          )}

          {/* Right Actions: Font Selector (Auth Only) + Auth Badge */}
          <div className="flex items-center gap-2">
            {/* Quick Font Selector (Only for authenticated users in Studio) */}
            {isAuthenticated && (
              <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200 text-xs">
                <Type className="w-3.5 h-3.5 text-slate-500" />
                <select
                  value={workingSpec.fontFamily || "plus_jakarta"}
                  onChange={(e) =>
                    setWorkingSpec({ ...workingSpec, fontFamily: e.target.value })
                  }
                  className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                  title="Cambiar tipografía global"
                >
                  {H5P_FONT_OPTIONS.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name.split("(")[0]}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Profile / Auth Button */}
            {hasStudioAccess ? (
              <div className="flex items-center gap-2">
                <div
                  onClick={() => navigateToRoute({ view: "dashboard", step: 1 })}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-semibold text-slate-800 flex items-center gap-1.5 cursor-pointer transition"
                >
                  <User className="w-3.5 h-3.5 text-[#8A1428]" />
                  <span className="max-w-[120px] truncate">{profile.full_name}</span>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-semibold text-slate-800 flex items-center gap-1.5 transition"
              >
                <LogIn className="w-3.5 h-3.5 text-[#8A1428]" />
                <span>Acceder</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Subnav (Only visible when authenticated) */}
      {hasStudioAccess && (
        <div className="md:hidden flex items-center justify-around bg-white border-b border-slate-200 p-2 text-xs font-semibold">
          <button
            type="button"
            onClick={() => navigateToRoute({ view: "dashboard", step: 1 })}
            className={`py-1 px-3 rounded-lg ${
              activeView === "dashboard" ? "bg-rose-50 text-[#8A1428]" : "text-slate-600"
            }`}
          >
            Mis Recursos ({projects.length})
          </button>
          {isAuthenticated && (
            <button
              type="button"
              onClick={() => navigateToRoute({ view: "wizard", step: 1, ...(routeProjectId ? { projectId: routeProjectId } : {}) })}
              className={`py-1 px-3 rounded-lg ${
                activeView === "wizard" ? "bg-[#8A1428] text-white" : "text-slate-600"
              }`}
            >
              Wizard
            </button>
          )}
        </div>
      )}

      {/* Main View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeView === "landing" && (
          <LandingView
            onStartWizard={() => {
              if (isDemoMode) {
                navigateToRoute({ view: "dashboard", step: 1 });
                return;
              }
              if (!isAuthenticated) {
                setIsAuthModalOpen(true);
              } else {
                navigateToRoute({ view: "wizard", step: 1, ...(routeProjectId ? { projectId: routeProjectId } : {}) });
              }
            }}
            onOpenProject={(id) => {
              if (hasStudioAccess) {
                handleOpenProjectInWizard(id);
              } else {
                setIsAuthModalOpen(true);
              }
            }}
            onPreviewDemo={(id) => handleOpenPreviewModal(id, "player", true)}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            userEmail={hasStudioAccess ? profile.email : undefined}
            isDemoMode={isDemoMode}
          />
        )}

        {activeView === "dashboard" && (
          <DashboardView
              projects={projects}
              profile={profile}
              isLoading={loadingProjects}
              readOnly={false}
            onOpenProject={(id) => handleOpenProjectInWizard(id)}
            onNewProject={() => {
              const newSpec = structuredClone(RETO11_ACT1_SPEC);
              newSpec.id = `actividad-nueva-${Date.now().toString().slice(-6)}`;
              newSpec.activityNumber = projects.length + 1;
              newSpec.defaultVoice = profile.preferred_voice || newSpec.defaultVoice;
              setWorkingSpec(newSpec);
              navigateToRoute({ view: "wizard", step: 1 });
            }}
            onPreviewProject={(id) => handleOpenPreviewModal(id, "player", false)}
            onViewPh5p={(p) => handleOpenPreviewModal(p.id, "python", false)}
            onViewMoodle={(p) => handleOpenPreviewModal(p.id, "moodle", false)}
          />
        )}

        {activeView === "wizard" && hasStudioAccess && (
          <WizardSteps
            spec={workingSpec}
            setSpec={setWorkingSpec}
            initialStep={wizardStep}
            onStepChange={(step) => navigateToRoute({
              view: "wizard",
              step,
              ...(routeProjectId ? { projectId: routeProjectId } : {}),
            })}
            onCompile={handleCompilePackage}
            compiling={compiling}
            compilationResult={activeCompilationResult}
          />
        )}
      </main>

      {/* Footer with Official Team Credits */}
      <footer className="border-t border-slate-200 bg-white/80 backdrop-blur-sm py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-2 text-center sm:text-left">
            <span className="font-extrabold text-slate-800">HAS H5P Generator</span>
            <span className="hidden sm:inline">·</span>
            <span className="font-bold text-[#8A1428] bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200/60">
              Equipo 35 (EQ-35)
            </span>
            <span className="hidden sm:inline">·</span>
            <span>Digitatón UAO 2026 (Reto 11)</span>
          </div>

          {/* Credits */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-medium text-slate-600">
            <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200/80">
              <strong className="text-slate-800">Hermaioni Delgado Paz</strong> · Analyst
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200/80">
              <strong className="text-slate-800">Alex Silva</strong> · Developer
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200/80">
              <strong className="text-slate-800">Simón Barrera Ruíz</strong> · Developer
            </span>
          </div>

          <div className="text-[11px] text-slate-400 text-center md:text-right">
            Facultad de Ingeniería y Ciencias Básicas · Universidad Autónoma de Occidente
          </div>
        </div>
      </footer>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={(newProf) => {
          demoModeRef.current = false;
          setIsDemoMode(false);
          setProfile(newProf);
          setIsAuthenticated(true);
          navigateToRoute({ view: "dashboard", step: 1 });
          setLoadingProjects(true);
          setProjects([]);
          void refreshAuthenticatedProjects().catch(() => {
            setProjects([]);
          }).finally(() => {
            setLoadingProjects(false);
          });
        }}
        onDemoAccess={startDemoProfile}
      />

      {/* Preview & Code Modal */}
      <H5pPreviewModal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        project={previewProject}
        initialTab={previewTab}
        isPublicDemo={previewIsPublicDemo}
        isReadOnly={false}
      />
    </div>
  );
}
