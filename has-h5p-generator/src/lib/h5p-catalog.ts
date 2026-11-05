// =============================================================================
// HAS H5P Generator — Catálogo de Librerías H5P, Layouts Institucionales y Voces
// Basado en la auditoría de Ingeniería Inversa (REA) de fiuao-6-215 y mod_hvp 1.28
// =============================================================================

export interface H5PActivityTypeSpec {
  id: string;
  name: string;
  spanishName: string;
  library: string;
  category:
    | "evaluacion"
    | "visual"
    | "estudio"
    | "multimedia"
    | "produccion"
    | "comunidad";
  templateSlide: number;
  origin: "native_installed" | "community_emulated";
  communityEquivalent?: string;
  description: string;
  pedagogicalUse: string;
  exampleReto11: string;
  badgeColor: string;
}

export const H5P_ACTIVITY_CATALOG: H5PActivityTypeSpec[] = [
  {
    id: "single_choice_set",
    name: "Single Choice Set",
    spanishName: "Cuestionario de Única Respuesta",
    library: "H5P.SingleChoiceSet 1.11",
    category: "evaluacion",
    templateSlide: 25,
    origin: "native_installed",
    description:
      "Serie rápida de preguntas de selección única con retroalimentación inmediata y barra de puntaje.",
    pedagogicalUse: "Componente 'Analiza y responde' para verificar comprensión conceptual.",
    exampleReto11:
      "4 preguntas sobre código ASCII, estándar IEEE-754, racionales representables y estructura de un lenguaje.",
    badgeColor: "#0099E6",
  },
  {
    id: "multi_choice",
    name: "Multiple Choice",
    spanishName: "Selección Múltiple con Retroalimentación",
    library: "H5P.MultiChoice 1.16",
    category: "evaluacion",
    templateSlide: 24,
    origin: "native_installed",
    description:
      "Pregunta con una o varias respuestas correctas y retroalimentación específica por cada opción elegida.",
    pedagogicalUse: "Evaluar discriminación entre propiedades verdaderas y distractores comunes.",
    exampleReto11:
      "Identificar qué propiedades cumplen los números normalizados en IEEE-754 de 32 y 64 bits.",
    badgeColor: "#0099E6",
  },
  {
    id: "drag_text",
    name: "Drag the Words",
    spanishName: "Arrastrar las Palabras",
    library: "H5P.DragText 1.10",
    category: "evaluacion",
    templateSlide: 26,
    origin: "native_installed",
    description:
      "El estudiante arrastra términos o símbolos matemáticos a los huecos correspondientes de un enunciado.",
    pedagogicalUse: "Activación de saberes previos y definición formal de conceptos.",
    exampleReto11:
      "Clasificar conjuntos numéricos (ℕ, ℤ, ℚ, 𝕀, ℝ) y asociar sus definiciones formales en el Paso 1.",
    badgeColor: "#0099E6",
  },
  {
    id: "blanks",
    name: "Fill in the Blanks",
    spanishName: "Completar Espacios (Autocorrección)",
    library: "H5P.Blanks 1.14",
    category: "evaluacion",
    templateSlide: 26,
    origin: "native_installed",
    description:
      "El estudiante escribe directamente valores numéricos, binarios o palabras clave en casillas validables.",
    pedagogicalUse: "Ejercicios procedimentales de cálculo exacto y conversión de bases.",
    exampleReto11:
      "Calcular el bit de signo, el exponente en exceso 127 y los primeros bits de la mantisa de un número real.",
    badgeColor: "#0099E6",
  },
  {
    id: "true_false",
    name: "True/False Question",
    spanishName: "Verdadero o Falso",
    library: "H5P.TrueFalse 1.8",
    category: "evaluacion",
    templateSlide: 27,
    origin: "native_installed",
    description:
      "Pregunta dicotómica ágil para contrastar mitos o errores frecuentes de interpretación.",
    pedagogicalUse: "Verificación rápida de teoremas o límites de representación en máquina.",
    exampleReto11:
      "¿Puede una máquina de 64 bits representar exactamente cualquier número real del intervalo [0,1]?",
    badgeColor: "#0099E6",
  },
  {
    id: "mark_the_words",
    name: "Mark the Words",
    spanishName: "Señalar Palabras / Bits Erróneos",
    library: "H5P.MarkTheWords 1.11",
    category: "evaluacion",
    templateSlide: 26,
    origin: "native_installed",
    description:
      "Permite hacer clic sobre palabras o bloques específicos dentro de un párrafo o trama de datos.",
    pedagogicalUse: "Depuración de algoritmos, detección de errores sintácticos o inspección de tramas.",
    exampleReto11:
      "Identificar los bytes ASCII o bits de paridad/exponente mal codificados en una secuencia binaria.",
    badgeColor: "#0099E6",
  },
  {
    id: "summary",
    name: "Summary",
    spanishName: "Constructor de Resumen Interactivo",
    library: "H5P.Summary 1.10",
    category: "evaluacion",
    templateSlide: 24,
    origin: "native_installed",
    description:
      "El estudiante elige secuencialmente las afirmaciones correctas hasta construir una síntesis completa del tema.",
    pedagogicalUse: "Cierre formativo de cada paso de la ruta de aprendizaje.",
    exampleReto11:
      "Síntesis de la equivalencia entre Máquina de Turing, lenguajes formales y codificación digital.",
    badgeColor: "#0099E6",
  },
  {
    id: "drag_question",
    name: "Drag and Drop Canvas",
    spanishName: "Lienzo Arrastrar y Soltar (Zonas)",
    library: "H5P.DragQuestion 1.15",
    category: "visual",
    templateSlide: 26,
    origin: "native_installed",
    description:
      "Arrastrar tarjetas o etiquetas sobre zonas gráficas específicas de un diagrama de fondo.",
    pedagogicalUse: "Mapeo visual de arquitecturas, registros de hardware y estructuras de datos.",
    exampleReto11:
      "Ubicar los bloques de 1 bit (Signo), 8 bits (Exponente) y 23 bits (Mantisa) sobre la trama IEEE-754.",
    badgeColor: "#8A1428",
  },
  {
    id: "multimedia_choice",
    name: "Multimedia Choice",
    spanishName: "Selección Visual de Diagramas",
    library: "H5P.MultiMediaChoice 0.3",
    category: "visual",
    templateSlide: 24,
    origin: "native_installed",
    description:
      "Opciones de respuesta basadas en imágenes, grafos o esquemas técnicos con soporte de zoom.",
    pedagogicalUse: "Reconocimiento visual de diagramas de transición, circuitos o árboles.",
    exampleReto11:
      "Seleccionar el diagrama de transición correcto para el cabezal de una Máquina de Turing.",
    badgeColor: "#8A1428",
  },
  {
    id: "dialogcards",
    name: "Dialog Cards",
    spanishName: "Flashcards Interactivas",
    library: "H5P.Dialogcards 1.9",
    category: "estudio",
    templateSlide: 23,
    origin: "native_installed",
    description:
      "Tarjetas que giran en 3D con pregunta en el anverso, respuesta en el reverso y modo de repetición espaciada.",
    pedagogicalUse: "Memorización activa de definiciones, protocolos, fórmulas y códigos.",
    exampleReto11:
      "Tarjetas de repaso de arquitectura de computadores, Máquina de Turing, IEEE-754 y tabla ASCII.",
    badgeColor: "#1D5CFF",
  },
  {
    id: "audio_quiz",
    name: "Audio + SingleChoiceSet",
    spanishName: "Cápsula Sonora con Preguntas (Locución Académica)",
    library: "H5P.Audio 1.5 + H5P.SingleChoiceSet 1.11",
    category: "multimedia",
    templateSlide: 28,
    origin: "native_installed",
    description:
      "Integra un reproductor de audio MP3 generado con locución académica institucional junto a un reto de comprensión.",
    pedagogicalUse: "Aprendizaje multimodal auditivo y accesibilidad universal (WCAG).",
    exampleReto11:
      "Explicación narrada sobre cómo pasa un número del infinito continuo al finito discreto en máquina.",
    badgeColor: "#059669",
  },
  {
    id: "interactive_video",
    name: "Interactive Video",
    spanishName: "Video Interactivo con Pausas y Rutas",
    library: "H5P.InteractiveVideo 1.28",
    category: "multimedia",
    templateSlide: 30,
    origin: "native_installed",
    description:
      "Enriquece videos MP4 o de YouTube con preguntas emergentes, etiquetas y bifurcaciones (Crossroads).",
    pedagogicalUse: "Transformar la visualización pasiva de videos en aprendizaje activo.",
    exampleReto11:
      "Video de Computación Cuántica e IEEE-754 con preguntas de control y retroalimentación en momentos clave.",
    badgeColor: "#059669",
  },
  {
    id: "exportable_text_area",
    name: "Exportable Text Area",
    spanishName: "Asistente de Reporte Técnico (Cornell / DocTool)",
    library: "H5P.ExportableTextArea 1.3",
    category: "produccion",
    templateSlide: 11,
    origin: "native_installed",
    communityEquivalent: "H5P.DocumentationTool / H5P.Cornell / H5P.StructureStrip",
    description:
      "Área de redacción guiada donde el estudiante escribe su análisis o justificación y lo descarga en formato editable.",
    pedagogicalUse: "Andamiaje directo para el entregable o reporte técnico de la actividad.",
    exampleReto11:
      "Borrador estructurado del reporte técnico donde el equipo justifica las decisiones lógicas de su algoritmo IEEE-754 y ASCII.",
    badgeColor: "#7C3AED",
  },
  {
    id: "audio_recorder",
    name: "Audio Recorder",
    spanishName: "Grabadora de Sustentación Oral",
    library: "H5P.AudioRecorder 1.0",
    category: "produccion",
    templateSlide: 10,
    origin: "native_installed",
    description:
      "Permite al estudiante grabar su voz directamente en el slide y descargar el archivo de audio para su entrega.",
    pedagogicalUse: "Verificación de autoría y argumentación oral en la era de la IA.",
    exampleReto11:
      "Reto de 60 segundos: explica con tus palabras cómo funciona el proceso inverso de binario a decimal/ASCII.",
    badgeColor: "#7C3AED",
  },
  {
    id: "interactive_table",
    name: "Table + SVG Math",
    spanishName: "Tabla de Datos + Fórmulas LaTeX SVG",
    library: "H5P.Table 1.2 + H5P.Image 1.1",
    category: "estudio",
    templateSlide: 14,
    origin: "native_installed",
    communityEquivalent: "H5P.MathDisplay",
    description:
      "Tablas técnicas estilizadas y ecuaciones matemáticas renderizadas en SVG de alta definición con Alt Text accesible.",
    pedagogicalUse: "Consulta estructurada de tablas de verdad, códigos binarios y notación matemática.",
    exampleReto11:
      "Tabla interactiva de caracteres ASCII (DEC, HEX, BIN de 8 bits) y fórmula formal de punto flotante IEEE-754.",
    badgeColor: "#1D5CFF",
  },
  {
    id: "sort_algorithm_steps",
    name: "Sort Paragraphs (Emulated)",
    spanishName: "Ordenar Pasos de Algoritmo (Sort Paragraphs)",
    library: "H5P.DragQuestion 1.15 (Secuencial)",
    category: "comunidad",
    templateSlide: 26,
    origin: "community_emulated",
    communityEquivalent: "H5P.SortParagraphs 0.12",
    description:
      "Emula SortParagraphs sin requerir permisos de admin: el estudiante ordena secuencialmente los pasos lógicos de un algoritmo.",
    pedagogicalUse: "Pensamiento algorítmico y diseño de diagramas de flujo / pseudocódigo.",
    exampleReto11:
      "Ordenar los 5 pasos del algoritmo de conversión de un número real (x)₁₀ al estándar IEEE-754 de 32 bits.",
    badgeColor: "#D97706",
  },
  {
    id: "combination_lock",
    name: "Combination Lock (Escape Room)",
    spanishName: "Candado Binario / Escape Room (Combination Lock)",
    library: "H5P.Blanks 1.14 + GoToSlide",
    category: "comunidad",
    templateSlide: 26,
    origin: "community_emulated",
    communityEquivalent: "H5P.CombinationLock 1.0",
    description:
      "Reto gamificado tipo Escape Room donde el estudiante debe descifrar una clave exacta para desbloquear el siguiente nivel.",
    pedagogicalUse: "Gamificación sin Kahoot: aprendizaje basado en retos y decodificación práctica.",
    exampleReto11:
      "Decodificar la trama binaria 01010101 01000001 01001111 en ASCII ('UAO') y el exponente sesgado de -12.5 para abrir el candado.",
    badgeColor: "#D97706",
  },
  {
    id: "chat_simulator",
    name: "Chat Simulator (Dual Voice)",
    spanishName: "Simulador de Diálogo Técnico (Chat Simulator)",
    library: "H5P.Shape 1.0 + H5P.AdvancedText 1.1 + H5P.Audio 1.5",
    category: "comunidad",
    templateSlide: 12,
    origin: "community_emulated",
    communityEquivalent: "H5P.ChatSimulator 1.0",
    description:
      "Simula una conversación técnica entre dos personajes con burbujas de chat y voces neuronales diferenciadas.",
    pedagogicalUse: "Storytelling pedagógico para aterrizar conceptos abstractos a casos reales.",
    exampleReto11:
      "Diálogo entre una arquitecta de software (voz Salomé) y Alan Turing (voz Gonzalo) sobre por qué un float mal usado rompe un sistema financiero.",
    badgeColor: "#D97706",
  },
  {
    id: "game_map_route",
    name: "Game Map Route",
    spanishName: "Mapa Interactivo de Etapas (Game Map)",
    library: "H5P.Shape 1.0 + H5P.AdvancedText 1.1 + GoToSlide",
    category: "comunidad",
    templateSlide: 6,
    origin: "community_emulated",
    communityEquivalent: "H5P.GameMap 1.9 / H5P.Tabs 1.3",
    description:
      "Tarjetas y nodos interactivos con zonas clicables que permiten saltar directamente a cada estación o misión de la actividad.",
    pedagogicalUse: "Navegación no lineal y visualización clara de la ruta de aprendizaje.",
    exampleReto11:
      "Ruta interactiva de 4 estaciones (Paso 1: Base del lenguaje → Paso 2: Máquina de Turing → Paso 3: IEEE-754 → Paso 4: ASCII).",
    badgeColor: "#D97706",
  },
];

