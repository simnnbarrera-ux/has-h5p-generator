"use client";

import React, { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Sparkles,
  Layers,
  Puzzle,
  Volume2,
  Play,
  Download,
  ShieldCheck,
  LogIn,
  LogOut,
  User,
  Type,
  Plus,
  ArrowRight,
  GraduationCap,
  Loader2,
  ExternalLink,
} from "lucide-react";
import ParticleBackground from "./ParticleBackground";
import LandingView from "./LandingView";
import DashboardView from "./DashboardView";
import WizardSteps from "./WizardSteps";
import AuthModal from "./AuthModal";
import H5pPreviewModal from "./H5pPreviewModal";
import HasLogo from "./HasLogo";
import { HasProfile, HasProjectRecord, supabasePublic } from "@/lib/supabase";
import { INITIAL_RETO11_PROJECTS, RETO11_ACT1_SPEC } from "@/lib/reto11-seed";
import { HasProjectSpec, resolveFontCssStack } from "@/lib/h5p-engine";
import { H5P_FONT_OPTIONS } from "@/lib/h5p-catalog";

export default function StudioApp() {
  const [activeView, setActiveView] = useState<"landing" | "dashboard" | "wizard">(
    "landing"
  );
  const [profile, setProfile] = useState<HasProfile>({
    email: "oswaldo.rodriguez@uao.edu.co",
    full_name: "Prof. Oswaldo Rodríguez Díaz",
    faculty: "Facultad de Ingeniería y Ciencias Básicas",
    program: "Matemáticas Discretas (Reto 11)",
    role: "professor",
    daily_quota: 50,
    preferred_voice: "es-CO-GonzaloNeural",
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Projects list
  const [projects, setProjects] = useState<HasProjectRecord[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  // Active working spec in Wizard
  const [workingSpec, setWorkingSpec] = useState<HasProjectSpec>(RETO11_ACT1_SPEC);

  // Compilation state
  const [compiling, setCompiling] = useState(false);
  const [compilationResult, setCompilationResult] = useState<any>(null);

  // Preview Modal
  const [previewProject, setPreviewProject] = useState<HasProjectRecord | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewTab, setPreviewTab] = useState<"player" | "python" | "moodle">(
    "player"
  );

  // Load profile and projects on mount
  useEffect(() => {
    async function loadInitial() {
      try {
        setLoadingProjects(true);
        // Check active Supabase session
        const { data: sessionData } = await supabasePublic.auth.getSession();
        if (sessionData?.session?.user) {
          setIsAuthenticated(true);
        }

        const email =
          sessionData?.session?.user?.email || "oswaldo.rodriguez@uao.edu.co";
        const res = await fetch(`/api/projects?email=${encodeURIComponent(email)}`);
        const json = await res.json();
        if (json.profile) {
          setProfile(json.profile);
        }
        if (json.projects && json.projects.length > 0) {
          setProjects(json.projects);
        }
      } catch (err) {
        console.error("Error cargando proyectos iniciales:", err);
      } finally {
        setLoadingProjects(false);
      }
    }
    loadInitial();
  }, []);

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
    setActiveView("wizard");
  };

  // Open project in Preview modal
  const handleOpenPreviewModal = (
    projectId: string,
    tab: "player" | "python" | "moodle" = "player"
  ) => {
    const found = projects.find((p) => p.id === projectId);
    if (found) {
      setPreviewProject(found);
      setPreviewTab(tab);
      setPreviewModalOpen(true);
    } else {
      const seed = INITIAL_RETO11_PROJECTS.find((p) => p.id === projectId);
      if (seed) {
        setPreviewProject({
          id: seed.id,
          user_email: profile.email,
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
      const res = await fetch("/api/h5p/build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spec: targetSpec,
          userEmail: profile.email,
          synthesizeAudio: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCompilationResult(data);
        // Refresh projects list
        const pRes = await fetch(
          `/api/projects?email=${encodeURIComponent(profile.email)}`
        );
        const pJson = await pRes.json();
        if (pJson.projects) setProjects(pJson.projects);
        return data;
      } else {
        alert("Error compilando: " + (data.error || "Error desconocido"));
        return null;
      }
    } catch (err: any) {
      alert("Error en la solicitud de compilación: " + err.message);
      return null;
    } finally {
      setCompiling(false);
    }
  };

  // Logout
  const handleLogout = async () => {
    await supabasePublic.auth.signOut();
    setIsAuthenticated(false);
    setProfile({
      email: "oswaldo.rodriguez@uao.edu.co",
      full_name: "Prof. Oswaldo Rodríguez Díaz",
      faculty: "Facultad de Ingeniería y Ciencias Básicas",
      program: "Matemáticas Discretas (Reto 11)",
      role: "professor",
      daily_quota: 50,
      preferred_voice: "es-CO-GonzaloNeural",
    });
    setActiveView("landing");
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
            onClick={() => setActiveView("landing")}
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer select-none group shrink-0"
          >
            <HasLogo size={38} className="group-hover:scale-105 transition-transform shrink-0" />
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-extrabold text-sm sm:text-base text-slate-900 tracking-tight leading-none">
                  HAS H5P <span className="text-[#8A1428]">Generator</span>
                </span>
                <span className="text-[9px] sm:text-[10px] font-bold text-white bg-[#8A1428] px-1.5 py-0.5 rounded uppercase tracking-wider">
                  EQ-36
                </span>
              </div>
              <div className="text-[9px] sm:text-[10px] text-slate-500 font-medium leading-none mt-1 truncate max-w-[150px] sm:max-w-none">
                Campus Digital UAO · Digitatón 2026 (Reto 11)
              </div>
            </div>
          </div>

          {/* View Navigation Switcher (Only visible when authenticated) */}
          {isAuthenticated && (
            <nav className="hidden md:flex items-center gap-1 bg-slate-100/90 p-1 rounded-2xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => setActiveView("landing")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                  activeView === "landing"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Portada
              </button>
              <button
                type="button"
                onClick={() => setActiveView("dashboard")}
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
              <button
                type="button"
                onClick={() => setActiveView("wizard")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                  activeView === "wizard"
                    ? "bg-[#8A1428] text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Estudio Wizard</span>
              </button>
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
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <div
                  onClick={() => setActiveView("dashboard")}
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
      {isAuthenticated && (
        <div className="md:hidden flex items-center justify-around bg-white border-b border-slate-200 p-2 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveView("landing")}
            className={`py-1 px-3 rounded-lg ${
              activeView === "landing" ? "bg-rose-50 text-[#8A1428]" : "text-slate-600"
            }`}
          >
            Portada
          </button>
          <button
            type="button"
            onClick={() => setActiveView("dashboard")}
            className={`py-1 px-3 rounded-lg ${
              activeView === "dashboard" ? "bg-rose-50 text-[#8A1428]" : "text-slate-600"
            }`}
          >
            Mis Recursos ({projects.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveView("wizard")}
            className={`py-1 px-3 rounded-lg ${
              activeView === "wizard" ? "bg-[#8A1428] text-white" : "text-slate-600"
            }`}
          >
            Wizard
          </button>
        </div>
      )}

      {/* Main View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeView === "landing" && (
          <LandingView
            onStartWizard={() => {
              if (!isAuthenticated) {
                setIsAuthModalOpen(true);
              } else {
                setActiveView("wizard");
              }
            }}
            onOpenProject={(id) => {
              if (!isAuthenticated) {
                setIsAuthModalOpen(true);
              } else {
                handleOpenProjectInWizard(id);
              }
            }}
            onPreviewDemo={(id) => handleOpenPreviewModal(id, "player")}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            userEmail={isAuthenticated ? profile.email : undefined}
            sampleProjects={projects}
          />
        )}

        {activeView === "dashboard" && (
          <DashboardView
            projects={projects}
            profile={profile}
            onOpenProject={(id) => handleOpenProjectInWizard(id)}
            onNewProject={() => {
              setWorkingSpec({
                id: `actividad-nueva-${Date.now().toString().slice(-4)}`,
                title: "Nueva Actividad Interactiva",
                courseName: profile.program || "Campus Virtual UAO",
                moduleName: "Módulo 1",
                activityNumber: projects.length + 1,
                templateId: "plantilla-1",
                defaultVoice: profile.preferred_voice || "es-CO-SalomeNeural",
                includeNavigationGuide: false,
                slides: [
                  {
                    id: "slide-1",
                    templateSlide: 2,
                    menuTitle: "Portada",
                    titleBlack: "Nueva Actividad",
                    titleAccent: "Interactiva",
                    subtitle: profile.faculty,
                    paragraphs: ["Bienvenido a la lección."],
                  },
                ],
                auditReport: ["Creado con HAS H5P Wizard."],
                textChanges: [],
              });
              setActiveView("wizard");
            }}
            onPreviewProject={(id) => handleOpenPreviewModal(id, "player")}
            onViewPh5p={(p) => handleOpenPreviewModal(p.id, "python")}
            onViewMoodle={(p) => handleOpenPreviewModal(p.id, "moodle")}
          />
        )}

        {activeView === "wizard" && (
          <WizardSteps
            spec={workingSpec}
            setSpec={setWorkingSpec}
            onCompile={handleCompilePackage}
            compiling={compiling}
            compilationResult={compilationResult}
            userEmail={profile.email}
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
              Equipo 36 (EQ-36)
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
          setProfile(newProf);
          setIsAuthenticated(true);
        }}
      />

      {/* Preview & Code Modal */}
      <H5pPreviewModal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        project={previewProject}
        initialTab={previewTab}
      />
    </div>
  );
}
