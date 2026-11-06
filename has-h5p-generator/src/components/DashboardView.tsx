"use client";

import React, { useState } from "react";
import {
  Plus,
  Play,
  Edit3,
  Download,
  FileCode,
  BookOpen,
  Search,
  Layers,
  Puzzle,
  Volume2,
  Calendar,
  GraduationCap,
  Loader2,
} from "lucide-react";
import TiltCard from "./TiltCard";
import { HasProjectRecord, HasProfile } from "@/lib/supabase";
import { getPresentationTemplate } from "@/lib/h5p-catalog";
import { apiFetch } from "@/lib/api-client";

interface DashboardViewProps {
  projects: HasProjectRecord[];
  profile: HasProfile;
  isLoading: boolean;
  readOnly?: boolean;
  onOpenProject: (projectId: string) => void;
  onNewProject: () => void;
  onPreviewProject: (projectId: string) => void;
  onViewPh5p: (project: HasProjectRecord) => void;
  onViewMoodle: (project: HasProjectRecord) => void;
}

export default function DashboardView({
  projects,
  profile,
  isLoading,
  readOnly = false,
  onOpenProject,
  onNewProject,
  onPreviewProject,
  onViewPh5p,
  onViewMoodle,
}: DashboardViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "reto11" | "custom">("all");
  const [downloadingProjectId, setDownloadingProjectId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const handleDownloadH5p = async (projectId: string) => {
    setDownloadingProjectId(projectId);
    setDownloadError(null);

    try {
      const response = await apiFetch(
        `/api/h5p/download?id=${encodeURIComponent(projectId)}`,
        { cache: "no-store" }
      );
      if (!response.ok) {
        throw new Error("El servidor no autorizó la descarga del paquete H5P.");
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `${projectId}.h5p`;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    } catch (error: unknown) {
      setDownloadError(
        error instanceof Error
          ? error.message
          : "No se pudo descargar el paquete H5P."
      );
    } finally {
      setDownloadingProjectId(null);
    }
  };

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.course_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.module_name.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (filterType === "reto11") {
      return p.id.startsWith("matematicas-discretas");
    }
    if (filterType === "custom") {
      return !p.id.startsWith("matematicas-discretas");
    }
    return true;
  });

  const totalSlides = projects.reduce((acc, p) => acc + (p.slides_count || 0), 0);
  const totalInteractions = projects.reduce(
    (acc, p) => acc + (p.interactions_count || 0),
    0
  );

  return (
    <div className="space-y-8 pb-12">
      {readOnly && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900" role="status">
          <strong>Demo ficticia · solo lectura.</strong> Se muestran recursos públicos de ejemplo. No se inicia sesión ni se guardan datos; la edición, descarga, IA, voz y compilación están desactivadas.
        </div>
      )}

      {/* 1. Header Profile & Metrics */}
      <section className="rounded-3xl border border-slate-200/90 bg-white p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1.5 text-left">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-100 text-xs font-semibold text-slate-700">
              <GraduationCap className="w-4 h-4 text-[#8A1428]" />
              <span>{profile.faculty || "Facultad de Ingeniería y Ciencias Básicas"}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">
              {profile.full_name || "Profesor UAO"}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              {readOnly ? "Perfil ficticio de demostración" : profile.email} · Rol:{" "}
              <span className="font-semibold text-slate-700 capitalize">
                {readOnly ? "Solo lectura" : profile.role === "admin" ? "Equipo 35 / Administrador" : "Profesor autor"}
              </span>
            </p>
          </div>

          {!readOnly && (
            <button
              type="button"
              onClick={onNewProject}
              className="px-5 py-3 rounded-xl bg-[#8A1428] hover:bg-[#6F1020] text-white font-semibold text-xs md:text-sm shadow-md transition flex items-center gap-2 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Crear Nuevo Recurso H5P (Wizard)</span>
            </button>
          )}
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
            <div className="text-xs font-medium text-slate-500">Recursos Creados</div>
            <div className="text-xl md:text-2xl font-bold text-slate-900 mt-1">
              {projects.length}
            </div>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
            <div className="text-xs font-medium text-slate-500">Diapositivas Totales</div>
            <div className="text-xl md:text-2xl font-bold text-slate-900 mt-1">
              {totalSlides}
            </div>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
            <div className="text-xs font-medium text-slate-500">Interactividades H5P</div>
            <div className="text-xl md:text-2xl font-bold text-[#0099E6] mt-1">
              {totalInteractions}
            </div>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
            <div className="text-xs font-medium text-slate-500">{readOnly ? "Acceso demo" : "Cuota diaria"}</div>
            <div className="text-xl md:text-2xl font-bold text-emerald-700 mt-1">
              {readOnly ? "Solo lectura" : <>{profile.daily_quota || 50}{" "}<span className="text-xs text-slate-400 font-normal">gen/día</span></>}
            </div>
          </div>
        </div>

        {/* Team Credits Strip */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-4 pt-4 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2 text-slate-500 font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#8A1428]" />
            <span>Equipo de desarrollo 35 (EQ-35):</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-700 text-xs font-medium">
              <strong className="text-slate-900 font-bold">Hermaioni Delgado Paz</strong>
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Analyst</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-700 text-xs font-medium">
              <strong className="text-slate-900 font-bold">Alex Silva</strong>
              <span className="text-[10px] text-[#0099E6] font-semibold uppercase tracking-wider">Developer</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-700 text-xs font-medium">
              <strong className="text-slate-900 font-bold">Simón Barrera Ruíz</strong>
              <span className="text-[10px] text-[#8A1428] font-semibold uppercase tracking-wider">Developer</span>
            </span>
          </div>
        </div>
      </section>

      {/* 2. Search & Filters Bar */}
      <section className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por curso, título o módulo..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#8A1428]/30 focus:border-[#8A1428]"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-500 font-medium">Filtrar:</span>
          <button
            type="button"
            onClick={() => setFilterType("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filterType === "all"
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            Todos ({projects.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType("reto11")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filterType === "reto11"
                ? "bg-[#8A1428] text-white"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            Reto 11 UAO
          </button>
          <button
            type="button"
            onClick={() => setFilterType("custom")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filterType === "custom"
                ? "bg-[#0099E6] text-white"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            Mis Creaciones
          </button>
        </div>
      </section>

      {downloadError && (
        <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
          {downloadError}
        </p>
      )}

      {/* 3. Projects Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => {
          const isReto11 = project.id.startsWith("matematicas-discretas");

          return (
            <TiltCard key={project.id} className="flex flex-col justify-between">
              <div className="space-y-3.5">
                {/* Header Badge */}
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      isReto11
                        ? "bg-rose-100 text-[#8A1428]"
                        : "bg-sky-100 text-[#0099E6]"
                    }`}
                  >
                    Actividad {project.activity_number || 1}
                  </span>
                  <span className="text-[10px] font-medium text-slate-500">
                    {getPresentationTemplate(project.template_id).shortName}
                  </span>
                </div>

                {/* Title & Course */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 line-clamp-2">
                    {project.title}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-1 line-clamp-1">
                    {project.course_name} · {project.module_name}
                  </p>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-3 gap-2 py-2 px-3 bg-slate-50 rounded-xl border border-slate-100 text-center text-xs">
                  <div>
                    <div className="text-slate-400 text-[10px] font-medium flex items-center justify-center gap-1">
                      <Layers className="w-3 h-3" />
                      <span>Slides</span>
                    </div>
                    <div className="font-bold text-slate-800 mt-0.5">
                      {project.slides_count}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-[10px] font-medium flex items-center justify-center gap-1">
                      <Puzzle className="w-3 h-3" />
                      <span>H5P</span>
                    </div>
                    <div className="font-bold text-[#0099E6] mt-0.5">
                      {project.interactions_count}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-[10px] font-medium flex items-center justify-center gap-1">
                      <Volume2 className="w-3 h-3" />
                      <span>Voz</span>
                    </div>
                    <div className="font-bold text-emerald-700 mt-0.5 truncate px-1">
                      {project.project_spec?.defaultVoice?.replace("Neural", "")?.split("-")[2] || "CO"}
                    </div>
                  </div>
                </div>

                {/* Date */}
                <div className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    Actualizado:{" "}
                    {new Date(project.updated_at).toLocaleDateString("es-CO", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="mt-5 pt-3.5 border-t border-slate-100 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenProject(project.id)}
                    disabled={readOnly}
                    className="w-full py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition flex items-center justify-center gap-1.5 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{readOnly ? "Edición desactivada" : "Editar en Wizard"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onPreviewProject(project.id)}
                    className="w-full py-2 px-3 rounded-lg bg-[#8A1428] hover:bg-[#6F1020] text-white font-semibold text-xs shadow-sm transition flex items-center justify-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>Vista Previa</span>
                  </button>
                </div>

                {/* Secondary Exports */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleDownloadH5p(project.id)}
                    disabled={readOnly || downloadingProjectId === project.id}
                    className="hover:text-[#8A1428] font-medium flex items-center gap-1 disabled:opacity-50"
                  >
                    <Download className="w-3 h-3" />
                    <span>
                      {readOnly
                        ? "Descarga desactivada"
                        : downloadingProjectId === project.id
                        ? "Descargando..."
                        : "Descargar .h5p"}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onViewPh5p(project)}
                    className="hover:text-[#0099E6] font-medium flex items-center gap-1"
                  >
                    <FileCode className="w-3 h-3" />
                    <span>ph5p.py</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onViewMoodle(project)}
                    className="hover:text-purple-700 font-medium flex items-center gap-1"
                  >
                    <BookOpen className="w-3 h-3" />
                    <span>Libro Moodle</span>
                  </button>
                </div>
              </div>
            </TiltCard>
          );
        })}
      </section>

      {isLoading ? (
        <div role="status" className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          Cargando tus proyectos…
        </div>
      ) : filteredProjects.length === 0 && (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">
            No se encontraron recursos educativos con ese criterio
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Prueba ajustando los términos de búsqueda o inicia el Wizard para crear
            una nueva actividad.
          </p>
          {!readOnly && (
            <button
              type="button"
              onClick={onNewProject}
              className="mt-2 px-4 py-2 rounded-xl bg-[#8A1428] text-white font-semibold text-xs"
            >
              Crear Nueva Actividad
            </button>
          )}
        </div>
      )}
    </div>
  );
}
