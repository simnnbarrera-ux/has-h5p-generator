"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Eye, Layers, X } from "lucide-react";
import {
  UAO_TEMPLATE_CATALOG,
  type UaoTemplateEntry,
  type UaoTemplateGroup,
  getUaoTemplate,
} from "@/lib/uao-template-catalog";

interface PresentationTemplateGalleryProps {
  selectedTemplateId?: string;
  onSelect: (templateId: string) => void;
}

const GROUPS: Array<{ id: UaoTemplateGroup; label: string }> = [
  { id: "facultad", label: "Facultad" },
  { id: "marca", label: "Marca UAO" },
  { id: "composicion", label: "Composiciones" },
];

function TemplatePreview({
  template,
  large = false,
}: {
  template: UaoTemplateEntry;
  large?: boolean;
}) {
  if (template.previewImage) {
    return (
      <Image
        src={template.previewImage}
        alt={`Vista previa de ${template.name}`}
        fill
        sizes={large ? "(max-width: 768px) 96vw, 900px" : "(max-width: 768px) 96vw, 33vw"}
        className="object-contain"
        unoptimized
        priority={large}
      />
    );
  }

  return (
    <iframe
      title={`Vista previa de ${template.name}`}
      src={template.previewHtml}
      sandbox="allow-scripts"
      loading="lazy"
      referrerPolicy="no-referrer"
      className="h-full w-full border-0 bg-white"
    />
  );
}

