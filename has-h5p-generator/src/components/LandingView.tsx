"use client";

import React from "react";
import {
  Sparkles,
  Layers,
  Puzzle,
  Volume2,
  FileCode,
  ShieldCheck,
  ArrowRight,
  Play,
  Cpu,
  BookOpen,
  Binary,
  GraduationCap,
  ExternalLink,
  ChevronRight,
  Compass,
} from "lucide-react";
import ThreeHeroScene from "./ThreeHeroScene";
import TiltCard from "./TiltCard";
import HasLogo from "./HasLogo";
import { HasProjectRecord } from "@/lib/supabase";

interface LandingViewProps {
  onStartWizard: () => void;
  onOpenProject: (projectId: string) => void;
  onPreviewDemo?: (projectId: string) => void;
  onOpenAuth: () => void;
  userEmail?: string;
  sampleProjects: HasProjectRecord[];
}

export default function LandingView({
  onStartWizard,
  onOpenProject,
  onPreviewDemo,
  onOpenAuth,
  userEmail,
  sampleProjects,
}: LandingViewProps) {
  const reto11Act1 = sampleProjects.find(
    (p) => p.id === "matematicas-discretas-act1"
  );
  const reto11Act0 = sampleProjects.find(
    (p) => p.id === "matematicas-discretas-act0"
  );

  return (
    <div className="space-y-16 pb-12">
      {/* 1. Hero Section */}
      <section className="relative pt-6 md:pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column: Typography & CTAs */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-rose-50 border border-rose-200/90 text-[#8A1428] text-xs font-semibold shadow-xs">
              <HasLogo size={20} />
              <span>Digitatón UAO 2026 — Reto 11 · Equipo 36 (EQ-36)</span>
            </div>

            <h1 className="text-3xl md:text-5xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
              Co-creación Inteligente de{" "}
              <span className="text-[#8A1428]">Recursos Educativos H5P</span> para
              el Campus Digital UAO
            </h1>

            <p className="text-sm md:text-base text-slate-600 leading-relaxed max-w-2xl font-normal">
              Plataforma web de autoría asistida por IA para docentes universitarios.
              Genera paquetes interactivos{" "}
              <strong className="text-slate-800 font-semibold">CoursePresentation 1.27</strong>{" "}
              basados en la plantilla institucional{" "}
              <strong className="text-slate-800 font-semibold">fiuao-6-215</strong>,
              garantizando cero desbordamiento de texto, 19 tipos de interactividades,
              locución neuronal colombiana y diagramas técnicos SVG accesibles.
            </p>

            {/* Badges Bar */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-600">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100/90 border border-slate-200 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-[#0099E6]" />
                Plantilla fiuao-6-215
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100/90 border border-slate-200 font-medium">
                <Puzzle className="w-3.5 h-3.5 text-[#8A1428]" />
                19 Actividades H5P
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100/90 border border-slate-200 font-medium">
                <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                Locución Académica (CO)
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100/90 border border-slate-200 font-medium">
                <Binary className="w-3.5 h-3.5 text-indigo-600" />
                Matemáticas Discretas
              </span>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onStartWizard}
                className="px-6 py-3 rounded-xl bg-[#8A1428] hover:bg-[#6F1020] text-white font-semibold text-xs md:text-sm shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 group"
              >
                <span>Crear Recurso H5P (Wizard)</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                type="button"
                onClick={() =>
                  onPreviewDemo
                    ? onPreviewDemo("matematicas-discretas-act1")
                    : onOpenProject("matematicas-discretas-act1")
                }
                className="px-5 py-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-semibold text-xs md:text-sm shadow-sm transition flex items-center gap-2"
              >
                <Play className="w-4 h-4 text-[#8A1428]" />
                <span>Ver Demo Reto 11 en Vivo</span>
              </button>

              {!userEmail && (
                <button
                  type="button"
                  onClick={onOpenAuth}
                  className="px-4 py-3 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs md:text-sm font-medium transition"
                >
                  Acceso Docente / Jurado
                </button>
              )}
            </div>
          </div>

          {/* Right Column: Floating 3D Geometric Space without framing boxes */}
          <div className="lg:col-span-5 relative flex items-center justify-center min-h-[340px] sm:min-h-[400px] md:min-h-[460px]">
            {/* Ambient background glow */}
            <div className="absolute -inset-6 rounded-full bg-gradient-to-tr from-[#8A1428]/15 via-[#0099E6]/15 to-transparent blur-3xl pointer-events-none" />

            {/* Seamless 3D scene floating directly in the hero space */}
            <ThreeHeroScene className="w-full h-[320px] sm:h-[380px] md:h-[450px]" />
          </div>
        </div>
      </section>

      {/* 2. Spotlight Reto 11: Matemáticas Discretas */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-slate-900">
              Caso de Estudio Oficial: Reto 11 — Matemáticas Discretas
            </h2>
            <p className="text-xs text-slate-500">
              Prof. Oswaldo Rodríguez Díaz · Módulo 1: Inducción matemática y recursividad
            </p>
          </div>
          <span className="text-xs font-semibold text-[#8A1428] px-3 py-1 bg-rose-50 border border-rose-200 rounded-lg">
            Equipo 36 (EQ-36)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Actividad 1 Card */}
          <TiltCard
            onClick={() =>
              onPreviewDemo
                ? onPreviewDemo("matematicas-discretas-act1")
                : onOpenProject("matematicas-discretas-act1")
            }
            className="border-slate-200/90"
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-50 text-[#8A1428] text-[11px] font-bold">
                    Actividad Faro 1
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-2">
                    Del dato al código digital: Representación discreta en las máquinas
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    IEEE-754 de 32 bits, código ASCII, conjuntos numéricos finitos y
                    reflexión sobre fallas críticas por truncamiento.
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                  <Binary className="w-5 h-5 text-[#8A1428]" />
                </div>
              </div>

              {/* Badges */}
              <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-100 text-center">
                <div>
                  <div className="text-sm font-bold text-slate-800">22</div>
                  <div className="text-[10px] text-slate-400 font-medium">Diapositivas</div>
                </div>
                <div>
                  <div className="text-sm font-bold text-[#0099E6]">8</div>
                  <div className="text-[10px] text-slate-400 font-medium">Interactividades</div>
                </div>
                <div>
                  <div className="text-sm font-bold text-emerald-700">4</div>
                  <div className="text-[10px] text-slate-400 font-medium">Diagramas SVG</div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs font-semibold text-[#8A1428] pt-1">
                <span className="flex items-center gap-1.5">
                  <Play className="w-3.5 h-3.5 fill-[#8A1428]" />
                  Abrir y explorar en el Estudio
                </span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </TiltCard>

          {/* Actividad 0 Card */}
          <TiltCard
            onClick={() =>
              onPreviewDemo
                ? onPreviewDemo("matematicas-discretas-act0")
                : onOpenProject("matematicas-discretas-act0")
            }
            className="border-slate-200/90"
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-sky-50 text-[#0099E6] text-[11px] font-bold">
                    Actividad 0 (Bienvenida)
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-2">
                    Bienvenida y Trayectoria: Matemáticas Discretas
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    Inducción formativa con Slide 1 '¿Cómo navegar?' (exclusivo Actividad 0),
                    diagnóstico interactivo y locución docente institucional.
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center shrink-0">
                  <GraduationCap className="w-5 h-5 text-[#0099E6]" />
                </div>
              </div>

              {/* Badges */}
              <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-100 text-center">
                <div>
                  <div className="text-sm font-bold text-slate-800">8</div>
                  <div className="text-[10px] text-slate-400 font-medium">Diapositivas</div>
                </div>
                <div>
                  <div className="text-sm font-bold text-[#0099E6]">1</div>
                  <div className="text-[10px] text-slate-400 font-medium">Diagnóstico H5P</div>
                </div>
                <div>
                  <div className="text-sm font-bold text-emerald-700">100%</div>
                  <div className="text-[10px] text-slate-400 font-medium">Reglas UAO</div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs font-semibold text-[#0099E6] pt-1">
                <span className="flex items-center gap-1.5">
                  <Play className="w-3.5 h-3.5 fill-[#0099E6]" />
                  Abrir y explorar en el Estudio
                </span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </TiltCard>
        </div>
      </section>

      {/* 3. 3D Tilt Feature Grid */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl font-bold text-slate-900">
            Arquitectura de Ingeniería Inversa y Producción Automatizada
          </h2>
          <p className="text-xs md:text-sm text-slate-500">
            Diseñada cumpliendo al 100% los estándares técnicos de la Facultad de
            Ingeniería de la Universidad Autónoma de Occidente.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <TiltCard>
            <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center mb-3">
              <Layers className="w-5 h-5 text-[#8A1428]" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              Clonador Quirúrgico fiuao-6-215
            </h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Conserva los 32 layouts oficiales de la plantilla UAO. Inyecta
              elementos interactivos y auto-escala fuentes y coordenadas para
              garantizar cero desbordamiento de texto.
            </p>
          </TiltCard>

          <TiltCard>
            <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center mb-3">
              <Puzzle className="w-5 h-5 text-[#0099E6]" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              Catálogo de 19 Actividades H5P
            </h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Desde SingleChoiceSet y DragText nativos hasta SortParagraphs y
              CombinationLock (Escape Room) emulados sin requerir permisos de
              administrador en Moodle.
            </p>
          </TiltCard>

          <TiltCard>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center mb-3">
              <Volume2 className="w-5 h-5 text-emerald-700" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              Locución Académica Institucional
            </h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Síntesis de voz con dicción colombiana e internacional clara, diseñada
              para accesibilidad universal auditiva y contenidos bilingües.
            </p>
          </TiltCard>

          <TiltCard>
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center mb-3">
              <Cpu className="w-5 h-5 text-amber-700" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              Diagramas Vectoriales SVG Accesibles
            </h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Generación de esquemas técnicos, estructuras IEEE-754 y tablas de verdad
              en SVG de alta resolución con contraste WCAG AAA y citas APA 7.
            </p>
          </TiltCard>

          <TiltCard>
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center mb-3">
              <Sparkles className="w-5 h-5 text-indigo-700" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              Copilot y Dictado por Voz Docente
            </h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Los profesores pueden dictar sus ideas en lenguaje natural. El asistente inteligente
              estructura automáticamente las diapositivas y las interactividades.
            </p>
          </TiltCard>

          <TiltCard>
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center mb-3">
              <FileCode className="w-5 h-5 text-purple-700" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              Exportación Triple Simultánea
            </h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Descarga directa del paquete listo <code className="text-purple-900">.h5p</code>,
              el script editable en Python <code className="text-purple-900">ph5p.py</code>{" "}
              y la estructura de Libro de Moodle para importar en el aula virtual.
            </p>
          </TiltCard>
        </div>
      </section>

      {/* 4. Bottom CTA */}
      <section className="rounded-3xl bg-gradient-to-r from-[#8A1428] to-[#5C0D1B] p-8 md:p-12 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-left">
          <div className="text-xs font-bold uppercase tracking-wider text-rose-200">
            Digitatón UAO 2026 · Equipo 36
          </div>
          <h2 className="text-xl md:text-3xl font-extrabold">
            ¿Listo para crear un nuevo recurso H5P?
          </h2>
          <p className="text-xs md:text-sm text-rose-100/90 max-w-xl">
            Inicia el Wizard guiado paso a paso y transforma un texto o bosquejo
            en una presentación interactiva profesional para tu curso.
          </p>
        </div>

        <button
          type="button"
          onClick={onStartWizard}
          className="px-6 py-3.5 rounded-xl bg-white text-[#8A1428] hover:bg-rose-50 font-bold text-xs md:text-sm shadow-lg transition flex items-center gap-2 shrink-0"
        >
          <span>Iniciar Wizard de Co-creación</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </section>
    </div>
  );
}
