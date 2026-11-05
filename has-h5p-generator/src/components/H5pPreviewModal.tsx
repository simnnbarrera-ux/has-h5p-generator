"use client";

import React, { useState } from "react";
import {
  X,
  Play,
  FileCode,
  BookOpen,
  Copy,
  Check,
  Download,
  ExternalLink,
} from "lucide-react";
import { HasProjectRecord } from "@/lib/supabase";
import { getPresentationTemplate } from "@/lib/h5p-catalog";

interface H5pPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: HasProjectRecord | null;
  initialTab?: "player" | "python" | "moodle";
}

export default function H5pPreviewModal({
  isOpen,
  onClose,
  project,
  initialTab = "player",
}: H5pPreviewModalProps) {
  const [activeTab, setActiveTab] = useState<"player" | "python" | "moodle">(initialTab);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !project) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl h-[92vh] sm:h-[90vh] md:h-[88vh] min-h-[520px] max-h-[820px] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-rose-50 flex items-center justify-center text-[#8A1428] shrink-0">
                {activeTab === "player" ? (
                  <Play className="w-4 h-4 fill-[#8A1428]" />
                ) : activeTab === "python" ? (
                  <FileCode className="w-4 h-4" />
                ) : (
                  <BookOpen className="w-4 h-4" />
                )}
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                  {project.title}
                </h3>
                <p className="text-[10px] sm:text-[11px] text-slate-500">
                  {project.course_name} · {getPresentationTemplate(project.template_id).shortName}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="sm:hidden p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto max-w-full">
            <button
              type="button"
              onClick={() => setActiveTab("player")}
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold whitespace-nowrap transition ${
                activeTab === "player"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Reproductor H5P
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("python")}
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold whitespace-nowrap transition ${
                activeTab === "python"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Script ph5p.py
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("moodle")}
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold whitespace-nowrap transition ${
                activeTab === "moodle"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Libro Moodle (JSON)
            </button>
          </div>

          {/* Close & Download (Desktop) */}
          <div className="hidden sm:flex items-center gap-2">
            <a
              href={project.package_url || `/generated/${project.id}.h5p`}
              download={`${project.id}.h5p`}
              className="px-3 py-1.5 rounded-lg bg-[#8A1428] hover:bg-[#6F1020] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar .h5p</span>
            </a>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-hidden bg-slate-900 relative min-h-[460px] flex flex-col">
          {activeTab === "player" && (
            <iframe
              src={`/preview-viewer/index.html?id=${encodeURIComponent(
                project.id
              )}&t=${Date.now()}`}
              className="w-full h-full flex-1 border-none min-h-[460px]"
              title="Reproductor H5P"
            />
          )}

          {activeTab === "python" && (
            <div className="h-full flex flex-col p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-600">
                  Código Python compatible con la CLI ph5p.py:
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(project.ph5p_script || "")}
                  className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold rounded-lg text-slate-700 flex items-center gap-1.5 shadow-sm"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copied ? "Copiado al portapapeles" : "Copiar Código"}</span>
                </button>
              </div>
              <pre className="flex-1 overflow-auto p-4 bg-slate-900 text-slate-100 font-mono text-xs rounded-2xl shadow-inner select-all">
                {project.ph5p_script || "# No se ha generado el script ph5p aún."}
              </pre>
            </div>
          )}

          {activeTab === "moodle" && (
            <div className="h-full flex flex-col p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-600">
                  Estructura JSON de Capítulos para Libro de Moodle:
                </span>
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(JSON.stringify(project.moodle_book || {}, null, 2))
                  }
                  className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold rounded-lg text-slate-700 flex items-center gap-1.5 shadow-sm"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copied ? "Copiado al portapapeles" : "Copiar JSON"}</span>
                </button>
              </div>
              <pre className="flex-1 overflow-auto p-4 bg-slate-900 text-slate-100 font-mono text-xs rounded-2xl shadow-inner select-all">
                {JSON.stringify(project.moodle_book || {}, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Mobile Download Footer */}
        <div className="sm:hidden p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <a
            href={project.package_url || `/generated/${project.id}.h5p`}
            download={`${project.id}.h5p`}
            className="w-full py-2 rounded-xl bg-[#8A1428] hover:bg-[#6F1020] text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar paquete .h5p</span>
          </a>
        </div>
      </div>
    </div>
  );
}