export default function PresentationTemplateGallery({
  selectedTemplateId,
  onSelect,
}: PresentationTemplateGalleryProps) {
  const [activeGroup, setActiveGroup] = useState<UaoTemplateGroup>(
    () => getUaoTemplate(selectedTemplateId)?.group || "facultad"
  );
  const [previewTemplateId, setPreviewTemplateId] = useState<string | null>(null);
  const closePreviewRef = useRef<HTMLButtonElement>(null);
  const previewTriggerRef = useRef<HTMLButtonElement | null>(null);
  const selectedTemplate = getUaoTemplate(selectedTemplateId);
  const previewTemplate = getUaoTemplate(previewTemplateId);
  const visibleTemplates = useMemo(
    () => UAO_TEMPLATE_CATALOG.filter((template) => template.group === activeGroup),
    [activeGroup]
  );

  useEffect(() => {
    if (!previewTemplateId) {
      previewTriggerRef.current?.focus();
      return;
    }
    closePreviewRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPreviewTemplateId(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewTemplateId]);

  const selectTemplate = (template: UaoTemplateEntry) => {
    onSelect(template.id);
  };

  return (
    <section className="space-y-4 border-t border-slate-100 pt-5" aria-labelledby="uao-template-gallery-title">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <h3 id="uao-template-gallery-title" className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Layers className="h-4 w-4 text-[#8A1428]" aria-hidden="true" />
            Diseños de presentación
          </h3>
          <p className="mt-1 max-w-3xl text-xs leading-relaxed text-slate-600">
            Explora las 20 propuestas antes de elegir. Las plantillas de Facultad usan una base H5P completa; Marca y Composiciones adaptan la paleta del diseño de muestra a la base compatible para conservar las diapositivas y sus interacciones.
          </p>
        </div>
        <div className="shrink-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
          <span className="font-semibold text-slate-700">Diseño activo: </span>
          <span className="font-bold text-[#8A1428]">
            {selectedTemplate?.theme.shortName || "Diseño anterior"}
          </span>
        </div>
      </div>

      {!selectedTemplate && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">
          Este recurso conserva una configuración de diseño anterior al catálogo. Puedes mantenerla o elegir una de estas propuestas; el contenido no se modifica al cambiar el diseño.
        </p>
      )}

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar diseños por categoría">
        {GROUPS.map((group) => {
          const count = UAO_TEMPLATE_CATALOG.filter((template) => template.group === group.id).length;
          const isActive = activeGroup === group.id;
          return (
            <button
              key={group.id}
              type="button"
              aria-pressed={isActive}
              onClick={() => setActiveGroup(group.id)}
              className={`rounded-xl border px-3 py-2 text-xs font-bold transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8A1428]/50 ${
                isActive
                  ? "border-[#8A1428] bg-[#8A1428] text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              {group.label} <span className={isActive ? "text-rose-100" : "text-slate-400"}>({count})</span>
            </button>
          );
        })}
      </div>

      <div
        id="uao-template-panel"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
      >
        {visibleTemplates.map((template) => {
          const isSelected = selectedTemplateId === template.id;
          return (
            <article
              key={template.id}
              className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition-shadow motion-reduce:transition-none ${
                isSelected
                  ? "border-[#8A1428] ring-2 ring-[#8A1428]/20"
                  : "border-slate-200 hover:shadow-md"
              }`}
            >
              <div className="relative aspect-video overflow-hidden bg-slate-100">
                <TemplatePreview template={template} />
                <span
                  className="absolute left-2 top-2 rounded-full bg-slate-950/75 px-2.5 py-1 text-[10px] font-semibold text-white"
                  style={{ pointerEvents: "none" }}
                >
                  {template.groupLabel}
                </span>
                {isSelected && (
                  <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-emerald-700 px-2.5 py-1 text-[10px] font-bold text-white">
                    <Check className="h-3 w-3" aria-hidden="true" /> Elegida
                  </span>
                )}
              </div>

              <div className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold leading-snug text-slate-900">{template.name}</h4>
                    <p className="mt-1 text-xs text-slate-500">{template.style}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5 pt-0.5" aria-label="Paleta de color">
                    {[template.theme.colors.primary, template.theme.colors.accent, template.theme.colors.background].map((color) => (
                      <span
                        key={color}
                        className="h-4 w-4 rounded-full border border-black/10"
                        style={{ backgroundColor: color }}
                        aria-hidden="true"
                      />
                    ))}
                  </div>
                </div>

                <p className="min-h-8 text-[11px] leading-relaxed text-slate-600">
                  {template.generationMode === "h5p-base"
                    ? "Plantilla H5P completa · 34 diapositivas"
                  : "Paleta adaptable · base H5P completa"}
                </p>

                <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={(event) => {
                      previewTriggerRef.current = event.currentTarget;
                      setPreviewTemplateId(template.id);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8A1428]/50"
                    aria-label={`Ampliar vista previa de ${template.name}`}
                  >
                    <Eye className="h-3.5 w-3.5" aria-hidden="true" /> Ver previa
                  </button>
                  <button
                    type="button"
                    onClick={() => selectTemplate(template)}
                    aria-pressed={isSelected}
                    className={`rounded-lg px-3 py-2 text-xs font-bold transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8A1428]/50 ${
                      isSelected
                        ? "bg-emerald-50 text-emerald-800"
                        : "bg-[#8A1428] text-white hover:bg-[#6F1020]"
                    }`}
                  >
                    {isSelected ? "Seleccionada" : "Usar este diseño"}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {previewTemplate && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-3 sm:p-6"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setPreviewTemplateId(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="uao-template-preview-title"
            className="w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-7">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#8A1428]">
                  {previewTemplate.groupLabel} · Vista previa
                </p>
                <h3 id="uao-template-preview-title" className="mt-1 text-lg font-bold text-slate-900">
                  {previewTemplate.name}
                </h3>
                <p className="mt-1 text-sm text-slate-600">{previewTemplate.style}</p>
              </div>
              <button
                ref={closePreviewRef}
                type="button"
                onClick={() => setPreviewTemplateId(null)}
                className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8A1428]/50"
                aria-label="Cerrar vista previa"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="p-4 sm:p-7">
              <div className="relative mx-auto aspect-video w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                <TemplatePreview template={previewTemplate} large />
              </div>
              <p className="mt-4 text-xs leading-relaxed text-slate-600">
                {previewTemplate.compatibilityNote}
              </p>
              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    selectTemplate(previewTemplate);
                    setPreviewTemplateId(null);
                  }}
                  className="rounded-xl bg-[#8A1428] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#6F1020] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8A1428]/50"
                >
                  Usar este diseño
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