export interface EdgeVoiceSpec {
  id: string;
  name: string;
  country: string;
  language: "Español" | "Inglés";
  gender: "Femenino" | "Masculino";
  tone: string;
}

export const EDGE_NEURAL_VOICES: EdgeVoiceSpec[] = [
  {
    id: "es-CO-SalomeNeural",
    name: "Salomé (Colombia)",
    country: "CO",
    language: "Español",
    gender: "Femenino",
    tone: "Cálida, cercana y académica (Ideal UAO)",
  },
  {
    id: "es-CO-GonzaloNeural",
    name: "Gonzalo (Colombia)",
    country: "CO",
    language: "Español",
    gender: "Masculino",
    tone: "Claro, profesional y explicativo (Ideal UAO)",
  },
  {
    id: "es-MX-DaliaNeural",
    name: "Dalia (México)",
    country: "MX",
    language: "Español",
    gender: "Femenino",
    tone: "Dinámica y expresiva para storytelling",
  },
  {
    id: "es-MX-JorgeNeural",
    name: "Jorge (México)",
    country: "MX",
    language: "Español",
    gender: "Masculino",
    tone: "Energético para cápsulas e introducciones",
  },
  {
    id: "es-ES-ElviraNeural",
    name: "Elvira (España)",
    country: "ES",
    language: "Español",
    gender: "Femenino",
    tone: "Formal y pausada para definiciones teóricas",
  },
  {
    id: "es-ES-AlvaroNeural",
    name: "Álvaro (España)",
    country: "ES",
    language: "Español",
    gender: "Masculino",
    tone: "Documental y técnico",
  },
  {
    id: "en-US-AnaNeural",
    name: "Ana (USA)",
    country: "US",
    language: "Inglés",
    gender: "Femenino",
    tone: "Clear academic English for bilingual modules",
  },
  {
    id: "en-US-GuyNeural",
    name: "Guy (USA)",
    country: "US",
    language: "Inglés",
    gender: "Masculino",
    tone: "Natural conversational English",
  },
  {
    id: "en-GB-SoniaNeural",
    name: "Sonia (UK)",
    country: "GB",
    language: "Inglés",
    gender: "Femenino",
    tone: "British academic pronunciation",
  },
  {
    id: "en-GB-RyanNeural",
    name: "Ryan (UK)",
    country: "GB",
    language: "Inglés",
    gender: "Masculino",
    tone: "British technical narrator",
  },
];

