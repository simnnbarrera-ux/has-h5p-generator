"use client";

import React from "react";
import Image from "next/image";
import { findSlideLayout } from "@/lib/h5p-catalog";
import type { HasProjectSpec, HasSlideSpec } from "@/lib/h5p-engine";
import { resolveFontCssStack } from "@/lib/h5p-engine";
import { getUaoCompositionShapeElements } from "@/lib/uao-composition-layouts";
import { getUaoTemplate, type UaoTemplateColors } from "@/lib/uao-template-catalog";
import type { CustomDiagramSpec } from "@/lib/custom-diagram";
import { BUILTIN_RETO11_SVGS } from "@/lib/svg-diagrams";

interface LiveSlidePreviewProps {
  spec: HasProjectSpec;
  slide: HasSlideSpec;
  slideNumber: number;
}

type ShapeParams = {
  shape?: {
    type?: string;
    fillColor?: string;
    borderWidth?: string | number;
    borderColor?: string;
    borderRadius?: string | number;
  };
  line?: { borderColor?: string; borderWidth?: string | number; borderStyle?: string };
};

type ShapeElement = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  action?: { params?: ShapeParams };
};

function MiniDiagram({ diagram, colors }: { diagram: CustomDiagramSpec; colors: UaoTemplateColors }) {
  if (diagram.kind === "graph" && diagram.graph) {
    const graph = diagram.graph;
    const points = graph.points.map((point) => {
      const x = ((point.x - graph.xMin) / (graph.xMax - graph.xMin)) * 100;
      const y = 100 - ((point.y - graph.yMin) / (graph.yMax - graph.yMin)) * 100;
      return `${x},${y}`;
    }).join(" ");
    return (
      <svg viewBox="0 0 100 100" className="h-full w-full" role="img" aria-label={diagram.title}>
        <path d="M10 8V90H96" fill="none" stroke={colors.textMuted} strokeWidth="1.5" />
        <polyline points={points} fill="none" stroke={colors.primary} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
        {graph.points.map((point, index) => {
          const x = ((point.x - graph.xMin) / (graph.xMax - graph.xMin)) * 100;
          const y = 100 - ((point.y - graph.yMin) / (graph.yMax - graph.yMin)) * 100;
          return <circle key={`${point.x}-${point.y}-${index}`} cx={x} cy={y} r="2.4" fill={colors.accent} />;
        })}
      </svg>
    );
  }

  const nodes = diagram.nodes.slice(0, 4);
  const isHorizontal = diagram.kind === "flow" || diagram.kind === "timeline";
  const isComparison = diagram.kind === "comparison";
  return (
    <div className={`grid h-full min-h-0 gap-1.5 ${isHorizontal ? "grid-flow-col auto-cols-fr items-center" : isComparison ? "grid-cols-2" : "grid-cols-2"}`}>
      {nodes.map((node, index) => (
        <React.Fragment key={node.id}>
          <div
            className="flex min-h-0 flex-col items-center justify-center overflow-hidden rounded-lg border px-1.5 py-1 text-center shadow-sm"
            style={{ backgroundColor: colors.cardBg, borderColor: colors.cardBorder }}
          >
            <span className="line-clamp-2 text-[8px] font-bold leading-tight" style={{ color: colors.textPrimary }}>{node.label}</span>
            {node.detail && <span className="mt-0.5 line-clamp-1 text-[7px] leading-tight" style={{ color: colors.textMuted }}>{node.detail}</span>}
          </div>
          {isHorizontal && index < nodes.length - 1 && (
            <span className="self-center text-[10px] font-bold" style={{ color: colors.primary }} aria-hidden="true">→</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

export default function LiveSlidePreview({ spec, slide, slideNumber }: LiveSlidePreviewProps) {
  const layout = findSlideLayout(slide.templateSlide);
  const palette = getUaoTemplate(spec.selectedTemplateId)?.theme || getUaoTemplate("facultad-1")!.theme;
  const base = getUaoTemplate(spec.baseTemplateId) || getUaoTemplate("facultad-1")!;
  const colors = palette.colors;
  const decorations = getUaoCompositionShapeElements(
    slide.compositionId,
    layout.templateNumber,
    colors
  ) as ShapeElement[];
  const fontFamily = resolveFontCssStack(spec.fontFamily || palette.recommendedFont);
  const paragraphs = (slide.paragraphs || []).filter(Boolean).slice(0, 3);
  const builtInDiagram = slide.svgDiagramId ? BUILTIN_RETO11_SVGS[slide.svgDiagramId] : undefined;
  const hasVisualAsset = Boolean(builtInDiagram || slide.customSvg);
  const reserveVisual = Boolean(slide.reserveVisualSpace ?? (hasVisualAsset || slide.imagePendingDescription));
  const showVisualColumn = reserveVisual && [4, 6, 7].includes(layout.templateNumber);
  const isCoverOrClosing = layout.templateNumber === 1 || layout.templateNumber === 8;
  const isCardLayout = layout.templateNumber === 2 || layout.templateNumber === 3;
  const isReferenceLayout = layout.templateNumber === 5 || layout.templateNumber === 9;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="text-sm font-extrabold text-slate-900">Vista previa en vivo</h4>
          <p className="mt-0.5 text-[10px] text-slate-500">Diapositiva {slideNumber} · cambia al editar los controles</p>
        </div>
        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-800">Actualización inmediata</span>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-100 p-2 sm:p-3">
        <div
          className="relative isolate aspect-[16/9] w-full overflow-hidden rounded-lg border border-black/10 shadow-lg"
          style={{ backgroundColor: colors.background, fontFamily }}
          aria-label={`Vista previa de la diapositiva ${slideNumber}`}
        >
          <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
            {decorations.map((element, index) => {
              const params = element.action?.params || {};
              const shape = params.shape || {};
              const line = params.line || {};
              const fill = shape.fillColor || "transparent";
              const borderWidth = Number(shape.borderWidth || line.borderWidth || 0);
              const radius = Number(shape.borderRadius || 0);
              const isCircle = shape.type === "circle";
              return (
                <span
                  key={`composition-shape-${index}`}
                  className="absolute block"
                  style={{
                    left: `${element.x ?? 0}%`,
                    top: `${element.y ?? 0}%`,
                    width: `${element.width ?? 0}%`,
                    height: `${element.height ?? 0}%`,
                    zIndex: index + 1,
                    backgroundColor: fill,
                    border: borderWidth > 0 ? `${Math.min(borderWidth, 3)}px ${line.borderStyle || "solid"} ${line.borderColor || shape.borderColor || colors.cardBorder}` : undefined,
                    borderRadius: isCircle ? "50%" : radius > 0 ? `${Math.min(radius, 40)}%` : undefined,
                  }}
                />
              );
            })}
          </div>

          <div className={`relative z-10 flex h-full flex-col overflow-hidden p-[5%] ${isCoverOrClosing ? "items-center text-center" : "items-stretch"}`}>
            <div className={`w-full ${isCoverOrClosing ? "mt-[2%]" : ""}`}>
              <div className="mb-[2%] flex items-center justify-between gap-2 text-[7px] font-bold uppercase tracking-[0.12em] sm:text-[9px]" style={{ color: colors.primary }}>
                <span className="truncate">{spec.courseName || "Curso UAO"}</span>
                <span className="shrink-0 rounded-full px-2 py-0.5 text-[6px] sm:text-[8px]" style={{ backgroundColor: colors.badgeBg, color: colors.badgeText }}>{base.theme.shortName}</span>
              </div>
              <h3 className={`line-clamp-2 text-[clamp(13px,2.2vw,25px)] font-extrabold leading-tight ${isCoverOrClosing ? "mx-auto max-w-[80%]" : ""}`} style={{ color: colors.textPrimary }}>
                {slide.titleBlack || slide.menuTitle || "Título de la diapositiva"}
                {slide.titleAccent ? <span style={{ color: colors.accent }}> {slide.titleAccent}</span> : null}
              </h3>
              {slide.subtitle && <p className={`mt-[1%] line-clamp-2 text-[clamp(8px,1.15vw,13px)] leading-snug ${isCoverOrClosing ? "mx-auto max-w-[78%]" : ""}`} style={{ color: colors.textMuted }}>{slide.subtitle}</p>}
            </div>

            <div className={`mt-[3%] min-h-0 flex-1 ${showVisualColumn ? "grid grid-cols-[1fr_0.82fr] gap-[3%]" : ""} ${isReferenceLayout ? "grid grid-cols-2 gap-[4%]" : ""}`}>
              <div className={`min-h-0 overflow-hidden ${isCardLayout ? "grid grid-cols-2 gap-[2%]" : "space-y-[2%]"}`}>
                {isCardLayout && (
                  <>
                    {slide.stepsCards?.length
                      ? slide.stepsCards.slice(0, 4).map((card, index) => (
                          <div key={`${card.number}-${index}`} className="flex min-h-0 flex-col justify-center overflow-hidden rounded-lg border p-[4%] shadow-sm" style={{ backgroundColor: colors.cardBg, borderColor: colors.cardBorder }}>
                            <span className="mb-1 flex h-4 w-4 items-center justify-center rounded-full text-[7px] font-bold text-white" style={{ backgroundColor: colors.primary }}>{card.number || index + 1}</span>
                            <span className="line-clamp-1 text-[8px] font-bold" style={{ color: colors.textPrimary }}>{card.title}</span>
                            <span className="mt-0.5 line-clamp-2 text-[7px] leading-tight" style={{ color: colors.textMuted }}>{card.description}</span>
                          </div>
                        ))
                      : (paragraphs.length ? paragraphs : ["Los objetivos de aprendizaje se mostrarán aquí."])
                          .slice(0, 4)
                          .map((paragraph, index) => (
                            <div key={`card-${index}`} className="flex min-h-0 items-center gap-1.5 overflow-hidden rounded-lg border p-[4%] shadow-sm" style={{ backgroundColor: colors.cardBg, borderColor: colors.cardBorder }}>
                              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[7px] font-bold text-white" style={{ backgroundColor: colors.primary }}>{index + 1}</span>
                              <span className="line-clamp-3 text-[7px] leading-tight" style={{ color: colors.textPrimary }}>{paragraph}</span>
                            </div>
                          ))}
                  </>
                )}
                {!isCardLayout && (paragraphs.length ? paragraphs : ["El contenido de la diapositiva aparecerá aquí."]).map((paragraph, index) => (
                  <p key={`paragraph-${index}`} className="line-clamp-3 text-[clamp(7px,0.95vw,11px)] leading-relaxed" style={{ color: colors.textPrimary }}>{paragraph}</p>
                ))}
              </div>

              {isCoverOrClosing && slideNumber === 1 && spec.slides.length > 1 && (
                <div className="mt-[4%] w-full">
                  <div className="mb-[1.2%] flex items-center justify-between gap-2 text-[7px] font-extrabold uppercase tracking-[0.12em] sm:text-[9px]" style={{ color: colors.primary }}>
                    <span>Recorrido de la presentación</span>
                    <span className="font-semibold tracking-normal" style={{ color: colors.textMuted }}>
                      {Math.min(spec.slides.length - 1, 3)} temas iniciales
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-[1.2%]">
                    {spec.slides.slice(1, 4).map((nextSlide, index) => (
                      <div
                        key={`cover-outline-${nextSlide.id || index}`}
                        className="flex min-h-[42px] min-w-0 items-start gap-[4%] overflow-hidden rounded-lg border p-[2.5%] shadow-sm sm:min-h-[58px]"
                        style={{ backgroundColor: colors.cardBg, borderColor: colors.cardBorder }}
                      >
                        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[7px] font-extrabold text-white sm:h-5 sm:w-5 sm:text-[8px]" style={{ backgroundColor: colors.primary }}>
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="min-w-0">
                          <span className="line-clamp-2 block text-[7px] font-bold leading-tight sm:text-[9px]" style={{ color: colors.textPrimary }}>
                            {nextSlide.menuTitle || nextSlide.titleBlack || `Tema ${index + 1}`}
                          </span>
                          {nextSlide.subtitle && (
                            <span className="mt-0.5 line-clamp-1 block text-[6px] leading-tight sm:text-[7px]" style={{ color: colors.textMuted }}>
                              {nextSlide.subtitle}
                            </span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {isReferenceLayout && (
                <div className="space-y-[3%] border-l pl-[6%]" style={{ borderColor: colors.cardBorder }}>
                  {paragraphs.slice(0, 2).map((paragraph, index) => <p key={`reference-${index}`} className="line-clamp-4 text-[clamp(7px,0.9vw,10px)] leading-relaxed" style={{ color: colors.textMuted }}>{paragraph}</p>)}
                  {!paragraphs.length && <p className="text-[8px]" style={{ color: colors.textMuted }}>Lecturas y enlaces aparecerán en esta columna.</p>}
                </div>
              )}

              {showVisualColumn && (
                <div
                  role="group"
                  aria-label={slide.customSvg ? `Diagrama: ${slide.customSvg.title}` : builtInDiagram?.altText || "Columna visual reservada"}
                  className={hasVisualAsset ? "flex min-h-0 items-center justify-center overflow-hidden rounded-lg border p-[3%]" : "h-full min-h-0"}
                  style={hasVisualAsset ? { borderColor: colors.cardBorder, backgroundColor: colors.cardBg } : undefined}
                >
                  {slide.customSvg ? (
                    <div className="h-full w-full overflow-hidden rounded-md p-[3%]" style={{ backgroundColor: colors.background }}>
                      <div className="mb-1 line-clamp-1 text-center text-[7px] font-bold" style={{ color: colors.primary }}>{slide.customSvg.title}</div>
                      <MiniDiagram diagram={slide.customSvg} colors={colors} />
                    </div>
                  ) : builtInDiagram ? (
                    <Image
                      src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(builtInDiagram.svgContent)}`}
                      alt={builtInDiagram.altText}
                      width={builtInDiagram.width}
                      height={builtInDiagram.height}
                      unoptimized
                      className="h-full w-full object-contain"
                    />
                  ) : null}
                </div>
              )}
            </div>

            {slide.highlightBox && (
              <div className="mt-[2%] line-clamp-2 rounded-md border px-[3%] py-[1.5%] text-[clamp(7px,0.9vw,10px)] font-semibold leading-tight" style={{ backgroundColor: colors.highlightBg, borderColor: colors.cardBorder, color: colors.textPrimary }}>
                {slide.highlightBox}
              </div>
            )}

            <div className="mt-[2%] flex items-center justify-between border-t pt-[1.5%] text-[6px] font-semibold sm:text-[8px]" style={{ borderColor: `${colors.primary}30`, color: colors.textMuted }}>
              <span className="truncate">{spec.moduleName || "Módulo"}</span>
              <span className="shrink-0">{slideNumber} / {spec.slides.length}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5 text-[9px]">
        <span className="rounded-full border px-2 py-1" style={{ borderColor: colors.cardBorder, color: colors.textPrimary }}>Paleta: {palette.shortName}</span>
        <span className="rounded-full border px-2 py-1" style={{ borderColor: colors.cardBorder, color: colors.textPrimary }}>Base: {base.theme.shortName}</span>
        <span className="rounded-full border px-2 py-1" style={{ borderColor: colors.cardBorder, color: colors.textPrimary }}>Composición: {getUaoTemplate(slide.compositionId)?.theme.shortName || "Sin composición"}</span>
      </div>
      <p className="mt-2 text-[10px] leading-relaxed text-slate-500">Preview visual orientativo; el reproductor H5P del Paso 5 muestra la compilación interactiva final.</p>
    </section>
  );
}
