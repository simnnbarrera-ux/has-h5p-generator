"use client";

import React, { useState, useRef } from "react";
import {
  Sparkles,
  Layers,
  Puzzle,
  Volume2,
  FileCode,
  ShieldCheck,
  Check,
  ArrowRight,
  ArrowLeft,
  Mic,
  Square,
  Play,
  Download,
  Loader2,
  RefreshCw,
  Plus,
  Trash2,
  Type,
  HelpCircle,
  Eye,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
} from "lucide-react";
import {
  H5P_ACTIVITY_CATALOG,
  EDGE_NEURAL_VOICES,
  H5P_FONT_OPTIONS,
  UAO_SLIDE_LAYOUTS,
  H5P_PRESENTATION_TEMPLATES,
  getPresentationTemplate,
  findSlideLayout,
  PresentationTemplateSpec,
  H5PActivityTypeSpec,
} from "@/lib/h5p-catalog";
import {
  HasProjectSpec,
  HasSlideSpec,
  SlideInteractionSpec,
  scaleEmSize,
  resolveFontCssStack,
  generatePh5pPythonScript,
  generateMoodleBookJson,
} from "@/lib/h5p-engine";
import { BUILTIN_RETO11_SVGS } from "@/lib/svg-diagrams";
import TiltCard from "./TiltCard";

interface WizardStepsProps {
  spec: HasProjectSpec;
  setSpec: React.Dispatch<React.SetStateAction<HasProjectSpec>>;
  onCompile: (overrideSpec?: HasProjectSpec) => Promise<any>;
  compiling: boolean;
  compilationResult: any;
  userEmail: string;
}