export interface PresentationTemplateColors {
  primary: string;
  accent: string;
  background: string;
  cardBg: string;
  cardBorder: string;
  textPrimary: string;
  textMuted: string;
  badgeBg: string;
  badgeText: string;
  highlightBg: string;
}

export interface PresentationTemplateSpec {
  id: string;
  templateNumber: number;
  name: string;
  shortName: string;
  category: string;
  description: string;
  pedagogicalStyle: string;
  recommendedFont: string;
  colors: PresentationTemplateColors;
}

export const H5P_PRESENTATION_TEMPLATES: PresentationTemplateSpec[] = [
  {
    id: "plantilla-1",
    templateNumber: 1,
    name: "Plantilla 1: Editorial Institucional UAO",
    shortName: "Editorial Institucional UAO",
    category: "Institucional UAO",
    description:
      "Carmesí institucional #8A1428 con azul de contraste #0099E6 y fondo claro #F8FAFC. Diseñado para cursos troncales y formalidad universitaria.",
    pedagogicalStyle: "Editorial universitaria, formal, adecuada para inducción y cursos troncales.",
    recommendedFont: "plus_jakarta",
    colors: {
      primary: "#8A1428",
      accent: "#0099E6",
      background: "#F8FAFC",
      cardBg: "#FFFFFF",
      cardBorder: "#E2E8F0",
      textPrimary: "#0F172A",
      textMuted: "#475569",
      badgeBg: "#8A1428",
      badgeText: "#FFFFFF",
      highlightBg: "#E0F3FA",
    },
  },
  {
    id: "plantilla-2",
    templateNumber: 2,
    name: "Plantilla 2: Ingeniería y Tecnología",
    shortName: "Ingeniería y Tecnología",
    category: "Ingeniería y Cómputo",
    description:
      "Azul Profundo #0F2942 con cian eléctrico #00B4D8 sobre fondo técnico #F0F9FF. Orientado a arquitecturas de hardware, sistemas y telecomunicaciones.",
    pedagogicalStyle: "Desarrollo técnico, algoritmos, arquitectura de computadores y redes.",
    recommendedFont: "space_grotesk",
    colors: {
      primary: "#0F2942",
      accent: "#00B4D8",
      background: "#F0F9FF",
      cardBg: "#FFFFFF",
      cardBorder: "#BAE6FD",
      textPrimary: "#082F49",
      textMuted: "#334155",
      badgeBg: "#0F2942",
      badgeText: "#00B4D8",
      highlightBg: "#E0F2FE",
    },
  },
  {
    id: "plantilla-3",
    templateNumber: 3,
    name: "Plantilla 3: Matemáticas y Computación",
    shortName: "Matemáticas y Computación",
    category: "Ciencias Exactas",
    description:
      "Pizarra Técnica #1E293B con acento verde esmeralda #059669 y fondo fresco #F0FDF4. Diseñado para notación formal, cálculo y matrices.",
    pedagogicalStyle: "Demostraciones formales, análisis matemático y estructuras discretas.",
    recommendedFont: "jetbrains_mono",
    colors: {
      primary: "#1E293B",
      accent: "#059669",
      background: "#F0FDF4",
      cardBg: "#FFFFFF",
      cardBorder: "#BBF7D0",
      textPrimary: "#0F172A",
      textMuted: "#334155",
      badgeBg: "#1E293B",
      badgeText: "#34D399",
      highlightBg: "#DCFCE7",
    },
  },
  {
    id: "plantilla-4",
    templateNumber: 4,
    name: "Plantilla 4: Laboratorio y Simulación",
    shortName: "Laboratorio y Simulación",
    category: "Experimental y Práctica",
    description:
      "Índigo Académico #4338CA con violeta vibrante #7C3AED y fondo suave #F5F3FF. Ideal para bancos de prueba, simuladores y talleres interactivos.",
    pedagogicalStyle: "Experimentación guiada, análisis de datos y validación de hipótesis.",
    recommendedFont: "inter",
    colors: {
      primary: "#4338CA",
      accent: "#7C3AED",
      background: "#F5F3FF",
      cardBg: "#FFFFFF",
      cardBorder: "#DDD6FE",
      textPrimary: "#1E1B4B",
      textMuted: "#4338CA",
      badgeBg: "#4338CA",
      badgeText: "#EDE9FE",
      highlightBg: "#EDE9FE",
    },
  },
  {
    id: "plantilla-5",
    templateNumber: 5,
    name: "Plantilla 5: Ciencias Básicas y Experimentales",
    shortName: "Ciencias Básicas y Experimentales",
    category: "Ciencias Naturales",
    description:
      "Ámbar Cálido #D97706 con borgoña clásico #991B1B sobre lienzo #FFFBEB. Armonía visual para física teórica, química y modelos analíticos.",
    pedagogicalStyle: "Fundamentos científicos, leyes físicas y observación empírica.",
    recommendedFont: "merriweather",
    colors: {
      primary: "#D97706",
      accent: "#991B1B",
      background: "#FFFBEB",
      cardBg: "#FFFFFF",
      cardBorder: "#FDE68A",
      textPrimary: "#451A03",
      textMuted: "#78350F",
      badgeBg: "#991B1B",
      badgeText: "#FEF3C7",
      highlightBg: "#FEF3C7",
    },
  },
  {
    id: "plantilla-6",
    templateNumber: 6,
    name: "Plantilla 6: Robótica y Automatización",
    shortName: "Robótica y Automatización",
    category: "Mecatrónica y Automatización",
    description:
      "Gris Grafito #334155 con naranja mecatrónico #EA580C y fondo #FFF7ED. Estética industrial de alto contraste para sistemas de control y PLC.",
    pedagogicalStyle: "Automatización de procesos, robótica móvil y control industrial.",
    recommendedFont: "space_grotesk",
    colors: {
      primary: "#334155",
      accent: "#EA580C",
      background: "#FFF7ED",
      cardBg: "#FFFFFF",
      cardBorder: "#FED7AA",
      textPrimary: "#1C1917",
      textMuted: "#57534E",
      badgeBg: "#334155",
      badgeText: "#FB923C",
      highlightBg: "#FFEDD5",
    },
  },
  {
    id: "plantilla-7",
    templateNumber: 7,
    name: "Plantilla 7: Innovación y Creatividad",
    shortName: "Innovación y Creatividad",
    category: "Diseño y Proyectos",
    description:
      "Fucsia Digital #BE185D con turquesa energizante #0D9488 y fondo #FDF2F8. Atmósfera contemporánea para design thinking, ideación y prototipado.",
    pedagogicalStyle: "Resolución creativa de problemas, prototipado rápido y trabajo colaborativo.",
    recommendedFont: "plus_jakarta",
    colors: {
      primary: "#BE185D",
      accent: "#0D9488",
      background: "#FDF2F8",
      cardBg: "#FFFFFF",
      cardBorder: "#FBCFE8",
      textPrimary: "#2E1065",
      textMuted: "#701A75",
      badgeBg: "#BE185D",
      badgeText: "#CCFBF1",
      highlightBg: "#CCFBF1",
    },
  },
  {
    id: "plantilla-8",
    templateNumber: 8,
    name: "Plantilla 8: Aula Invertida y Debate",
    shortName: "Aula Invertida y Debate",
    category: "Metodologías Activas",
    description:
      "Teal Sincrónico #0F766E con azul marino #1E3A8A sobre fondo #F0FDFA. Optimizado para discusión dialógica, casos de estudio y foros en vivo.",
    pedagogicalStyle: "Discusión socrática, dilemas éticos y preparación para encuentros sincrónicos.",
    recommendedFont: "inter",
    colors: {
      primary: "#0F766E",
      accent: "#1E3A8A",
      background: "#F0FDFA",
      cardBg: "#FFFFFF",
      cardBorder: "#99F6E4",
      textPrimary: "#134E4A",
      textMuted: "#374151",
      badgeBg: "#0F766E",
      badgeText: "#E0F2FE",
      highlightBg: "#CCFBF1",
    },
  },
  {
    id: "plantilla-9",
    templateNumber: 9,
    name: "Plantilla 9: Minimalista Campus Digital",
    shortName: "Minimalista Campus Digital",
    category: "Minimalismo Editorial",
    description:
      "Blanco Puro #FFFFFF y gris pizarra #475569 con acento carmesí #8A1428. Lectura limpia, máxima sobriedad y accesibilidad visual.",
    pedagogicalStyle: "Contenido denso, síntesis de lectura y módulos de autoaprendizaje guiado.",
    recommendedFont: "inter",
    colors: {
      primary: "#1E293B",
      accent: "#8A1428",
      background: "#FFFFFF",
      cardBg: "#F8FAFC",
      cardBorder: "#E2E8F0",
      textPrimary: "#0F172A",
      textMuted: "#475569",
      badgeBg: "#8A1428",
      badgeText: "#FFFFFF",
      highlightBg: "#F1F5F9",
    },
  },
];

