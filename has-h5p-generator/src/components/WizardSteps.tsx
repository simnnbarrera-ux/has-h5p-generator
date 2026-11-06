"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  Sparkles,
  Layers,
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
  CheckCircle2,
  BookOpen,
  Printer,
} from "lucide-react";
import {
  H5P_ACTIVITY_CATALOG,
  EDGE_NEURAL_VOICES,
  H5P_FONT_OPTIONS,
  getPresentationTemplate,
  findSlideLayout,
} from "@/lib/h5p-catalog";
import { getUaoTemplate } from "@/lib/uao-template-catalog";
import {
  HasProjectSpec,
  HasSlideSpec,
  generatePh5pPythonScript,
  generateMoodleBookJson,
} from "@/lib/h5p-engine";
import TiltCard from "./TiltCard";
import PresentationTemplateGallery from "./PresentationTemplateGallery";
import LiveSlidePreview from "./LiveSlidePreview";
import { apiFetch } from "@/lib/api-client";
import { buildH5pViewerUrl } from "@/lib/h5p-preview-url";
import { supportsVisualSpace } from "@/lib/visual-space";

interface WizardStepsProps {
  spec: HasProjectSpec;
  setSpec: React.Dispatch<React.SetStateAction<HasProjectSpec>>;
  initialStep?: 1 | 2 | 3 | 4 | 5;
  onStepChange?: (step: 1 | 2 | 3 | 4 | 5) => void;
  onCompile: (overrideSpec?: HasProjectSpec) => Promise<any>;
  compiling: boolean;
  compilationResult: any;
}

const MAX_REFORMULATION_SLIDES = 24;