export default function WizardSteps({
  spec,
  setSpec,
  onCompile,
  compiling,
  compilationResult,
  userEmail,
}: WizardStepsProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Preview key for iframe dynamic reloads
  const [previewKey, setPreviewKey] = useState<number>(Date.now());

  const showToast = (message: string) => {
    setToastMessage(message);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Dynamic download trigger for .h5p
  const triggerH5pDownload = async (customDownloadUrl?: string) => {
    const filename = `${spec.id}.h5p`;
    const sameOriginUrl = `/api/h5p/download?id=${encodeURIComponent(spec.id)}&t=${Date.now()}`;
    const targetUrl = customDownloadUrl || sameOriginUrl;

    try {
      // 1. Intentar descarga limpia via Blob
      const res = await fetch(targetUrl);
      if (res.ok) {
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = filename;
        link.style.display = "none";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
        return true;
      }
    } catch (err) {
      console.warn("Fetch de blob falló, usando método nativo de descarga:", err);
    }

    // 2. Fallback a iframe oculto con endpoint same-origin (fuerza descarga nativa sin recargar página)
    try {
      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      iframe.src = sameOriginUrl;
      document.body.appendChild(iframe);
      setTimeout(() => {
        if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
      }, 15000);
      return true;
    } catch (e) {
      console.warn("Fallback iframe falló, navegando a descarga:", e);
      window.location.href = sameOriginUrl;
      return true;
    }
  };

  // Finalizar y Descargar .h5p action
  const handleFinishAndDownload = async () => {
    let downloadUrl = compilationResult?.downloadUrl;

    if (!compilationResult) {
      const res = await onCompile(spec);
      if (res) {
        downloadUrl = res.downloadUrl || `/api/h5p/download?id=${spec.id}`;
        setPreviewKey(Date.now());
      }
    }

    await triggerH5pDownload(downloadUrl);
    showToast("¡Paquete .h5p descargado exitosamente! Listo para Moodle UAO");
  };

  // Recompilar paquete
  const handleRecompilePackage = async () => {
    const res = await onCompile(spec);
    if (res?.success) {
      setPreviewKey(Date.now());
      showToast("¡Paquete H5P recompilado exitosamente! Vista previa actualizada");
    }
  };

  // Descarga Tarjeta 2: Script Python ph5p.py
  const handleDownloadPythonScript = () => {
    const pyScript = generatePh5pPythonScript(spec);
    const blob = new Blob([pyScript], { type: "text/x-python;charset=utf-8" });
    const blobUrl = URL.createObjectURL(blob);
    const filename = `${spec.id}_ph5p.py`;
    const link = document.createElement("a");
    link.href = blobUrl;
    link.setAttribute("download", filename);
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    showToast("¡Script Python ph5p.py descargado exitosamente! Compatible con CLI ph5p");
  };

  // Descarga Tarjeta 3: Libro Moodle (JSON)
  const handleDownloadMoodleBook = () => {
    const bookData = generateMoodleBookJson(spec);
    const jsonStr = JSON.stringify(bookData, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8" });
    const blobUrl = URL.createObjectURL(blob);
    const filename = `${spec.id}_moodle_book.json`;
    const link = document.createElement("a");
    link.href = blobUrl;
    link.setAttribute("download", filename);
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    showToast("¡Estructura de Libro Moodle descargada exitosamente! Formato JSON accesible");
  };

  // Step change handler
  const handleStepChange = async (targetStep: 1 | 2 | 3 | 4 | 5) => {
    if (targetStep === 5 && currentStep !== 5) {
      setCurrentStep(5);
      const res = await onCompile(spec);
      if (res?.success) {
        setPreviewKey(Date.now());
      }
      return;
    }
    setCurrentStep(targetStep);
  };

  // STT Dictation state
  const [isRecording, setIsRecording] = useState(false);
  const [sttLoading, setSttLoading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Prompt / Copilot state
  const [copilotPrompt, setCopilotPrompt] = useState("");
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [copilotMessages, setCopilotMessages] = useState<
    Array<{ role: "user" | "assistant"; content: string }>
  >([]);

  // Audio auditioner state
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // SVG AI generation state
  const [svgPrompt, setSvgPrompt] = useState("");
  const [svgGenerating, setSvgGenerating] = useState(false);

  // Step 4 Slide editor state
  const [selectedSlideIndex, setSelectedSlideIndex] = useState(0);

  // Activity filter state in Step 2
  const [activityCategory, setActivityCategory] = useState<string>("all");

  // Template Preview & Selection state in Step 1
  const [hoveredTemplateId, setHoveredTemplateId] = useState<string | null>(null);

  const handleSelectTemplate = (templateId: string) => {
    const chosenTmpl = getPresentationTemplate(templateId);
    setSpec((prev) => ({
      ...prev,
      templateId: chosenTmpl.id,
      fontFamily: prev.fontFamily || chosenTmpl.recommendedFont,
    }));
    showToast(`Plantilla "${chosenTmpl.shortName}" seleccionada exitosamente.`);
  };

  /* ---------- Reconocimiento de voz docente ---------- */
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mr;
      audioChunksRef.current = [];

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mr.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        stream.getTracks().forEach((t) => t.stop());
        await processVoiceStt(audioBlob);
      };

      mr.start();
      setIsRecording(true);
    } catch (err: any) {
      alert("No se pudo acceder al micrófono: " + err.message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processVoiceStt = async (blob: Blob) => {
    setSttLoading(true);
    try {
      const fd = new FormData();
      fd.append("audio", blob, "dictation.webm");
      fd.append("userEmail", userEmail);

      const res = await fetch("/api/stt", { method: "POST", body: fd });
      const data = await res.json();
      if (data.text) {
        setCopilotPrompt((prev) => (prev ? prev + " " + data.text : data.text));
      } else if (data.error) {
        alert("Error en reconocimiento de voz: " + data.error);
      }
    } catch (err: any) {
      alert("Error enviando audio para reconocimiento: " + err.message);
    } finally {
      setSttLoading(false);
    }
  };

  /* ---------- Asistente IA Institucional ---------- */
  const handleSendCopilot = async () => {
    if (!copilotPrompt.trim() || copilotLoading) return;
    const userText = copilotPrompt.trim();
    setCopilotPrompt("");
    setCopilotLoading(true);

    const newMsgs = [...copilotMessages, { role: "user" as const, content: userText }];
    setCopilotMessages(newMsgs);

    try {
      const res = await fetch("/api/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMsgs,
          userEmail,
          currentSpec: spec,
        }),
      });
      const data = await res.json();
      if (data.response) {
        setCopilotMessages([
          ...newMsgs,
          { role: "assistant" as const, content: data.response },
        ]);
        if (data.suggestedSpec) {
          setSpec(data.suggestedSpec);
        }
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setCopilotLoading(false);
    }
  };

  /* ---------- Locución Académica (CO) Voice Audition ---------- */
  const handleTestVoice = async (voiceId: string) => {
    setPreviewingVoice(voiceId);
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `Hola, soy la voz institucional para tu recurso educativo interactivo en el Campus Digital de la Universidad Autónoma de Occidente.`,
          voice: voiceId,
          userEmail,
        }),
      });
      if (res.ok) {
        const blob = await res.blob();
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        const aud = new Audio(url);
        aud.play();
      }
    } catch (err) {
      console.error("Error probando voz:", err);
    } finally {
      setPreviewingVoice(null);
    }
  };

  /* ---------- SVG AI Generation with Gemini ---------- */
  const handleGenerateSvgAi = async () => {
    if (!svgPrompt.trim() || svgGenerating) return;
    setSvgGenerating(true);
    try {
      const res = await fetch("/api/svg-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: svgPrompt.trim(), userEmail }),
      });
      const data = await res.json();
      if (data.svgContent) {
        const slide = spec.slides[selectedSlideIndex];
        if (slide) {
          const updated = [...spec.slides];
          updated[selectedSlideIndex] = {
            ...slide,
            customSvg: {
              title: slide.titleBlack || "Diagrama Técnico",
              subtitle: slide.titleAccent || "Generado con IA",
              highlights: [svgPrompt.trim().slice(0, 70)],
            },
          };
          setSpec({ ...spec, slides: updated });
        }
        setSvgPrompt("");
      }
    } catch (err) {
      console.error("Error generando SVG:", err);
    } finally {
      setSvgGenerating(false);
    }
  };

  const stepsList = [
    { num: 1, label: "Origen", desc: "Prompt, Voz y Maqueta" },
    { num: 2, label: "Actividades", desc: "19 Tipos H5P" },
    { num: 3, label: "Diseño & Voces", desc: "Tipografía, TTS y SVGs" },
    { num: 4, label: "Diapositivas", desc: "Cajas y Textos" },
    { num: 5, label: "Publicación", desc: "Vista Previa y Descargas" },
  ];

  return (
    <div className="space-y-6 pb-12 relative">
      {/* Toast Alert Notification */}
      {toastMessage && (
        <div
          role="alert"
          className="fixed bottom-6 right-6 z-[100] max-w-md bg-slate-900/95 text-white border border-emerald-500/50 rounded-2xl p-4 shadow-2xl backdrop-blur-md flex items-start gap-3 animate-in fade-in slide-in-from-bottom-5 duration-300"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="flex-1">
            <div className="text-xs font-bold text-emerald-400">
              Notificación del Sistema
            </div>
            <div className="text-xs text-slate-100 font-medium mt-0.5 leading-snug">
              {toastMessage}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white transition p-1"
            title="Cerrar notificación"
          >
            <span className="text-sm font-bold">×</span>
          </button>
        </div>
      )}

      {/* 1. Visual Progress Stepper Bar */}
      <section className="bg-white border border-slate-200/90 rounded-3xl p-4 md:p-6 shadow-sm">
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2 md:pb-0">
          {stepsList.map((st, idx) => {
            const isActive = currentStep === st.num;
            const isCompleted = currentStep > st.num;

            return (
              <React.Fragment key={st.num}>
                <button
                  type="button"
                  onClick={() => handleStepChange(st.num as any)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-2xl transition text-left shrink-0 ${
                    isActive
                      ? "bg-rose-50 border border-rose-200/80"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold transition ${
                      isActive
                        ? "bg-[#8A1428] text-white shadow-sm"
                        : isCompleted
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {isCompleted ? <Check className="w-4 h-4" /> : st.num}
                  </div>
                  <div className="hidden sm:block">
                    <div
                      className={`text-xs font-bold ${
                        isActive
                          ? "text-[#8A1428]"
                          : isCompleted
                          ? "text-slate-800"
                          : "text-slate-500"
                      }`}
                    >
                      Paso {st.num}: {st.label}
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">
                      {st.desc}
                    </div>
                  </div>
                </button>

                {idx < stepsList.length - 1 && (
                  <div
                    className={`hidden md:block flex-1 h-0.5 mx-1 transition ${
                      currentStep > st.num ? "bg-emerald-400" : "bg-slate-200"
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </section>

      {/* 2. Step Views */}

      {/* ------------------------------------------------------------- */}
      {/* PASO 1: ORIGEN DEL CONTENIDO (PROMPT, DICTADO Y METADATOS)    */}
      {/* ------------------------------------------------------------- */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Paso 1: Configuración General y Origen de Contenido
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Define el curso, la actividad y escribe o dicta los requerimientos pedagógicos
                para que el modelo configure la estructura de la lección interactiva.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre de la Actividad
                </label>
                <input
                  type="text"
                  value={spec.title}
                  onChange={(e) => setSpec({ ...spec, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#8A1428]/30 focus:border-[#8A1428]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Asignatura / Curso
                </label>
                <input
                  type="text"
                  value={spec.courseName}
                  onChange={(e) => setSpec({ ...spec, courseName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#8A1428]/30 focus:border-[#8A1428]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Módulo Académico
                </label>
                <input
                  type="text"
                  value={spec.moduleName}
                  onChange={(e) => setSpec({ ...spec, moduleName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#8A1428]/30 focus:border-[#8A1428]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Número de Actividad
                </label>
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={spec.activityNumber}
                  onChange={(e) =>
                    setSpec({
                      ...spec,
                      activityNumber: parseInt(e.target.value) || 1,
                      includeNavigationGuide: parseInt(e.target.value) === 0,
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#8A1428]/30 focus:border-[#8A1428]"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Regla UAO: Si la actividad es 0, se incluye la guía interactiva '¿Cómo navegar?'.
                </span>
              </div>
            </div>

            {/* Selección de las 9 Plantillas Institucionales con Previsualización en Vivo */}
            <div className="pt-5 border-t border-slate-100 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#8A1428]" />
                    <span>Catálogo de 9 Plantillas de Diseño Institucional</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Pasa el cursor sobre cualquiera de las 9 plantillas para previsualizar en vivo el diseño con su paleta de colores y haz clic para seleccionarla para la generación.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs text-slate-500 font-medium">Plantilla elegida:</span>
                  <span className="px-2.5 py-1 rounded-xl bg-[#8A1428] text-white text-xs font-bold shadow-xs">
                    {getPresentationTemplate(spec.templateId).shortName}
                  </span>
                </div>
              </div>

              {/* Grid 2 Columnas: Lista de 9 Plantillas (Col 7) + Live Miniature Mockup (Col 5) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                {/* 9 Plantillas Selector Grid */}
                <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[580px] overflow-y-auto pr-1">
                  {H5P_PRESENTATION_TEMPLATES.map((tmpl) => {
                    const isSelected = (spec.templateId || "plantilla-1") === tmpl.id;
                    const isHovered = hoveredTemplateId === tmpl.id;

                    return (
                      <div
                        key={tmpl.id}
                        onClick={() => handleSelectTemplate(tmpl.id)}
                        onMouseEnter={() => setHoveredTemplateId(tmpl.id)}
                        onMouseLeave={() => setHoveredTemplateId(null)}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col justify-between text-left ${
                          isSelected
                            ? "bg-rose-50/50 border-[#8A1428] shadow-md ring-2 ring-[#8A1428]/25"
                            : isHovered
                            ? "bg-slate-50 border-slate-300 shadow-sm"
                            : "bg-white border-slate-200/90 hover:border-slate-300"
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-1">
                            <span
                              className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider text-white"
                              style={{ backgroundColor: tmpl.colors.primary }}
                            >
                              Plantilla {tmpl.templateNumber}
                            </span>
                            {isSelected ? (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
                                <Check className="w-3 h-3" />
                                <span>Seleccionada</span>
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-medium">
                                {tmpl.category}
                              </span>
                            )}
                          </div>

                          <div>
                            <h4 className="text-xs font-bold text-slate-900 leading-snug">
                              {tmpl.shortName}
                            </h4>
                            <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                              {tmpl.description}
                            </p>
                          </div>

                          {/* Color Swatches */}
                          <div className="flex items-center gap-2 pt-1">
                            <div className="flex items-center gap-1.5">
                              <div
                                className="w-4 h-4 rounded-full border border-black/10 shadow-xs"
                                style={{ backgroundColor: tmpl.colors.primary }}
                                title={`Color Primario: ${tmpl.colors.primary}`}
                              />
                              <div
                                className="w-4 h-4 rounded-full border border-black/10 shadow-xs"
                                style={{ backgroundColor: tmpl.colors.accent }}
                                title={`Color Acento: ${tmpl.colors.accent}`}
                              />
                              <div
                                className="w-4 h-4 rounded-full border border-black/10 shadow-xs"
                                style={{ backgroundColor: tmpl.colors.background }}
                                title={`Fondo: ${tmpl.colors.background}`}
                              />
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium capitalize">
                              {tmpl.recommendedFont.replace("_", " ")}
                            </span>
                          </div>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[10px] text-slate-400">
                            {isSelected ? "Activa para compilar" : "Clic para seleccionar"}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectTemplate(tmpl.id);
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                              isSelected
                                ? "bg-[#8A1428] text-white"
                                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                            }`}
                          >
                            {isSelected ? "Elegida" : "Seleccionar"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Right Column: Live Miniature Mockup */}
                <div className="lg:col-span-5 sticky top-4">
                  {(() => {
                    const activePreviewTemplate = getPresentationTemplate(
                      hoveredTemplateId || spec.templateId || "plantilla-1"
                    );
                    const isHoverPreview =
                      Boolean(hoveredTemplateId) &&
                      hoveredTemplateId !== (spec.templateId || "plantilla-1");

                    return (
                      <div className="bg-slate-50/80 border border-slate-200 rounded-3xl p-4 shadow-sm space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: activePreviewTemplate.colors.accent }}
                            />
                            <span className="text-xs font-bold text-slate-900">
                              Vista Previa en Vivo: {activePreviewTemplate.shortName}
                            </span>
                          </div>
                          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                            Plantilla {activePreviewTemplate.templateNumber}
                          </span>
                        </div>

                        {/* 16:9 Realistic Miniature Slide Mockup */}
                        <div
                          className="aspect-video w-full rounded-2xl overflow-hidden shadow-md border relative flex flex-col justify-between p-3.5 transition-all duration-300"
                          style={{
                            backgroundColor: activePreviewTemplate.colors.background,
                            borderColor: activePreviewTemplate.colors.cardBorder,
                          }}
                        >
                          {/* Top Institutional Header Accent Stripe */}
                          <div
                            className="absolute top-0 left-0 right-0 h-1.5"
                            style={{
                              background: `linear-gradient(90deg, ${activePreviewTemplate.colors.primary} 0%, ${activePreviewTemplate.colors.accent} 100%)`,
                            }}
                          />

                          {/* Slide Header */}
                          <div className="space-y-0.5">
                            <div
                              className="text-[8px] uppercase font-bold tracking-widest flex items-center gap-1.5"
                              style={{ color: activePreviewTemplate.colors.accent }}
                            >
                              <span>Campus Digital UAO</span>
                              <span>•</span>
                              <span>{spec.courseName || "Ingeniería y Ciencias"}</span>
                            </div>
                            <h4
                              className="text-xs sm:text-sm font-black tracking-tight leading-snug line-clamp-1"
                              style={{ color: activePreviewTemplate.colors.textPrimary }}
                            >
                              <span>{spec.title ? spec.title.split(" ").slice(0, 3).join(" ") : "Representación Discreta"} </span>
                              <span style={{ color: activePreviewTemplate.colors.accent }}>
                                {spec.title && spec.title.split(" ").length > 3
                                  ? spec.title.split(" ").slice(3).join(" ")
                                  : "y Código Digital"}
                              </span>
                            </h4>
                            <div
                              className="text-[8px] font-medium"
                              style={{ color: activePreviewTemplate.colors.textMuted }}
                            >
                              Actividad {spec.activityNumber} • {spec.moduleName || "Módulo 1: Fundamentos"}
                            </div>
                          </div>

                          {/* Slide Body: 2 Micro-Cards Mockup */}
                          <div className="grid grid-cols-2 gap-2 my-auto">
                            {/* Left Micro-Card */}
                            <div
                              className="p-2 rounded-xl border flex flex-col justify-between shadow-2xs"
                              style={{
                                backgroundColor: activePreviewTemplate.colors.cardBg,
                                borderColor: activePreviewTemplate.colors.cardBorder,
                              }}
                            >
                              <p
                                className="text-[8px] leading-tight line-clamp-3"
                                style={{ color: activePreviewTemplate.colors.textPrimary }}
                              >
                                Estructura conceptual y formalización matemática para la representación de datos continuos en sistemas digitales.
                              </p>
                              <div
                                className="mt-1 p-1 rounded text-[7px] font-medium line-clamp-2"
                                style={{
                                  backgroundColor: activePreviewTemplate.colors.highlightBg,
                                  color: activePreviewTemplate.colors.textPrimary,
                                  borderLeft: `2.5px solid ${activePreviewTemplate.colors.accent}`,
                                }}
                              >
                                Nota pedagógica: Contraste normativo y cero desbordamiento.
                              </div>
                            </div>

                            {/* Right Micro-Card: Interactive Activity */}
                            <div
                              className="p-2 rounded-xl border flex flex-col justify-between shadow-2xs"
                              style={{
                                backgroundColor: activePreviewTemplate.colors.cardBg,
                                borderColor: activePreviewTemplate.colors.cardBorder,
                              }}
                            >
                              <div className="space-y-0.5">
                                <div className="flex items-center justify-between">
                                  <span
                                    className="px-1 py-0.2 rounded text-[7px] font-bold uppercase tracking-wider text-white"
                                    style={{ backgroundColor: activePreviewTemplate.colors.primary }}
                                  >
                                    Interactivo
                                  </span>
                                  <span
                                    className="text-[7px] font-semibold"
                                    style={{ color: activePreviewTemplate.colors.accent }}
                                  >
                                    1.0 / 1.0 pts
                                  </span>
                                </div>
                                <div
                                  className="text-[8px] font-bold line-clamp-1"
                                  style={{ color: activePreviewTemplate.colors.textPrimary }}
                                >
                                  ¿Estándar para punto flotante?
                                </div>
                              </div>

                              <div className="space-y-0.5 mt-1">
                                <div
                                  className="px-1.5 py-0.5 rounded text-[7px] font-bold text-white flex items-center justify-between"
                                  style={{ backgroundColor: activePreviewTemplate.colors.accent }}
                                >
                                  <span>IEEE-754 (32/64 bits)</span>
                                  <Check className="w-2.5 h-2.5 text-white" />
                                </div>
                                <div
                                  className="px-1.5 py-0.5 rounded text-[7px] border text-slate-600"
                                  style={{
                                    backgroundColor: activePreviewTemplate.colors.background,
                                    borderColor: activePreviewTemplate.colors.cardBorder,
                                  }}
                                >
                                  <span>ASCII Extendido</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Slide Footer */}
                          <div className="flex items-center justify-between pt-1 border-t border-black/5">
                            <div className="flex items-center gap-1.5">
                              <span
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: activePreviewTemplate.colors.primary }}
                              />
                              <span
                                className="text-[7px] font-bold"
                                style={{ color: activePreviewTemplate.colors.textMuted }}
                              >
                                Plantilla {activePreviewTemplate.templateNumber} de 9
                              </span>
                            </div>
                            <div
                              className="px-2 py-0.5 rounded text-[7px] font-bold text-white flex items-center gap-1"
                              style={{ backgroundColor: activePreviewTemplate.colors.accent }}
                            >
                              <span>Siguiente</span>
                              <ArrowRight className="w-2 h-2" />
                            </div>
                          </div>
                        </div>

                        {/* Live Preview Info & Action Button */}
                        <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs">
                          <div className="text-[11px]">
                            {isHoverPreview ? (
                              <span className="text-amber-700 font-medium">
                                Previsualizando al pasar el cursor
                              </span>
                            ) : (
                              <span className="text-emerald-700 font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Plantilla activa para compilar
                              </span>
                            )}
                          </div>

                          {isHoverPreview && (
                            <button
                              type="button"
                              onClick={() => handleSelectTemplate(activePreviewTemplate.id)}
                              className="px-3 py-1 rounded-xl bg-[#8A1428] hover:bg-[#6F1020] text-white text-xs font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
                            >
                              <span>Activar Plantilla</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Prompt & STT Dictation Box */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#8A1428]" />
                  <span>Dictado por Voz Docente o Prompt Pedagógico</span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={sttLoading}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                      isRecording
                        ? "bg-red-600 text-white animate-pulse"
                        : "bg-rose-50 text-[#8A1428] hover:bg-rose-100 border border-rose-200"
                    }`}
                  >
                    {isRecording ? (
                      <>
                        <Square className="w-3.5 h-3.5 fill-white" />
                        <span>Detener Dictado</span>
                      </>
                    ) : sttLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Transcribiendo...</span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-3.5 h-3.5" />
                        <span>Dictar con Micrófono</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="relative">
                <textarea
                  rows={4}
                  value={copilotPrompt}
                  onChange={(e) => setCopilotPrompt(e.target.value)}
                  placeholder="Describe en lenguaje natural lo que deseas enseñar. Ejemplo: 'Crea una actividad sobre representación binaria de números reales IEEE-754 de 32 bits, con un ejercicio de arrastrar palabras para clasificar conjuntos numéricos, una tabla de referencia ASCII y una pregunta de opción única sobre errores de redondeo...'"
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#8A1428]/30 focus:border-[#8A1428] resize-none"
                />

                <div className="absolute right-3 bottom-3">
                  <button
                    type="button"
                    onClick={handleSendCopilot}
                    disabled={copilotLoading || !copilotPrompt.trim()}
                    className="px-4 py-2 bg-[#8A1428] hover:bg-[#6F1020] text-white text-xs font-semibold rounded-xl shadow-sm transition disabled:opacity-40 flex items-center gap-1.5"
                  >
                    {copilotLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Procesando...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Estructurar con IA</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Copilot Dialogue History */}
            {copilotMessages.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="text-xs font-bold text-slate-700">Historial del Copilot</div>
                <div className="max-h-48 overflow-y-auto space-y-2 p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                  {copilotMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={`p-2.5 rounded-xl ${
                        msg.role === "user"
                          ? "bg-white text-slate-800 border border-slate-200"
                          : "bg-rose-50/70 text-slate-900 border border-rose-200/60"
                      }`}
                    >
                      <div className="font-semibold text-[10px] uppercase text-slate-400 mb-1">
                        {msg.role === "user" ? "Profesor" : "Copilot HAS H5P"}
                      </div>
                      <div className="whitespace-pre-line">{msg.content}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* PASO 2: SELECCIÓN DE ACTIVIDADES H5P (19 TIPOS EN 3D CARDS)   */}
      {/* ------------------------------------------------------------- */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Paso 2: Catálogo de 19 Actividades H5P Educativas
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Explora las mecánicas interactivas y selecciona cuáles deseas
                  integrar en tu recurso. Cada actividad cumple con los lineamientos
                  de accesibilidad y compatibilidad con el Campus Virtual UAO.
                </p>
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {["all", "evaluacion", "visual", "estudio", "multimedia", "produccion", "comunidad"].map(
                  (cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setActivityCategory(cat)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition ${
                        activityCategory === cat
                          ? "bg-[#8A1428] text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {cat === "all" ? "Todas (19)" : cat}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Grid of 19 Activities with 3D Tilt */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {H5P_ACTIVITY_CATALOG.filter(
                (act) => activityCategory === "all" || act.category === activityCategory
              ).map((act) => {
                const isUsedInProject = spec.slides.some(
                  (s) => s.interaction?.type === act.id
                );

                return (
                  <TiltCard key={act.id} className="flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-white"
                          style={{ backgroundColor: act.badgeColor }}
                        >
                          {act.category}
                        </span>
                        <span className="text-[10px] font-medium text-slate-500">
                          Plantilla {findSlideLayout(act.templateSlide).templateNumber}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-sm font-bold text-slate-900">
                          {act.spanishName}
                        </h3>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {act.library}
                        </div>
                        <p className="text-xs text-slate-600 mt-2 line-clamp-3">
                          {act.description}
                        </p>
                      </div>

                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-500">
                        <strong className="text-slate-700">Uso pedagógico: </strong>
                        {act.pedagogicalUse}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-500">
                        {isUsedInProject ? (
                          <span className="text-emerald-700 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Activa en el recurso
                          </span>
                        ) : (
                          "Disponible"
                        )}
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          // Quick toggle or add slide with this activity
                          if (isUsedInProject) {
                            const filtered = spec.slides.filter(
                              (s) => s.interaction?.type !== act.id
                            );
                            setSpec({ ...spec, slides: filtered });
                          } else {
                            const newSlide: HasSlideSpec = {
                              id: `slide-${act.id}-${Date.now().toString().slice(-4)}`,
                              templateSlide: act.templateSlide || 25,
                              menuTitle: act.spanishName.slice(0, 30),
                              titleBlack: act.spanishName.slice(0, 25),
                              titleAccent: "Interactiva",
                              paragraphs: [act.description],
                              interaction: {
                                type: act.id as any,
                                instruction: "Completa la actividad propuesta:",
                                ...(act.id === "single_choice_set"
                                  ? {
                                      questions: [
                                        {
                                          question:
                                            "¿Cuál es el valor fundamental en estudio?",
                                          answers: ["Opción correcta", "Distractor 1"],
                                        },
                                      ],
                                    }
                                  : {}),
                              },
                            };
                            setSpec({ ...spec, slides: [...spec.slides, newSlide] });
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                          isUsedInProject
                            ? "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
                            : "bg-[#8A1428] text-white hover:bg-[#6F1020]"
                        }`}
                      >
                        {isUsedInProject ? "Quitar Diapositiva" : "+ Añadir Diapositiva"}
                      </button>
                    </div>
                  </TiltCard>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* PASO 3: DISEÑO, FUENTES, EDGE TTS Y DIAGRAMAS SVG             */}
      {/* ------------------------------------------------------------- */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Paso 3: Identidad Visual, Tipografía y Recursos Multimedia
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Personaliza la familia tipográfica (inyectada en las diapositivas y en
                la plataforma), la voz de locución académica institucional y los
                diagramas técnicos SVG generados con IA.
              </p>
            </div>

            {/* Typography Selector */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Type className="w-4 h-4 text-[#8A1428]" />
                  <span>Familia Tipográfica Oficial para Diapositivas y Plataforma</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500 font-medium">Escala:</span>
                  {(["compact", "normal", "large"] as const).map((sc) => (
                    <button
                      key={sc}
                      type="button"
                      onClick={() => setSpec({ ...spec, globalFontScale: sc })}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold capitalize transition ${
                        (spec.globalFontScale || "normal") === sc
                          ? "bg-[#8A1428] text-white"
                          : "bg-white text-slate-600 border border-slate-200"
                      }`}
                    >
                      {sc === "compact"
                        ? "Compacta (0.88x)"
                        : sc === "large"
                        ? "Grande (1.08x)"
                        : "Normal (1.0x)"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {H5P_FONT_OPTIONS.map((f) => {
                  const isSelected = (spec.fontFamily || "plus_jakarta") === f.id;

                  return (
                    <div
                      key={f.id}
                      onClick={() => setSpec({ ...spec, fontFamily: f.id })}
                      className={`p-3.5 rounded-xl border cursor-pointer transition ${
                        isSelected
                          ? "bg-white border-[#8A1428] shadow-sm ring-2 ring-[#8A1428]/20"
                          : "bg-white/80 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">
                          {f.name.split("(")[0]}
                        </span>
                        {isSelected && <Check className="w-4 h-4 text-[#8A1428]" />}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                        {f.category}
                      </div>
                      <div
                        className="mt-2 text-xs text-slate-700 p-2 bg-slate-50 rounded-lg border border-slate-100"
                        style={{ fontFamily: f.cssStack }}
                      >
                        {f.sampleText}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Locución Académica (CO) Selector */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-emerald-700" />
                  <span>Locución Institucional de Alta Fidelidad (10 Voces Académicas)</span>
                </label>
                <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Voz activa: {spec.defaultVoice || "es-CO-SalomeNeural"}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {EDGE_NEURAL_VOICES.map((v) => {
                  const isSelected = (spec.defaultVoice || "es-CO-SalomeNeural") === v.id;
                  const isAuditioning = previewingVoice === v.id;

                  return (
                    <div
                      key={v.id}
                      className={`p-3 rounded-xl border flex flex-col justify-between transition ${
                        isSelected
                          ? "bg-white border-emerald-600 shadow-sm ring-2 ring-emerald-500/20"
                          : "bg-white border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">
                            {v.name}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {v.language}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                          {v.tone}
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => handleTestVoice(v.id)}
                          disabled={isAuditioning}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-semibold flex items-center gap-1 transition"
                        >
                          {isAuditioning ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Play className="w-3 h-3 fill-emerald-800" />
                          )}
                          <span>Probar Audio</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSpec({ ...spec, defaultVoice: v.id })}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                            isSelected
                              ? "bg-emerald-700 text-white"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          }`}
                        >
                          {isSelected ? "Seleccionada" : "Usar Voz"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SVG AI Generator Box */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-3">
              <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <FileCode className="w-4 h-4 text-[#0099E6]" />
                <span>Generador de Diagramas Técnicos SVG Vectoriales con IA</span>
              </label>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={svgPrompt}
                  onChange={(e) => setSvgPrompt(e.target.value)}
                  placeholder="Ej. Diagrama de bloques de la unidad de control, o autómata finito con 3 estados..."
                  className="flex-1 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0099E6]/30 focus:border-[#0099E6]"
                />
                <button
                  type="button"
                  onClick={handleGenerateSvgAi}
                  disabled={svgGenerating || !svgPrompt.trim()}
                  className="px-4 py-2.5 bg-[#0099E6] hover:bg-[#007acc] text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {svgGenerating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  <span>Generar SVG</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* PASO 4: EDITOR VISUAL DE DIAPOSITIVAS Y AJUSTE DE CAJAS       */}
      {/* ------------------------------------------------------------- */}
      {currentStep === 4 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Slides Navigation Strip */}
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-3xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-900">
                  Diapositivas ({spec.slides.length})
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const newSlide: HasSlideSpec = {
                      id: `slide-${Date.now().toString().slice(-4)}`,
                      templateSlide: 4,
                      menuTitle: `Plantilla ${spec.slides.length + 1}`,
                      titleBlack: "Nuevo Concepto",
                      titleAccent: "Clave",
                      subtitle: "Subtítulo descriptivo",
                      paragraphs: ["Escribe el contenido aquí."],
                    };
                    setSpec({ ...spec, slides: [...spec.slides, newSlide] });
                    setSelectedSlideIndex(spec.slides.length);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-[#8A1428] text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Añadir</span>
                </button>
              </div>

              <div className="max-h-[580px] overflow-y-auto space-y-1.5 pr-1">
                {spec.slides.map((s, idx) => {
                  const isSelected = selectedSlideIndex === idx;
                  const slideLayout = findSlideLayout(s.templateSlide);

                  return (
                    <div
                      key={s.id || idx}
                      onClick={() => setSelectedSlideIndex(idx)}
                      className={`p-2.5 rounded-xl border cursor-pointer transition flex items-center justify-between text-xs ${
                        isSelected
                          ? "bg-rose-50/70 border-[#8A1428] font-bold text-slate-900"
                          : "bg-white border-slate-100 hover:border-slate-200 text-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-bold shrink-0">
                          {idx + 1}
                        </span>
                        <span className="truncate">{s.menuTitle || `Plantilla ${idx + 1}`}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-normal shrink-0">
                        Plantilla {slideLayout.templateNumber}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Editor Form for Selected Slide */}
            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
              {spec.slides[selectedSlideIndex] ? (
                <>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A1428]">
                        Diapositiva {selectedSlideIndex + 1} de {spec.slides.length}
                      </span>
                      <h3 className="text-base font-bold text-slate-900">
                        {spec.slides[selectedSlideIndex].menuTitle}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={findSlideLayout(spec.slides[selectedSlideIndex].templateSlide).slideNumber}
                        onChange={(e) => {
                          const newSlideNum = parseInt(e.target.value, 10);
                          const updated = spec.slides.map((s, idx) =>
                            idx === selectedSlideIndex
                              ? { ...s, templateSlide: newSlideNum }
                              : s
                          );
                          setSpec({ ...spec, slides: updated });
                        }}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-[#8A1428]/30 focus:border-[#8A1428]"
                      >
                        {UAO_SLIDE_LAYOUTS.map((lay) => (
                          <option key={lay.templateNumber} value={lay.slideNumber}>
                            {lay.name}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={() => {
                          if (spec.slides.length <= 1) return;
                          const filtered = spec.slides.filter(
                            (_, i) => i !== selectedSlideIndex
                          );
                          setSpec({ ...spec, slides: filtered });
                          setSelectedSlideIndex(Math.max(0, selectedSlideIndex - 1));
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                        title="Eliminar diapositiva"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Banner de Diseño Global Activo */}
                  {(() => {
                    const activeDesign = getPresentationTemplate(spec.templateId);
                    return (
                      <div className="p-3 bg-slate-50 border border-slate-200/90 rounded-2xl flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5">
                          <div className="flex items-center gap-1">
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-2xs"
                              style={{ backgroundColor: activeDesign.colors.primary }}
                              title={`Primario: ${activeDesign.colors.primary}`}
                            />
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-2xs"
                              style={{ backgroundColor: activeDesign.colors.accent }}
                              title={`Acento: ${activeDesign.colors.accent}`}
                            />
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-2xs"
                              style={{ backgroundColor: activeDesign.colors.background }}
                              title={`Fondo: ${activeDesign.colors.background}`}
                            />
                          </div>
                          <div>
                            <span className="font-bold text-slate-800">
                              Diseño Global: {activeDesign.name}
                            </span>
                            <span className="text-[10px] text-slate-400 ml-2 hidden sm:inline">
                              Tipografía: {activeDesign.recommendedFont.replace("_", " ")}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleStepChange(1)}
                          className="text-[11px] text-[#8A1428] font-bold hover:underline cursor-pointer"
                        >
                          Cambiar Plantilla Global
                        </button>
                      </div>
                    );
                  })()}

                  {/* Visual Purpose Badge for Selected Template */}
                  {(() => {
                    const currentLayout = findSlideLayout(
                      spec.slides[selectedSlideIndex]?.templateSlide
                    );
                    if (!currentLayout) return null;
                    return (
                      <div className="p-3.5 bg-slate-50 border border-slate-200/90 rounded-2xl flex items-start gap-3 text-xs">
                        <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-200/60 flex items-center justify-center shrink-0 text-[#8A1428]">
                          <Layers className="w-4 h-4" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">
                              {currentLayout.name}
                            </span>
                            <span className="text-[10px] font-semibold bg-[#8A1428] text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
                              Plantilla {currentLayout.templateNumber}
                            </span>
                          </div>
                          <p className="text-slate-600 text-[11px] leading-relaxed">
                            {currentLayout.description}
                          </p>
                          <div className="text-[11px] text-[#0099E6] font-semibold pt-0.5 flex items-center gap-1">
                            <span className="text-slate-400 font-normal">Propósito pedagógico:</span>
                            <span>{currentLayout.bestFor}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Inputs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Título de Menú (máx 35 caracteres)
                      </label>
                      <input
                        type="text"
                        maxLength={35}
                        value={spec.slides[selectedSlideIndex].menuTitle || ""}
                        onChange={(e) => {
                          const updated = [...spec.slides];
                          updated[selectedSlideIndex].menuTitle = e.target.value;
                          setSpec({ ...spec, slides: updated });
                        }}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Subtítulo
                      </label>
                      <input
                        type="text"
                        value={spec.slides[selectedSlideIndex].subtitle || ""}
                        onChange={(e) => {
                          const updated = [...spec.slides];
                          updated[selectedSlideIndex].subtitle = e.target.value;
                          setSpec({ ...spec, slides: updated });
                        }}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Título Negro (Primera Parte)
                      </label>
                      <input
                        type="text"
                        value={spec.slides[selectedSlideIndex].titleBlack || ""}
                        onChange={(e) => {
                          const updated = [...spec.slides];
                          updated[selectedSlideIndex].titleBlack = e.target.value;
                          setSpec({ ...spec, slides: updated });
                        }}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Título Acento Azul (Segunda Parte)
                      </label>
                      <input
                        type="text"
                        value={spec.slides[selectedSlideIndex].titleAccent || ""}
                        onChange={(e) => {
                          const updated = [...spec.slides];
                          updated[selectedSlideIndex].titleAccent = e.target.value;
                          setSpec({ ...spec, slides: updated });
                        }}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 text-[#0099E6] font-bold"
                      />
                    </div>
                  </div>

                  {/* Paragraphs Editor */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Párrafos de Desarrollo (un párrafo por línea)
                    </label>
                    <textarea
                      rows={4}
                      value={spec.slides[selectedSlideIndex].paragraphs?.join("\n\n") || ""}
                      onChange={(e) => {
                        const updated = [...spec.slides];
                        updated[selectedSlideIndex].paragraphs = e.target.value
                          .split("\n\n")
                          .map((p) => p.trim())
                          .filter(Boolean);
                        setSpec({ ...spec, slides: updated });
                      }}
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 resize-none"
                    />
                  </div>

                  {/* Highlight Box */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Recuadro Destacado / Nota Pedagógica
                    </label>
                    <input
                      type="text"
                      value={spec.slides[selectedSlideIndex].highlightBox || ""}
                      onChange={(e) => {
                        const updated = [...spec.slides];
                        updated[selectedSlideIndex].highlightBox = e.target.value;
                        setSpec({ ...spec, slides: updated });
                      }}
                      placeholder="Texto relevante que se destaca al pie de la diapositiva"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                    />
                  </div>

                  {/* Zero Overflow Guarantee Info */}
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs text-emerald-800">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      Garantía de Cero Desbordamiento: Las coordenadas de cajas y el
                      tamaño tipográfico se calcularán automáticamente para adaptarse al
                      layout de la diapositiva.
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-slate-400 text-xs">
                  Selecciona una diapositiva en la lista izquierda.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* PASO 5: PREVISUALIZACIÓN EN VIVO Y EXPORTACIÓN TRIPLE         */}
      {/* ------------------------------------------------------------- */}
      {currentStep === 5 && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Paso 5: Previsualización en Vivo y Descarga del Paquete H5P
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Verifica el funcionamiento interactivo de tu paquete con el reproductor
                  oficial y descarga los archivos listos para subir a Moodle.
                </p>
              </div>

              <button
                type="button"
                onClick={handleRecompilePackage}
                disabled={compiling}
                className="px-5 py-2.5 rounded-xl bg-[#8A1428] hover:bg-[#6F1020] text-white font-bold text-xs shadow-md transition flex items-center gap-2 disabled:opacity-50 shrink-0 cursor-pointer"
              >
                {compiling ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Compilando paquete...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span>Recompilar Paquete H5P</span>
                  </>
                )}
              </button>
            </div>

            {/* Embedded Live H5P Player */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-900/5 shadow-inner w-full flex flex-col items-center">
              <iframe
                key={previewKey}
                src={`/preview-viewer/index.html?id=${encodeURIComponent(
                  spec.id
                )}&t=${previewKey}`}
                className="w-full h-[72vh] min-h-[500px] max-h-[740px] border-none"
                title="Reproductor H5P en vivo"
              />
            </div>

            {/* Downloads strip */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleFinishAndDownload}
                disabled={compiling}
                className="p-4 bg-white hover:bg-rose-50/50 border border-slate-200 hover:border-[#8A1428] rounded-2xl transition flex items-center justify-between text-left group shadow-sm disabled:opacity-60 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 text-[#8A1428] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    {compiling ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Download className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-[#8A1428]">
                      Paquete Oficial (.h5p)
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Listo para subir a Moodle UAO
                    </div>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-[#8A1428] bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200/80 group-hover:bg-[#8A1428] group-hover:text-white transition">
                  Descargar
                </span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPythonScript}
                className="p-4 bg-white hover:bg-sky-50/50 border border-slate-200 hover:border-[#0099E6] rounded-2xl transition flex items-center justify-between text-left group shadow-sm cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-100 text-[#0099E6] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <FileCode className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-[#0099E6]">
                      Script Python (ph5p.py)
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Editable con la CLI propia ph5p (EQ-36)
                    </div>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-[#0099E6] bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200/80 group-hover:bg-[#0099E6] group-hover:text-white transition">
                  Descargar
                </span>
              </button>

              <button
                type="button"
                onClick={handleDownloadMoodleBook}
                className="p-4 bg-white hover:bg-purple-50/50 border border-slate-200 hover:border-purple-500 rounded-2xl transition flex items-center justify-between text-left group shadow-sm cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-purple-700">
                      Libro Moodle (JSON)
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Estructura capitular del curso
                    </div>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200/80 group-hover:bg-purple-700 group-hover:text-white transition">
                  Descargar
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Wizard Bottom Stepper Navigation */}
      <section className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={() => handleStepChange(Math.max(1, currentStep - 1) as any)}
          disabled={currentStep === 1}
          className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-semibold text-xs transition flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Paso Anterior</span>
        </button>

        <div className="flex items-center gap-2">
          {currentStep < 5 ? (
            <button
              type="button"
              onClick={() => handleStepChange(Math.min(5, currentStep + 1) as any)}
              className="px-5 py-2.5 rounded-xl bg-[#8A1428] hover:bg-[#6F1020] text-white font-semibold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>Siguiente Paso</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinishAndDownload}
              disabled={compiling}
              className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {compiling ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Compilando y Descargando...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Finalizar y Descargar .h5p</span>
                </>
              )}
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