export function getPresentationTemplate(
  idOrNumber?: string | number
): PresentationTemplateSpec {
  if (!idOrNumber) return H5P_PRESENTATION_TEMPLATES[0];
  if (typeof idOrNumber === "number") {
    const found = H5P_PRESENTATION_TEMPLATES.find(
      (t) => t.templateNumber === idOrNumber
    );
    return found || H5P_PRESENTATION_TEMPLATES[0];
  }
  const clean = String(idOrNumber).trim().toLowerCase();
  if (clean === "fiuao-6-215" || clean === "plantilla-1") {
    return H5P_PRESENTATION_TEMPLATES[0];
  }
  const found = H5P_PRESENTATION_TEMPLATES.find(
    (t) => t.id.toLowerCase() === clean || t.name.toLowerCase().includes(clean)
  );
  if (found) return found;
  const numMatch = clean.match(/\d+/);
  if (numMatch) {
    const num = parseInt(numMatch[0], 10);
    const byNum = H5P_PRESENTATION_TEMPLATES.find(
      (t) => t.templateNumber === num
    );
    if (byNum) return byNum;
  }
  return H5P_PRESENTATION_TEMPLATES[0];
}

export const UAO_TEMPLATE_COLORS = {
  texto: "hsl(0,0%,0%)",
  texto_sobre_color: "hsl(0, 0%, 100%)",
  acento: "hsl( 200, 100%, 45% )", // #0099E6
  principal: "hsl( 350, 75%, 31% )", // #8A1428
  fondo_suave: "rgb(224, 243, 250)", // #E0F3FA
  pendiente: "#FE9800",
  hex: {
    acento: "#0099E6",
    principal: "#8A1428",
    fondo_suave: "#E0F3FA",
    boton: "#1D5CFF",
    pendiente: "#FE9800",
  },
};