export default function WizardSteps({
  spec,
  setSpec,
  initialStep = 1,
  onStepChange,
  onCompile,
  compiling,
  compilationResult,
}: WizardStepsProps) {
  const [localCurrentStep, setLocalCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(initialStep);
  const currentStep = onStepChange ? initialStep : localCurrentStep;
  const setCurrentStep = (step: 1 | 2 | 3 | 4 | 5) => {
    setLocalCurrentStep(step);
    currentStepRef.current = step;
    routeStepHandledRef.current = step;
    step5AuthorizedProjectRef.current = step === 5 ? spec.id : null;
    onStepChange?.(step);
  };

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [previewRequestState, setPreviewRequestState] = useState<{
    projectId: string;
    status: "loading" | "error" | "ready";
    error?: string;
  } | null>(null);
  const previewAccessLoading = previewRequestState?.projectId === spec.id && previewRequestState.status === "loading";
  const previewAccessError = previewRequestState?.projectId === spec.id && previewRequestState.status === "error"
    ? previewRequestState.error || "No se pudo autorizar la vista previa."
    : null;
  const previewReady = previewRequestState?.projectId === spec.id && previewRequestState.status === "ready";
  const previewAuthSequenceRef = useRef(0);
  const currentSpecIdRef = useRef(spec.id);
  const currentStepRef = useRef(currentStep);
  const routeStepHandledRef = useRef<1 | 2 | 3 | 4 | 5 | null>(null);
  const step5AuthorizedProjectRef = useRef<string | null>(null);
  const authorizePreviewRef = useRef<(projectId: string) => Promise<boolean>>(async () => false);
  useEffect(() => {
    currentSpecIdRef.current = spec.id;
  }, [spec.id]);
  useEffect(() => {
    currentStepRef.current = currentStep;
  }, [currentStep]);

  // Preview key for iframe dynamic reloads
  const [previewKey, setPreviewKey] = useState<number>(0);
  const [reformulationSlideCount, setReformulationSlideCount] = useState(
    Math.min(spec.slides.length, MAX_REFORMULATION_SLIDES)
  );
  const [reformulationDifficulty, setReformulationDifficulty] = useState("intermedio");
  const [reformulationFocus, setReformulationFocus] = useState("mixto");
  const [reformulationDensity, setReformulationDensity] = useState("equilibrada");
  const [reformulationInstruction, setReformulationInstruction] = useState("");
  const [reformulatingPresentation, setReformulatingPresentation] = useState(false);
  const [hasReformulatedPresentation, setHasReformulatedPresentation] = useState(false);
  const [hasStep4DefaultSpec, setHasStep4DefaultSpec] = useState(false);
  const step4DefaultSpecRef = useRef<{ projectId: string; spec: HasProjectSpec } | null>(null);

  useEffect(() => {
    if (initialStep !== 4 || step4DefaultSpecRef.current?.projectId === spec.id) return;
    step4DefaultSpecRef.current = { projectId: spec.id, spec: structuredClone(spec) };
    setReformulationSlideCount(Math.min(spec.slides.length, MAX_REFORMULATION_SLIDES));
    setHasReformulatedPresentation(false);
    setHasStep4DefaultSpec(true);
  }, [initialStep, spec]);

  const showToast = (message: string) => {
    setToastMessage(message);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const authorizePreview = useCallback(async (projectId: string): Promise<boolean> => {
    const requestId = ++previewAuthSequenceRef.current;
    setPreviewRequestState({ projectId, status: "loading" });

    try {
      const response = await apiFetch("/api/h5p/preview-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      const data: { error?: string } = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "No se pudo autorizar la vista previa.");
      }
      if (requestId !== previewAuthSequenceRef.current || currentSpecIdRef.current !== projectId) {
        if (currentStepRef.current === 5 && currentSpecIdRef.current !== projectId) {
          void authorizePreviewRef.current(currentSpecIdRef.current);
        }
        return false;
      }
      const cookieCheck = await fetch(
        `/api/h5p-preview/${encodeURIComponent(projectId)}?__preview_check=1`,
        { credentials: "same-origin", cache: "no-store" }
      );
      const checkData: { error?: string } = await cookieCheck.json().catch(() => ({}));
      if (!cookieCheck.ok) {
        throw new Error(checkData.error || "El navegador no conservó la autorización de vista previa.");
      }
      if (requestId !== previewAuthSequenceRef.current || currentSpecIdRef.current !== projectId) {
        if (currentStepRef.current === 5 && currentSpecIdRef.current !== projectId) {
          void authorizePreviewRef.current(currentSpecIdRef.current);
        }
        return false;
      }
      setPreviewRequestState({ projectId, status: "ready" });
      return true;
    } catch (error: unknown) {
      if (requestId !== previewAuthSequenceRef.current || currentSpecIdRef.current !== projectId) {
        if (currentStepRef.current === 5 && currentSpecIdRef.current !== projectId) {
          void authorizePreviewRef.current(currentSpecIdRef.current);
        }
        return false;
      }
      setPreviewRequestState({
        projectId,
        status: "error",
        error: error instanceof Error ? error.message : "No se pudo autorizar la vista previa.",
      });
      return false;
    }
  }, []);

  useEffect(() => {
    authorizePreviewRef.current = authorizePreview;
  }, [authorizePreview]);

  useEffect(() => {
    if (initialStep !== 5) {
      routeStepHandledRef.current = initialStep;
      step5AuthorizedProjectRef.current = null;
      return;
    }
    const enteringStepFive = routeStepHandledRef.current !== 5;
    routeStepHandledRef.current = 5;
    if (!enteringStepFive && step5AuthorizedProjectRef.current === spec.id) return;
    step5AuthorizedProjectRef.current = spec.id;
    const timer = window.setTimeout(() => {
      void authorizePreview(spec.id).then((authorized) => {
        if (authorized && currentSpecIdRef.current === spec.id) {
          setPreviewKey((previous) => previous + 1);
        }
      });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [authorizePreview, initialStep, spec.id]);

  useEffect(() => {
    if (currentStep !== 5) return;
    const handlePreviewMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || !event.data || typeof event.data !== "object") return;
      if (
        event.data.type !== "has-h5p-preview:reauthorize" ||
        event.data.projectId !== spec.id
      ) return;
      void authorizePreview(spec.id).then((authorized) => {
        if (authorized) setPreviewKey((previous) => previous + 1);
      });
    };
    window.addEventListener("message", handlePreviewMessage);
    return () => window.removeEventListener("message", handlePreviewMessage);
  }, [authorizePreview, currentStep, spec.id]);

  // Dynamic download trigger for .h5p
  const triggerH5pDownload = async (customDownloadUrl?: string) => {
    const filename = `${spec.id}.h5p`;
    const sameOriginUrl = `/api/h5p/download?id=${encodeURIComponent(spec.id)}`;
    const targetUrl = customDownloadUrl?.startsWith("/api/h5p/download")
      ? customDownloadUrl
      : sameOriginUrl;

    try {
      const response = await apiFetch(targetUrl, { cache: "no-store" });
      if (!response.ok) {
        return false;
      }
      const blob = await response.blob();
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
    } catch {
      return false;
    }
  };

  // Finalizar y Descargar .h5p action
  const handleFinishAndDownload = async () => {
    let downloadUrl = compilationResult?.downloadUrl;

    if (!compilationResult) {
      const res = await onCompile(spec);
      if (res) {
        downloadUrl = res.downloadUrl;
        setPreviewKey((previous) => previous + 1);
      }
    }

    if (!downloadUrl) {
      showToast("No se pudo obtener la URL de descarga del paquete H5P.");
      return;
    }

    const downloaded = await triggerH5pDownload(downloadUrl);
    showToast(
      downloaded
        ? "¡Paquete .h5p descargado exitosamente! Listo para Moodle UAO"
        : "No se pudo descargar el paquete H5P. Verifica tu sesión e inténtalo de nuevo."
    );
  };

  // Recompilar paquete
  const handleRecompilePackage = async () => {
    const res = await onCompile(spec);
    if (res?.success) {
      setPreviewKey((previous) => previous + 1);
      await authorizePreview(res.project?.id || spec.id);
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

  const handlePrintPdf = useCallback(() => {
    const frame = document.querySelector('iframe[title="Reproductor H5P en vivo"]') as HTMLIFrameElement | null;
    if (frame && frame.contentWindow) {
      frame.contentWindow.postMessage("print-h5p-pdf", "*");
      showToast("Preparando todas las diapositivas para impresión o guardado en PDF...");
    } else {
      window.print();
    }
  }, [showToast]);

  // Step change handler
  const handleStepChange = async (targetStep: 1 | 2 | 3 | 4 | 5) => {
    if (targetStep === 4 && step4DefaultSpecRef.current?.projectId !== spec.id) {
      step4DefaultSpecRef.current = { projectId: spec.id, spec: structuredClone(spec) };
      setReformulationSlideCount(Math.min(spec.slides.length, MAX_REFORMULATION_SLIDES));
      setHasReformulatedPresentation(false);
      setHasStep4DefaultSpec(true);
    }
    if (targetStep === 5 && currentStep !== 5) {
      setCurrentStep(5);
      const res = await onCompile(spec);
      if (res?.success) {
        setPreviewKey((previous) => previous + 1);
        await authorizePreview(res.project?.id || spec.id);
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
  const [selectedSlideIndexState, setSelectedSlideIndex] = useState(0);
  const selectedSlideIndex = Math.max(0, Math.min(selectedSlideIndexState, spec.slides.length - 1));

  const updateSelectedSlide = (patch: Partial<HasSlideSpec>) => {
    setSpec((previous) => ({
      ...previous,
      slides: previous.slides.map((slide, index) => index === selectedSlideIndex
        ? { ...slide, ...patch }
        : slide),
    }));
  };

  // Activity filter state in Step 2
  const [activityCategory, setActivityCategory] = useState<string>("all");

  const handleSelectTemplate = (templateId: string) => {
    const chosenTmpl = getUaoTemplate(templateId);
    if (!chosenTmpl) return;
    setSpec((prev) => {
      const previousTemplate = getUaoTemplate(prev.selectedTemplateId);
      const hasCustomFont =
        Boolean(prev.fontFamily) &&
        prev.fontFamily !== previousTemplate?.theme.recommendedFont;
      return {
        ...prev,
        selectedTemplateId: chosenTmpl.id,
        fontFamily: hasCustomFont
          ? prev.fontFamily
          : chosenTmpl.theme.recommendedFont,
      };
    });
    showToast(`Paleta "${chosenTmpl.theme.shortName}" seleccionada.`);
  };

  const handleSelectBaseTemplate = (templateId: string) => {
    const chosenTemplate = getUaoTemplate(templateId);
    if (chosenTemplate?.generationMode !== "h5p-base") return;
    setSpec((previous) => ({ ...previous, baseTemplateId: templateId }));
    showToast(`Base H5P "${chosenTemplate.name}" seleccionada; la paleta se conserva.`);
  };

  const handleSelectSlideComposition = (compositionId: string) => {
    const chosenComposition = getUaoTemplate(compositionId);
    if (chosenComposition?.group !== "composicion") return;
    setSpec((previous) => ({
      ...previous,
      slides: previous.slides.map((slide, index) => index === selectedSlideIndex
        ? { ...slide, compositionId }
        : slide),
    }));
    showToast(`Composición "${chosenComposition.theme.shortName}" aplicada a esta diapositiva.`);
  };

  const handleApplyCompositionToAll = () => {
    const compositionId = spec.slides[selectedSlideIndex]?.compositionId;
    if (!compositionId) {
      showToast("Elige una composición para esta diapositiva antes de aplicarla a todas.");
      return;
    }
    setSpec((previous) => ({
      ...previous,
      slides: previous.slides.map((slide) => ({ ...slide, compositionId })),
    }));
    showToast("La composición actual se aplicó a todas las diapositivas.");
  };

  /* ---------- Reconocimiento de voz para profesores ---------- */
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
      fd.append("file", blob, "dictation.webm");

      const res = await apiFetch("/api/stt", { method: "POST", body: fd });
      const data: { text?: string; error?: string } = await res
        .json()
        .catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Error en reconocimiento de voz.");
      }
      if (typeof data.text === "string" && data.text) {
        const transcript = data.text;
        setCopilotPrompt((prev) => (prev ? prev + " " + transcript : transcript));
      }
    } catch (error: unknown) {
      alert(
        "Error enviando audio para reconocimiento: " +
          (error instanceof Error ? error.message : "Error desconocido")
      );
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
      const res = await apiFetch("/api/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "chat",
          messages: newMsgs,
        }),
      });
      const data: { reply?: string; error?: string } = await res
        .json()
        .catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Error en el asistente de autoría.");
      }
      if (data.reply) {
        setCopilotMessages([
          ...newMsgs,
          { role: "assistant" as const, content: data.reply },
        ]);
      }
    } catch (error: unknown) {
      console.error("Error en Copilot:", error);
      showToast(error instanceof Error ? error.message : "No fue posible usar el asistente.");
    } finally {
      setCopilotLoading(false);
    }
  };

  /* ---------- Locución Académica (CO) Voice Audition ---------- */
  const handleTestVoice = async (voiceId: string) => {
    setPreviewingVoice(voiceId);
    try {
      const res = await apiFetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `Hola, soy la voz institucional para tu recurso educativo interactivo en el Campus Digital de la Universidad Autónoma de Occidente.`,
          voice: voiceId,
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
    if (spec.slides.length >= 40) {
      showToast("El proyecto ya alcanzó el máximo de 40 diapositivas.");
      return;
    }
    setSvgGenerating(true);
    try {
      const res = await apiFetch("/api/svg-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: svgPrompt.trim() }),
        signal: AbortSignal.timeout(40_000),
      });
      const data: {
        customSvg?: HasSlideSpec["customSvg"];
        altText?: string;
        error?: string;
      } = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Error generando SVG.");
      }
      if (!data.customSvg) throw new Error("La IA no devolvió los datos del diagrama. Inténtalo de nuevo.");
      const newSlideIndex = spec.slides.length;
      const titleSlug = data.customSvg.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 24) || "svg";
      const existingSlideIds = new Set(spec.slides.map((slide) => slide.id));
      let uniqueSlideId = `diagram-${titleSlug}-${newSlideIndex + 1}`;
      let idSuffix = 2;
      while (existingSlideIds.has(uniqueSlideId)) {
        uniqueSlideId = `diagram-${titleSlug}-${newSlideIndex + 1}-${idSuffix}`;
        idSuffix += 1;
      }
      const newSlide: HasSlideSpec = {
        id: uniqueSlideId,
        templateSlide: 9,
        menuTitle: data.customSvg.title.slice(0, 35),
        titleBlack: data.customSvg.title,
        subtitle: data.customSvg.subtitle,
        paragraphs: data.customSvg.highlights.slice(0, 2),
        compositionId: spec.slides[selectedSlideIndex]?.compositionId || "composicion-01",
        customSvg: data.customSvg,
        imagePendingDescription: data.altText || `${data.customSvg.title}: ${data.customSvg.subtitle}`,
        reserveVisualSpace: true,
      };
      setSpec((previous) => ({ ...previous, slides: [...previous.slides, newSlide] }));
      setSelectedSlideIndex(newSlideIndex);
      setReformulationSlideCount(Math.min(newSlideIndex + 1, MAX_REFORMULATION_SLIDES));
      setSvgPrompt("");
      showToast("Diagrama agregado como una nueva diapositiva visual. Revísalo en el Paso 4.");
    } catch (error: unknown) {
      console.error("Error generando SVG:", error);
      showToast(error instanceof Error ? error.message : "No fue posible generar el diagrama.");
    } finally {
      setSvgGenerating(false);
    }
  };

  const handleReformulatePresentation = async () => {
    if (reformulatingPresentation) return;
    if (
      !step4DefaultSpecRef.current ||
      step4DefaultSpecRef.current.projectId !== spec.id
    ) {
      step4DefaultSpecRef.current = { projectId: spec.id, spec: structuredClone(spec) };
      setHasStep4DefaultSpec(true);
    }

    setReformulatingPresentation(true);
    try {
      const res = await apiFetch("/api/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "reformulate",
          spec,
          slideCount: reformulationSlideCount,
          difficulty: reformulationDifficulty,
          focus: reformulationFocus,
          density: reformulationDensity,
          prompt: reformulationInstruction.trim(),
        }),
      });
      const data: { spec?: HasProjectSpec; error?: string } = await res
        .json()
        .catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "No fue posible reformular la presentación.");
      }
      if (!data.spec || data.spec.slides.length !== reformulationSlideCount) {
        throw new Error("La IA no devolvió la cantidad de diapositivas solicitada.");
      }

      setSpec(data.spec);
      setSelectedSlideIndex(0);
      setHasReformulatedPresentation(true);
      showToast(`Presentación reformulada: ${data.spec.slides.length} diapositivas. Revísala antes de compilar.`);
    } catch (error: unknown) {
      console.error("Error reformulando la presentación:", error);
      showToast(error instanceof Error ? error.message : "No fue posible reformular la presentación.");
    } finally {
      setReformulatingPresentation(false);
    }
  };

  const handleRestoreDefaultFormulation = () => {
    const snapshot = step4DefaultSpecRef.current;
    if (!snapshot || snapshot.projectId !== spec.id) {
      showToast("No se encontró la formulación inicial de este proyecto.");
      return;
    }
    setSpec(structuredClone(snapshot.spec));
    setReformulationSlideCount(Math.min(snapshot.spec.slides.length, MAX_REFORMULATION_SLIDES));
    setReformulationDifficulty("intermedio");
    setReformulationFocus("mixto");
    setReformulationDensity("equilibrada");
    setReformulationInstruction("");
    setSelectedSlideIndex(0);
    setHasReformulatedPresentation(false);
    showToast("Se restauró la formulación con la que entraste al Paso 4.");
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
                  Regla UAO: Si la actividad es 0, se incluye la guía interactiva &apos;¿Cómo navegar?&apos;.
                </span>
              </div>
            </div>

            <PresentationTemplateGallery
              key={`palette-${spec.id}`}
              selectedTemplateId={spec.selectedTemplateId}
              onSelect={handleSelectTemplate}
              visibleGroups={["facultad", "marca"]}
              mode="palette"
              heading="Paso 1 · Colores e identidad institucional"
              description="Elige entre diez paletas de Facultad o Marca UAO. Esto solo cambia colores y tipografía; la base H5P y la organización visual se eligen en el Paso 4."
              actionLabel="Usar esta paleta"
              emptySelectionMessage="Elige una paleta de Facultad o Marca UAO. La composición de las diapositivas no cambia al escoger colores."
            />

            {/* Prompt & STT Dictation Box */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#8A1428]" />
                  <span>Dictado por voz para profesores o prompt pedagógico</span>
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
                <span>Generador de diagramas técnicos vectoriales con IA</span>
              </label>
              <p className="text-[11px] leading-relaxed text-slate-600">
                Describe un flujo, concepto, comparación, línea de tiempo o gráfico con datos. El resultado se agrega como una nueva diapositiva visual que puedes editar en el Paso 4.
              </p>

              <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
                <input
                  type="text"
                  value={svgPrompt}
                  onChange={(e) => setSvgPrompt(e.target.value)}
                  aria-label="Describe el diagrama técnico que quieres generar"
                  placeholder="Ej. Flujo de validación de una solicitud; velocidad constante de 3 m/s entre 0 y 10 s..."
                  className="flex-1 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0099E6]/30 focus:border-[#0099E6]"
                />
                <button
                  type="button"
                  onClick={handleGenerateSvgAi}
                  disabled={svgGenerating || !svgPrompt.trim() || spec.slides.length >= 40}
                  className="px-4 py-2.5 bg-[#0099E6] hover:bg-[#007acc] text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {svgGenerating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  <span>{svgGenerating ? "Generando…" : "Generar diagrama"}</span>
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
        <div
          className={`space-y-6 ${reformulatingPresentation ? "pointer-events-none opacity-70" : ""}`}
          aria-busy={reformulatingPresentation}
        >
          <section className="rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-rose-50 p-5 shadow-sm space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-800">
                  {reformulatingPresentation ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Reformulación de presentación</h3>
                  <p className="mt-1 max-w-3xl text-xs leading-relaxed text-slate-600">
                    Ajusta la estructura pedagógica y la cantidad de diapositivas. La guía de navegación, si está activa, se agrega aparte. La versión por defecto es la presentación con la que entraste a este paso.
                  </p>
                  {hasReformulatedPresentation && (
                    <p className="mt-1 text-[11px] font-semibold text-violet-800" role="status">
                      La IA aplicó cambios; revisa el contenido y las interacciones antes de compilar.
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={handleRestoreDefaultFormulation}
                disabled={!hasStep4DefaultSpec || reformulatingPresentation}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Volver a formulación por defecto
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <label className="space-y-1 text-xs font-semibold text-slate-700">
                <span>Número de diapositivas</span>
                <select
                  value={reformulationSlideCount}
                  onChange={(event) => setReformulationSlideCount(Number(event.target.value))}
                  disabled={reformulatingPresentation}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 disabled:opacity-60"
                >
                  {Array.from({ length: MAX_REFORMULATION_SLIDES }, (_, index) => index + 1).map((count) => (
                    <option key={count} value={count}>{count} {count === 1 ? "diapositiva" : "diapositivas"}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-1 text-xs font-semibold text-slate-700">
                <span>Nivel de dificultad</span>
                <select
                  value={reformulationDifficulty}
                  onChange={(event) => setReformulationDifficulty(event.target.value)}
                  disabled={reformulatingPresentation}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 disabled:opacity-60"
                >
                  <option value="introductorio">Inicial</option>
                  <option value="intermedio">Intermedio</option>
                  <option value="avanzado">Avanzado</option>
                </select>
              </label>
              <label className="space-y-1 text-xs font-semibold text-slate-700">
                <span>Enfoque pedagógico</span>
                <select
                  value={reformulationFocus}
                  onChange={(event) => setReformulationFocus(event.target.value)}
                  disabled={reformulatingPresentation}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 disabled:opacity-60"
                >
                  <option value="conceptual">Conceptual</option>
                  <option value="aplicado">Aplicado</option>
                  <option value="evaluativo">Evaluativo</option>
                  <option value="mixto">Mixto</option>
                </select>
              </label>
              <label className="space-y-1 text-xs font-semibold text-slate-700">
                <span>Densidad del contenido</span>
                <select
                  value={reformulationDensity}
                  onChange={(event) => setReformulationDensity(event.target.value)}
                  disabled={reformulatingPresentation}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 disabled:opacity-60"
                >
                  <option value="sintetica">Sintética</option>
                  <option value="equilibrada">Equilibrada</option>
                  <option value="detallada">Detallada</option>
                </select>
              </label>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto] md:items-end">
              <label className="space-y-1 text-xs font-semibold text-slate-700">
                <span>Indicaciones adicionales (opcional)</span>
                <textarea
                  value={reformulationInstruction}
                  onChange={(event) => setReformulationInstruction(event.target.value.slice(0, 1_000))}
                  maxLength={1_000}
                  rows={2}
                  placeholder="Ej. Incluye un caso colombiano y cierra con una pregunta de reflexión."
                  disabled={reformulatingPresentation}
                  className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 disabled:opacity-60"
                />
              </label>
              <button
                type="button"
                onClick={handleReformulatePresentation}
                disabled={reformulatingPresentation || reformulationSlideCount < 1 || reformulationSlideCount > MAX_REFORMULATION_SLIDES}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-violet-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {reformulatingPresentation ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {reformulatingPresentation ? "Reformulando…" : "Reformular con IA"}
              </button>
            </div>
          </section>

          <details className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 px-5 py-4 text-sm font-bold text-slate-900 marker:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8A1428]/30">
              <span>Base global del paquete H5P · 5 plantillas de Facultad</span>
              <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-[#8A1428]">
                {getUaoTemplate(spec.baseTemplateId)?.name || "Facultad 1"}
              </span>
            </summary>
            <div className="border-t border-slate-100 px-5 pb-5 pt-2">
              <PresentationTemplateGallery
                key={`base-${spec.id}`}
                selectedTemplateId={spec.baseTemplateId || "facultad-1"}
                onSelect={handleSelectBaseTemplate}
                visibleGroups={["facultad"]}
                mode="base"
                heading="Elige la plantilla base de Facultad"
                description="Esta selección define el paquete H5P completo. No cambia la paleta elegida en el Paso 1 ni la composición individual de cada diapositiva."
                actionLabel="Usar como base global"
              />
            </div>
          </details>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <aside className="self-start rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-4">
              <div className="mb-3 flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-xs font-bold text-slate-900">Diapositivas</h3>
                  <p className="mt-0.5 text-[10px] text-slate-500">{spec.slides.length} títulos en esta presentación</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (spec.slides.length >= MAX_REFORMULATION_SLIDES) return;
                    const newSlide: HasSlideSpec = {
                      id: `slide-${Date.now().toString().slice(-6)}`,
                      templateSlide: 4,
                      menuTitle: "Nueva diapositiva",
                      titleBlack: "Nuevo concepto",
                      titleAccent: "Clave",
                      subtitle: "Subtítulo descriptivo",
                      paragraphs: ["Escribe el contenido aquí."],
                      compositionId: "composicion-01",
                      reserveVisualSpace: false,
                    };
                    setSpec((previous) => ({ ...previous, slides: [...previous.slides, newSlide] }));
                    setReformulationSlideCount(Math.min(spec.slides.length + 1, MAX_REFORMULATION_SLIDES));
                    setSelectedSlideIndex(spec.slides.length);
                  }}
                  disabled={spec.slides.length >= MAX_REFORMULATION_SLIDES}
                  className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-rose-50 px-2.5 py-2 text-xs font-semibold text-[#8A1428] hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Plus className="h-3.5 w-3.5" /> Añadir
                </button>
              </div>
              <nav aria-label="Títulos de las diapositivas" className="max-h-[620px] space-y-1.5 overflow-y-auto pr-1">
                {spec.slides.map((slide, index) => {
                  const isSelected = selectedSlideIndex === index;
                  return (
                    <button
                      key={slide.id || index}
                      type="button"
                      aria-current={isSelected ? "true" : undefined}
                      onClick={() => setSelectedSlideIndex(index)}
                      className={`flex w-full items-center gap-2 rounded-xl border p-2.5 text-left text-xs transition ${
                        isSelected
                          ? "border-[#8A1428] bg-rose-50/70 font-bold text-slate-900"
                          : "border-slate-100 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold ${isSelected ? "bg-[#8A1428] text-white" : "bg-slate-100 text-slate-600"}`}>
                        {index + 1}
                      </span>
                      <span className="min-w-0 flex-1 truncate">
                        {slide.menuTitle || `Diapositiva ${index + 1}`}
                      </span>
                    </button>
                  );
                })}
              </nav>
            </aside>

            <div className="min-w-0 space-y-5 lg:col-span-8">
            <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedSlideIndex((index) => Math.max(0, index - 1))}
                  disabled={selectedSlideIndex <= 0}
                  className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Diapositiva anterior"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <label className="min-w-0 flex-1">
                  <span className="sr-only">Diapositiva que quieres editar</span>
                  <select
                    value={selectedSlideIndex}
                    onChange={(event) => setSelectedSlideIndex(Number(event.target.value))}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-[#8A1428] focus:outline-none focus:ring-2 focus:ring-[#8A1428]/20"
                  >
                    {spec.slides.map((slide, index) => (
                      <option key={slide.id || index} value={index}>
                        Diapositiva {index + 1} · {slide.menuTitle || "Sin título"}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  onClick={() => setSelectedSlideIndex((index) => Math.min(spec.slides.length - 1, index + 1))}
                  disabled={selectedSlideIndex >= spec.slides.length - 1}
                  className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Diapositiva siguiente"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
                <span className="hidden shrink-0 text-[11px] font-semibold text-slate-500 sm:inline">
                  {selectedSlideIndex + 1} / {spec.slides.length}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (spec.slides.length <= 1) return;
                    const filtered = spec.slides.filter((_, index) => index !== selectedSlideIndex);
                    setSpec((previous) => ({ ...previous, slides: previous.slides.filter((_, index) => index !== selectedSlideIndex) }));
                    setReformulationSlideCount(Math.min(filtered.length, MAX_REFORMULATION_SLIDES));
                    setSelectedSlideIndex(Math.max(0, selectedSlideIndex - 1));
                  }}
                  disabled={spec.slides.length <= 1}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Eliminar
                </button>
              </div>
            </section>

            {/* Editor de la diapositiva seleccionada */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
              {spec.slides[selectedSlideIndex] ? (
                <>
                  <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3">
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A1428]">
                        Editando diapositiva {selectedSlideIndex + 1}
                      </span>
                      <h3 className="truncate text-base font-bold text-slate-900">
                        {spec.slides[selectedSlideIndex].menuTitle || "Sin título"}
                      </h3>
                    </div>
                    <span className="hidden shrink-0 rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-semibold text-slate-600 sm:inline">
                      {findSlideLayout(spec.slides[selectedSlideIndex].templateSlide).name}
                    </span>
                  </div>

                  {/* Banner de paleta institucional activa */}
                  {(() => {
                    const activeDesign =
                      getUaoTemplate(spec.selectedTemplateId)?.theme ||
                      getPresentationTemplate(spec.templateId);
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
                              Paleta global: {activeDesign.name}
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
                          Cambiar paleta (Paso 1)
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
                          <div>
                            <span className="font-bold text-slate-900">
                              {currentLayout.name}
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

                  {/* Per-slide image-space reservation */}
                  {(() => {
                    const currentSlide = spec.slides[selectedSlideIndex];
                    const supportsVisualSlot = supportsVisualSpace(currentSlide.templateSlide);
                    const hasVisualAsset = Boolean(
                      currentSlide.svgDiagramId ||
                      currentSlide.customSvg ||
                      currentSlide.imagePendingDescription
                    );
                    const reserveVisualSpace = currentSlide.reserveVisualSpace ?? hasVisualAsset;
                    return (
                      <section className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="max-w-2xl">
                            <h4 className="text-xs font-bold text-slate-900">Espacio para imagen en esta diapositiva</h4>
                            <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                              Este control reserva o libera una columna visual; no genera una imagen. Si no agregaste un diagrama o imagen, la columna queda vacía.
                            </p>
                          </div>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={reserveVisualSpace}
                            aria-label="Reservar espacio para imagen en esta diapositiva"
                            disabled={!supportsVisualSlot}
                            onClick={() => setSpec((previous) => ({
                              ...previous,
                              slides: previous.slides.map((slide, index) => index === selectedSlideIndex
                                ? { ...slide, reserveVisualSpace: !reserveVisualSpace }
                                : slide),
                            }))}
                            className={`inline-flex shrink-0 items-center gap-3 rounded-xl border px-3 py-2 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                              reserveVisualSpace
                                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                                : "border-slate-200 bg-slate-50 text-slate-700"
                            }`}
                          >
                            <span className={`relative h-6 w-11 rounded-full transition ${reserveVisualSpace ? "bg-emerald-600" : "bg-slate-300"}`} aria-hidden="true">
                              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${reserveVisualSpace ? "translate-x-[22px]" : "translate-x-0.5"}`} />
                            </span>
                            <span>{reserveVisualSpace ? "Sí, reservar" : "No, usar ancho completo"}</span>
                          </button>
                        </div>
                        {!supportsVisualSlot && (
                          <p className="mt-2 text-[11px] text-amber-800" role="note">
                            Esta composición no tiene una zona visual configurable. Para reservar una columna visual, usa el layout Estación con esquema o Debate.
                          </p>
                        )}
                      </section>
                    );
                  })()}

                  <details className="rounded-2xl border border-slate-200 bg-white p-4">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-xs font-bold text-slate-900">
                      <span>Composición visual de esta diapositiva</span>
                      <span className="rounded-full bg-rose-50 px-3 py-1 text-[11px] font-bold text-[#8A1428]">
                        {getUaoTemplate(spec.slides[selectedSlideIndex]?.compositionId)?.theme.shortName || "Elegir composición"}
                      </span>
                    </summary>
                    <div className="mt-3 space-y-3 border-t border-slate-100 pt-3">
                      <p className="text-[11px] leading-relaxed text-slate-600">
                        Estas diez opciones cambian la distribución real —bloques, tarjetas, contornos, pestañas y otras formas— usando los layouts del ZIP. No son solo muestras de color.
                      </p>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={handleApplyCompositionToAll}
                          disabled={!spec.slides[selectedSlideIndex]?.compositionId}
                          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Aplicar esta composición a todas
                        </button>
                      </div>
                      <PresentationTemplateGallery
                        key={`composition-${spec.id}-${spec.slides[selectedSlideIndex]?.id}`}
                        selectedTemplateId={spec.slides[selectedSlideIndex]?.compositionId}
                        onSelect={handleSelectSlideComposition}
                        visibleGroups={["composicion"]}
                        mode="composition"
                        heading="Composiciones incluidas en el ZIP"
                        description="Cada vista previa corresponde a uno de los diez paquetes H5P de composición entregados. Al elegirla, se copia su capa visual segura al layout equivalente de esta diapositiva."
                        actionLabel="Aplicar a esta diapositiva"
                        emptySelectionMessage="Esta diapositiva todavía no tiene una composición del ZIP. Elige una tarjeta para aplicarla."
                      />
                    </div>
                  </details>

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
                        onChange={(e) => updateSelectedSlide({ menuTitle: e.target.value })}
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
                        onChange={(e) => updateSelectedSlide({ subtitle: e.target.value })}
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
                        onChange={(e) => updateSelectedSlide({ titleBlack: e.target.value })}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Título de Acento (Segunda Parte)
                      </label>
                      <input
                        type="text"
                        value={spec.slides[selectedSlideIndex].titleAccent || ""}
                        onChange={(e) => updateSelectedSlide({ titleAccent: e.target.value })}
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
                      onChange={(e) => updateSelectedSlide({
                        paragraphs: e.target.value.split("\n\n").map((p) => p.trim()).filter(Boolean),
                      })}
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
                      onChange={(e) => updateSelectedSlide({ highlightBox: e.target.value })}
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
                  Elige una diapositiva en el selector superior.
                </div>
              )}
            </div>
            {spec.slides[selectedSlideIndex] && (
              <LiveSlidePreview
                spec={spec}
                slide={spec.slides[selectedSlideIndex]}
                slideNumber={selectedSlideIndex + 1}
              />
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
                disabled={compiling || previewAccessLoading}
                className="px-5 py-2.5 rounded-xl bg-[#8A1428] hover:bg-[#6F1020] text-white font-bold text-xs shadow-md transition flex items-center gap-2 disabled:opacity-50 shrink-0 cursor-pointer"
              >
                {compiling || previewAccessLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{compiling ? "Compilando paquete..." : "Autorizando preview..."}</span>
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
              {previewAccessLoading && (
                <div className="w-full min-h-[500px] flex items-center justify-center gap-2 text-sm text-slate-500 bg-white">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Autorizando vista previa privada...</span>
                </div>
              )}
              {!previewAccessLoading && previewAccessError && (
                <div className="flex min-h-[500px] w-full flex-col items-center justify-center gap-4 bg-red-50 px-6 text-center text-sm text-red-700">
                  <p>{previewAccessError}</p>
                  <button
                    type="button"
                    onClick={() => void authorizePreview(spec.id).then((authorized) => {
                      if (authorized) setPreviewKey((previous) => previous + 1);
                    })}
                    className="rounded-xl bg-[#8A1428] px-4 py-2 text-xs font-bold text-white hover:bg-[#6F1020]"
                  >
                    Reautorizar vista previa
                  </button>
                </div>
              )}
              {compiling && !previewAccessLoading && !previewReady && (
                <div className="flex min-h-[500px] w-full items-center justify-center gap-2 bg-white text-sm text-slate-600">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Compilando el paquete H5P para la vista previa...</span>
                </div>
              )}
              {!compiling && !previewAccessLoading && !previewAccessError && !previewReady && (
                <div className="flex min-h-[500px] w-full flex-col items-center justify-center gap-3 bg-white px-6 text-center">
                  <p className="text-sm font-semibold text-slate-800">El paquete aún no está cargado en esta sesión.</p>
                  <p className="max-w-lg text-xs text-slate-500">Compila o recompila el H5P para guardar el recurso y activar el reproductor privado.</p>
                  <button
                    type="button"
                    onClick={handleRecompilePackage}
                    disabled={compiling}
                    className="rounded-xl bg-[#8A1428] px-4 py-2 text-xs font-bold text-white hover:bg-[#6F1020] disabled:opacity-50"
                  >
                    Compilar y abrir preview
                  </button>
                </div>
              )}
              {!previewAccessLoading && !previewAccessError && previewReady && (
                <iframe
                  key={previewKey}
                  src={buildH5pViewerUrl(spec.id, previewKey)}
                  className="w-full h-[72vh] min-h-[500px] max-h-[740px] border-none"
                  title="Reproductor H5P en vivo"
                />
              )}
            </div>

            {/* Downloads strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
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
                onClick={handlePrintPdf}
                disabled={compiling || !previewReady}
                className="p-4 bg-white hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-600 rounded-2xl transition flex items-center justify-between text-left group shadow-sm disabled:opacity-60 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Printer className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-700">
                      Guardar Diapositivas (PDF)
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Impresión horizontal completa
                    </div>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/80 group-hover:bg-emerald-700 group-hover:text-white transition">
                  Imprimir
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
                      Editable con la CLI propia ph5p (EQ-35)
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