export interface FontOptionSpec {
  id: string;
  name: string;
  cssStack: string;
  category: string;
  description: string;
  sampleText: string;
}

export const H5P_FONT_OPTIONS: FontOptionSpec[] = [
  {
    id: "plus_jakarta",
    name: "Plus Jakarta Sans (Institucional Moderna)",
    cssStack: "'Plus Jakarta Sans', 'Inter', system-ui, -apple-system, sans-serif",
    category: "Sans-Serif Geométrica",
    description:
      "Tipografía principal de alta legibilidad optimizada para presentaciones interactivas y pantallas de alta densidad.",
    sampleText: "Del dato al código digital — IEEE-754 y ASCII",
  },
  {
    id: "inter",
    name: "Inter UI (Académica Limpia)",
    cssStack: "'Inter', system-ui, -apple-system, sans-serif",
    category: "Sans-Serif Neutra",
    description:
      "Estándar de diseño de interfaces académicas con excelente altura de x para párrafos densos y tablas técnicas.",
    sampleText: "Representación discreta de los números en las máquinas",
  },
  {
    id: "space_grotesk",
    name: "Space Grotesk (Ingeniería y Cómputo)",
    cssStack: "'Space Grotesk', 'Inter', sans-serif",
    category: "Display Técnica",
    description:
      "Carácter tecnológico e ingenieril ideal para cursos de ciencias de la computación, algoritmos y sistemas digitales.",
    sampleText: "Máquina de Turing: δ(q, s) = (q', s', Dirección)",
  },
  {
    id: "merriweather",
    name: "Merriweather (Editorial Universitaria)",
    cssStack: "'Merriweather', Georgia, 'Times New Roman', serif",
    category: "Serif Académica",
    description:
      "Estilo de libro de texto clásico universitario para lecturas extensas, definiciones formales y teoremas.",
    sampleText: "Módulo 1: Inducción matemática y recursividad",
  },
  {
    id: "jetbrains_mono",
    name: "JetBrains Mono (Código y Binario)",
    cssStack: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
    category: "Monoespaciada",
    description:
      "Alineación perfecta bit a bit para tramas IEEE-754, tablas de referencia ASCII y trazas algorítmicas.",
    sampleText: "1 | 10000010 | 10110100000000000000000 (0xC15A0000)",
  },
];

export interface SlideTemplateLayoutSpec {
  templateNumber: number;
  slideNumber: number;
  name: string;
  description: string;
  bestFor: string;
}

export const UAO_SLIDE_LAYOUTS: SlideTemplateLayoutSpec[] = [
  {
    templateNumber: 1,
    slideNumber: 2,
    name: "Plantilla 1: Portada Institucional (Título + Subtítulo + Programa)",
    description: "Portada oficial con franja institucional, subtítulo de programa y título principal.",
    bestFor: "Inicio de actividad o módulo formativo",
  },
  {
    templateNumber: 2,
    slideNumber: 5,
    name: "Plantilla 2: Objetivos de Aprendizaje (3 tarjetas de competencia)",
    description: "Tres tarjetas numeradas con competencias u objetivos de aprendizaje estructurados.",
    bestFor: "Propósito formativo, resultados de aprendizaje y competencias",
  },
  {
    templateNumber: 3,
    slideNumber: 6,
    name: "Plantilla 3: Ruta de Aprendizaje (4 estaciones consecutivas)",
    description: "Cuatro tarjetas numeradas clicables con navegación directa hacia cada estación pedagógica.",
    bestFor: "Mapa de ruta metodológica de la actividad interactiva",
  },
  {
    templateNumber: 4,
    slideNumber: 9,
    name: "Plantilla 4: Estación con Esquema Técnico (Texto + Diagrama SVG/PNG)",
    description: "Insignia de Paso N, texto explicativo estructurado y diagrama técnico SVG o imagen.",
    bestFor: "Desarrollo analítico de cada estación de la lección",
  },
  {
    templateNumber: 5,
    slideNumber: 14,
    name: "Plantilla 5: Fuentes y Enlaces de Estudio (Lecturas recomendadas y enlaces APA)",
    description: "Columna lateral izquierda con título y panel derecho para lecturas obligatorias, enlaces y fuentes de consulta.",
    bestFor: "Bibliografía recomendada, enlaces web y material de apoyo",
  },
  {
    templateNumber: 6,
    slideNumber: 19,
    name: "Plantilla 6: Debate en Encuentro Sincrónico (Foco académico + caso real)",
    description: "Título amplio superior, desarrollo conceptual, recuadro de pregunta detonadora y elemento ilustrativo.",
    bestFor: "Metas de aprendizaje, casos reales y preparación de encuentro sincrónico",
  },
  {
    templateNumber: 7,
    slideNumber: 25,
    name: "Plantilla 7: Laboratorio Interactivo (Interactividad H5P + retroalimentación)",
    description: "Contexto e instrucciones a la izquierda y contenedor interactivo H5P con retroalimentación inmediata a la derecha.",
    bestFor: "Cuestionarios, retos interactivos y evaluación formativa",
  },
  {
    templateNumber: 8,
    slideNumber: 31,
    name: "Plantilla 8: Cierre de Actividad (Resumen de aprendizajes y metacognición)",
    description: "Mensaje institucional de finalización, síntesis de logros y conexión con el siguiente reto formativo.",
    bestFor: "Conclusión de la actividad, síntesis y metacognición",
  },
  {
    templateNumber: 9,
    slideNumber: 32,
    name: "Plantilla 9: Referencias Bibliográficas (Fuentes completas APA 7)",
    description: "Estructura formal en dos columnas para el listado riguroso de referencias bibliográficas en norma APA 7.",
    bestFor: "Cierre bibliográfico oficial y fuentes académicas",
  },
];

export function findSlideLayout(slideNumberOrTemplate?: number): SlideTemplateLayoutSpec {
  if (!slideNumberOrTemplate) return UAO_SLIDE_LAYOUTS[3];

  // 1. Priorizar coincidencia exacta con el slideNumber real de fiuao-6-215
  const bySlideNum = UAO_SLIDE_LAYOUTS.find(
    (l) => l.slideNumber === slideNumberOrTemplate
  );
  if (bySlideNum) return bySlideNum;

  // 2. Mapeos de compatibilidad para slides fiuao complementarios
  if (slideNumberOrTemplate === 4 || slideNumberOrTemplate === 7 || slideNumberOrTemplate === 8) {
    return UAO_SLIDE_LAYOUTS[3]; // Plantilla 4: Estación con Esquema Técnico / Concepto
  }
  if (slideNumberOrTemplate >= 20 && slideNumberOrTemplate <= 28) {
    return UAO_SLIDE_LAYOUTS[6]; // Plantilla 7: Laboratorio Interactivo
  }

  // 3. Fallback por ordinal de plantilla (1..9)
  const byTemplateNum = UAO_SLIDE_LAYOUTS.find(
    (l) => l.templateNumber === slideNumberOrTemplate
  );
  if (byTemplateNum) return byTemplateNum;

  return UAO_SLIDE_LAYOUTS[3];
}

