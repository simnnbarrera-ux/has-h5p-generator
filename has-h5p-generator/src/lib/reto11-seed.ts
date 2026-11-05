// =============================================================================
// HAS H5P Generator — Datos Semilla Oficiales del Reto 11 (Digitatón UAO 2026)
// Curso: Matemáticas Discretas | Profesor: Oswaldo Rodríguez Díaz
// Equipo 36 (EQ-36): Hermaioni, Alex, Simón | Orientadores EO-4: Adriana y Sara
// =============================================================================

import {
  HasProjectSpec,
  generatePh5pPythonScript,
  generateMoodleBookJson,
} from "./h5p-engine";
import { HasProjectRecord } from "./supabase";

export const RETO11_ACT0_SPEC: HasProjectSpec = {
  id: "matematicas-discretas-act0",
  title: "Actividad 0 — Bienvenida a Matemáticas Discretas",
  courseName: "Matemáticas Discretas",
  moduleName: "Módulo 1: Inducción matemática y recursividad",
  activityNumber: 0,
  templateId: "plantilla-1",
  defaultVoice: "es-CO-GonzaloNeural",
  includeNavigationGuide: true, // Regla UAO: el slide 1 "¿Cómo navegar?" SOLO va en la Actividad 0
  slides: [
    {
      id: "act0-s2",
      key: "portada",
      templateSlide: 2,
      menuTitle: "Portada",
      titleBlack: "Matemáticas Discretas",
      titleAccent: "Módulo 1: Inducción matemática y recursividad",
      subtitle: "Facultad de Ingeniería y Ciencias Básicas — Universidad Autónoma de Occidente",
      paragraphs: [
        "Bienvenido a la experiencia de aprendizaje digital del curso Matemáticas Discretas.",
      ],
      audioNarration: {
        text: "Bienvenido al curso de Matemáticas Discretas de la Facultad de Ingeniería y Ciencias Básicas de la Universidad Autónoma de Occidente. En este primer módulo exploraremos cómo las máquinas representan información de manera discreta y finita.",
        voice: "es-CO-GonzaloNeural",
      },
    },
    {
      id: "act0-s3",
      key: "bienvenida",
      templateSlide: 4,
      menuTitle: "Bienvenida al curso",
      titleBlack: "¡Te damos la",
      titleAccent: "bienvenida!",
      paragraphs: [
        "En la ingeniería y las ciencias de la computación, todo sistema digital opera bajo estructuras discretas: bits, estados finitos, grafos, árboles y secuencias recursivas.",
        "A lo largo de esta trayectoria formativa comprenderás cómo los computadores traducen el mundo continuo a representaciones discretas exactas (como los estándares IEEE-754 y ASCII) y cómo razonar rigurosamente sobre algoritmos mediante inducción matemática.",
      ],
      highlightBox:
        "Docente autor: Prof. Oswaldo Rodríguez Díaz — Departamento de Matemáticas y Estadística, UAO.",
      apaReferences: [
        "Rosen, K. H. (2019). Matemáticas discretas y sus aplicaciones (8.ª ed.). McGraw-Hill.",
      ],
    },
    {
      id: "act0-s4",
      key: "foro",
      templateSlide: 19,
      menuTitle: "El Foro de presentación",
      titleBlack: "Conecta en",
      titleAccent: "El Foro",
      paragraphs: [
        "El foro académico es nuestro punto de encuentro para compartir expectativas, resolver inquietudes conceptuales sobre representación numérica discreta y construir comunidad de aprendizaje.",
        "Participa respondiendo: ¿En qué situación de tu carrera de ingeniería has notado que un computador o calculadora comete errores de redondeo o límite de memoria?",
      ],
      highlightBox:
        "Recuerda realizar tu intervención inicial antes del primer encuentro sincrónico.",
    },
    {
      id: "act0-s5",
      key: "trayectoria",
      templateSlide: 7,
      menuTitle: "Conoce tu trayectoria",
      titleBlack: "Conoce tu",
      titleAccent: "trayectoria formativa",
      paragraphs: [
        "Este curso está estructurado mediante retos de aprendizaje progresivos que conectan la fundamentación matemática con la implementación computacional:",
        "• Actividad 1 (Faro): Del dato al código digital — Representación discreta de números (IEEE-754) y textos (ASCII) en las máquinas.\n• Actividad 2: Principio de inducción matemática y demostración de propiedades algorítmicas.\n• Actividad 3: Sucesiones, relaciones de recurrencia y análisis de complejidad discreta.",
      ],
    },
    {
      id: "act0-s6",
      key: "encuentro",
      templateSlide: 14,
      menuTitle: "Primer encuentro virtual",
      titleBlack: "Primer encuentro",
      titleAccent: "virtual sincrónico",
      paragraphs: [
        "En nuestra primera sesión sincrónica abordaremos los aspectos metodológicos y prácticos del curso:",
        "• Metodología de aprendizaje activo y criterios de evaluación de la Actividad Faro 1.",
        "• Demostración experimental en vivo sobre propagación de error en punto flotante.",
        "• Verificación de cronograma institucional y canales de tutoría académica.",
      ],
      links: [
        {
          label: "Acceso a la sala de videoconferencia (Moodle UAO)",
          url: "https://digitaton.uao.edu.co/course/view.php?id=100",
        },
      ],
      audioNarration: {
        text: "Primer encuentro virtual sincrónico. En nuestra sesión inaugural revisaremos la metodología del curso, los criterios de evaluación de la Actividad Faro 1 y realizaremos experimentos en vivo con precisión de punto flotante. Te esperamos en la sala virtual.",
        voice: "es-CO-GonzaloNeural",
      },
    },
    {
      id: "act0-s7",
      key: "diagnostico-inicial",
      templateSlide: 25,
      menuTitle: "Explora tu intuición",
      titleBlack: "Explora tu",
      titleAccent: "intuición discreta",
      paragraphs: [
        "Antes de iniciar la Actividad 1, pon a prueba tu intuición sobre cómo las máquinas procesan datos discretos versus continuos.",
      ],
      interaction: {
        type: "single_choice_set",
        instruction: "Selecciona la respuesta correcta en cada caso.",
        questions: [
          {
            question:
              "¿Cuál es la diferencia esencial entre una señal continua y una representación digital en una máquina?",
            answers: [
              "La representación digital toma valores de un conjunto finito y contable de estados discretos (bits).",
              "La representación digital almacena infinitos decimales sin pérdida de precisión.",
              "Ambas representaciones ocupan exactamente la misma cantidad de memoria física.",
            ],
          },
          {
            question:
              "¿Qué ocurre cuando ejecutamos 0.1 + 0.2 en la mayoría de lenguajes de programación basados en IEEE-754?",
            answers: [
              "Se obtiene 0.30000000000000004 debido a que 0.1 y 0.2 son fracciones periódicas en binario.",
              "El procesador se detiene por división entre cero.",
              "Siempre da exactamente 0.30000000000000000 sin ningún error de redondeo.",
            ],
          },
        ],
      },
    },
    {
      id: "act0-s8",
      key: "cierre",
      templateSlide: 31,
      menuTitle: "Cierre de bienvenida",
      titleBlack: "¡Comencemos el",
      titleAccent: "recorrido!",
      paragraphs: [
        "Ya conoces la estructura de tu curso de Matemáticas Discretas y los espacios de comunicación.",
        "Continúa ahora con la Actividad 1: Del dato al código digital, donde dominarás la representación discreta de números y caracteres en la arquitectura computacional.",
      ],
    },
  ],
  auditReport: [
    "Actividad 0 construida siguiendo el bloque de bienvenida oficial de la plantilla fiuao-6-215 (slides 1, 2, 3, 6, 7, 8 y 27).",
    "Se incluye la diapositiva 1 '¿Cómo navegar?' exclusivamente en la Actividad 0, cumpliendo la directriz institucional de la Facultad de Ingeniería.",
    "Se incorporó diagnóstico interactivo inicial (SingleChoiceSet) y Locución Académica (CO) con voz colombiana (es-CO-GonzaloNeural).",
  ],
  textChanges: [
    "Adaptación del texto genérico de bienvenida de la plantilla institucional al contexto específico de Matemáticas Discretas (Módulo 1).",
  ],
};

export const RETO11_ACT1_SPEC: HasProjectSpec = {
  id: "matematicas-discretas-act1",
  title:
    "Actividad 1 — Del dato al código digital: Representación discreta en las máquinas",
  courseName: "Matemáticas Discretas",
  moduleName: "Módulo 1: Inducción matemática y recursividad",
  activityNumber: 1,
  templateId: "plantilla-1",
  defaultVoice: "es-CO-SalomeNeural",
  includeNavigationGuide: false, // Regla UAO: en Actividad 1+ se omite la diapositiva 1 "¿Cómo navegar?"
  slides: [
    {
      id: "act1-portada",
      key: "portada",
      templateSlide: 2,
      menuTitle: "Del dato al código digital",
      titleBlack: "Del dato al código digital",
      titleAccent:
        "Representación discreta de los números en las máquinas (IEEE-754 y ASCII)",
      subtitle: "Actividad Faro 1 — Matemáticas Discretas | Prof. Oswaldo Rodríguez Díaz",
      paragraphs: [
        "Módulo 1: Inducción matemática y recursividad — Facultad de Ingeniería y Ciencias Básicas UAO.",
      ],
      audioNarration: {
        text: "Bienvenido a la Actividad 1: Del dato al código digital. En esta unidad comprenderás cómo las máquinas representan los números reales y los caracteres de texto de manera no continua o discreta mediante los estándares IEEE 754 y ASCII.",
        voice: "es-CO-SalomeNeural",
      },
    },
    {
      id: "act1-meta",
      key: "meta",
      templateSlide: 5,
      menuTitle: "¿Qué aprenderás?",
      titleBlack: "¿Qué",
      titleAccent: "aprenderás?",
      paragraphs: [
        "Al finalizar esta actividad dominarás la representación discreta y finita en los computadores a través de tres competencias clave:",
      ],
      stepsCards: [
        {
          number: "01",
          title: "Analizar y Traducir",
          description:
            "Diferenciar conjuntos continuos de su discretización binaria finita en la memoria de la máquina.",
        },
        {
          number: "02",
          title: "Modelar con Precisión",
          description:
            "Codificar magnitudes en punto flotante IEEE-754 (32 bits) y texto en formato ASCII estándar.",
        },
        {
          number: "03",
          title: "Validar y Resolver",
          description:
            "Evaluar el impacto de la memoria finita y los errores de redondeo o truncamiento en ingeniería.",
        },
      ],
      highlightBox:
        "Meta de aprendizaje: Comprender por qué los conjuntos continuos deben discretizarse para su procesamiento computacional.",
      apaReferences: [
        "IEEE Computer Society. (2019). IEEE Standard for Floating-Point Arithmetic (IEEE Std 754-2019).",
      ],
      audioNarration: {
        text: "¿Qué aprenderás? Al finalizar esta unidad dominarás tres competencias esenciales: primero, analizar y traducir conjuntos numéricos continuos a su representación binaria; segundo, modelar magnitudes reales con el estándar IEEE 754 y texto en ASCII; y tercero, evaluar críticamente el impacto del redondeo y truncamiento en sistemas de ingeniería.",
        voice: "es-CO-SalomeNeural",
      },
    },
    {
      id: "act1-evidencia",
      key: "evidencia",
      templateSlide: 4,
      menuTitle: "Evidencia de aprendizaje",
      titleBlack: "Tu evidencia de",
      titleAccent: "aprendizaje (Medio #1)",
      paragraphs: [
        "Para demostrar el logro de la meta, elaborarás un Informe Técnico de Conversión y Análisis de Precisión Discreta en el que:",
        "1. Clasifiques conjuntos numéricos e identifiques qué valores sufren error de representación finita.\n2. Conviertas números reales al estándar IEEE-754 de 32 bits (signo, exponente sesgado y mantisa).\n3. Codifiques cadenas de caracteres en binario mediante el estándar ASCII e implementes un algoritmo básico de conversión.",
      ],
      highlightBox:
        "Entregable en el aula virtual Moodle: Documento técnico individual o en parejas con el desarrollo paso a paso y reflexión sobre errores de truncamiento.",
      audioNarration: {
        text: "Evidencia de aprendizaje. Para demostrar el logro de la meta, elaborarás un informe técnico donde clasificarás conjuntos numéricos, convertirás números reales al estándar IEEE 754 de 32 bits y codificarás texto en binario mediante el estándar ASCII.",
        voice: "es-CO-SalomeNeural",
      },
    },
    {
      id: "act1-ruta",
      key: "ruta",
      templateSlide: 6,
      menuTitle: "Ruta de la actividad",
      titleBlack: "Ruta de aprendizaje en",
      titleAccent: "4 pasos",
      paragraphs: [
        "Haz clic en cada uno de los 4 pasos de la ruta para explorar desde la teoría de conjuntos numéricos hasta la codificación binaria IEEE-754 y ASCII:",
      ],
      stepsCards: [
        {
          number: "01",
          title: "La base del lenguaje",
          description:
            "Conjuntos numéricos (N, Z, Q, I, R) y diferencia entre lo continuo y lo discreto.",
          targetKey: "paso1",
        },
        {
          number: "02",
          title: "La Máquina de Turing",
          description:
            "El modelo matemático de cómputo discreto: cinta finita, símbolos y estados.",
          targetKey: "paso2",
        },
        {
          number: "03",
          title: "Codificación IEEE-754",
          description:
            "Representación de números reales en punto flotante de 32 y 64 bits.",
          targetKey: "paso3",
        },
        {
          number: "04",
          title: "Algoritmos y ASCII",
          description:
            "Codificación de texto a binario y algoritmos de cambio de base.",
          targetKey: "paso4",
        },
      ],
    },
    {
      id: "act1-paso1",
      key: "paso1",
      templateSlide: 9,
      menuTitle: "Paso 1: La base del lenguaje",
      titleBlack: "Paso 1: La base",
      titleAccent: "del lenguaje numérico",
      subtitle: "Paso 1",
      paragraphs: [
        "La memoria física de un computador está compuesta por un número finito de bits, lo que impone restricciones fundamentales:",
        "• Jerarquía numérica: Distinción entre discretos numerables (N, Z, Q) y continuos densos (I, R).",
        "• Recta continua vs bits: Entre dos reales existen infinitos números; la memoria digital es finita.",
        "• Discretización forzada: Toda magnitud continua debe aproximarse a un subconjunto finito de estados.",
      ],
      svgDiagramId: "conjuntos_numericos",
      apaReferences: [
        "Rosen, K. H. (2019). Matemáticas discretas y sus aplicaciones (8.ª ed.). McGraw-Hill.",
      ],
      audioNarration: {
        text: "Paso 1: La base del lenguaje numérico. En matemáticas trabajamos con conjuntos discretos como los Naturales y los Enteros, y conjuntos continuos y densos como los Racionales e Irracionales. Sin embargo, la memoria de un computador está limitada por un número finito de transistores y bits. Por ello, toda máquina digital debe discretizar y truncar los números continuos para poder procesarlos.",
        voice: "es-CO-SalomeNeural",
      },
    },
    {
      id: "act1-previos",
      key: "previos",
      templateSlide: 26,
      menuTitle: "Activando conocimientos",
      titleBlack: "Activando",
      titleAccent: "conocimientos previos",
      paragraphs: [
        "Arrastra cada símbolo o concepto hacia la definición matemática que le corresponde antes de profundizar en la lectura del Paso 1.",
      ],
      interaction: {
        type: "drag_text",
        instruction:
          "Arrastra los términos hacia los espacios en blanco para completar la jerarquía de los conjuntos numéricos:",
        textField:
          "1. El conjunto de los números *Naturales* se emplea para el conteo discreto de elementos (1, 2, 3...).\n" +
          "2. Al añadir el cero y los inversos aditivos negativos obtenemos el conjunto de los *Enteros*.\n" +
          "3. Todo número que puede escribirse como el cociente exacto de dos enteros a/b con b ≠ 0 pertenece a los *Racionales*.\n" +
          "4. Constantes como π, e o √2 tienen expansión decimal infinita no periódica y pertenecen a los *Irracionales*.\n" +
          "5. En una máquina digital, la memoria física es *Discreta* y finita, a diferencia de la recta real que es continua.",
        feedback:
          "¡Excelente! Distinguir qué conjuntos son numerables/discretos y cuáles son continuos es el primer paso para entender la aritmética del computador.",
      },
    },
    {
      id: "act1-fuente1",
      key: "fuente1",
      templateSlide: 14,
      menuTitle: "Fuente Paso 1",
      titleBlack: "Explora la",
      titleAccent: "Fuente del Paso 1",
      paragraphs: [
        "Profundiza en la estructura de los conjuntos numéricos y las causas matemáticas del error de representación en hardware digital:",
        "• Recta real vs registros finitos: Límites de precisión en memoria estática.",
        "• Conversión periódica: Fracciones exactas en base diez (como 0.1) se vuelven periódicas infinitas en binario.",
        "• Estrategias de mitigación: Uso de tipos de datos adecuados y tolerancias numéricas.",
      ],
      links: [
        {
          label: "Lectura base: Conjuntos numéricos y aritmética finita (Moodle UAO)",
          url: "https://digitaton.uao.edu.co/course/view.php?id=100",
        },
      ],
      apaReferences: [
        "Brookshear, J. G., & Brylow, D. (2020). Computer Science: An Overview (13th ed.). Pearson.",
      ],
      audioNarration: {
        text: "Fuente del Paso 1. En este recurso complementario podrás profundizar en cómo las fracciones que en base diez son exactas se convierten en números binarios periódicos infinitos, y cómo elegir los tipos de datos correctos para evitar la pérdida de información.",
        voice: "es-CO-SalomeNeural",
      },
    },
    {
      id: "act1-analiza1",
      key: "analiza1",
      templateSlide: 25,
      menuTitle: "Analiza y responde",
      titleBlack: "Analiza y",
      titleAccent: "responde (Paso 1)",
      paragraphs: [
        "Con base en la lectura del Paso 1, responde las siguientes 4 preguntas de verificación conceptual propuestas en la maqueta del curso:",
      ],
      interaction: {
        type: "single_choice_set",
        instruction:
          "Selecciona la opción correcta en cada una de las 4 preguntas del Paso 1:",
        feedback:
          "¡Muy bien! Has verificado tu comprensión sobre la discretización de los conjuntos numéricos en la máquina.",
        questions: [
          {
            question:
              "1. ¿Por qué un computador digital no puede almacenar todos los números reales con precisión infinita?",
            answers: [
              "Porque dispone de un número finito de bits y debe discretizar y truncar los valores.",
              "Porque los procesadores modernos solo conocen los números naturales positivos.",
              "Porque el sistema binario no permite representar fracciones de ningún tipo.",
            ],
          },
          {
            question:
              "2. ¿Qué característica distingue a un número irracional como √2 o π al llevarlo a la memoria de una máquina?",
            answers: [
              "Su expansión es infinita no periódica, por lo que siempre se almacena como una aproximación racional finita.",
              "Se guarda de forma exacta utilizando únicamente 8 bits en código ASCII.",
              "No puede aproximarse de ninguna manera en ningún lenguaje de programación.",
            ],
          },
          {
            question:
              "3. Cuando afirmamos que un sistema digital opera de forma 'discreta', ¿a qué nos referimos?",
            answers: [
              "A que sus estados posibles están separados y son contables, sin valores intermedios continuos entre dos bits.",
              "A que el computador oculta los cálculos matemáticos al usuario final.",
              "A que solamente puede operar con números pares en base diez.",
            ],
          },
          {
            question:
              "4. ¿Qué sucede cuando una fracción decimal exacta como 0.1 se convierte al sistema binario de punto flotante?",
            answers: [
              "Genera una secuencia binaria periódica infinita que al cortarse produce un pequeño error de redondeo.",
              "Se convierte en un número entero negativo automáticamente.",
              "Se representa con un único bit sin necesidad de mantisa ni exponente.",
            ],
          },
        ],
      },
    },
    {
      id: "act1-sincronico",
      key: "sincronico",
      templateSlide: 19,
      menuTitle: "Encuentro sincrónico",
      titleBlack: "Debate en el",
      titleAccent: "encuentro sincrónico",
      paragraphs: [
        "Lleva tus respuestas de verificación conceptual para debatir dos casos críticos de la ingeniería moderna:",
        "• Misil Patriot (1991): Desfase temporal acumulativo por truncamiento de 0.1 s en 24 bits tras 100 horas continuas.",
        "• Cohete Ariane 5 (1996): Pérdida de trayectoria por desbordamiento al convertir punto flotante de 64 bits a entero de 16 bits.",
      ],
      highlightBox:
        "Pregunta detonadora: ¿Cómo diseñarías un sistema de control de misión crítica para mitigar los errores de truncamiento binario?",
      audioNarration: {
        text: "Encuentro sincrónico. En nuestra sesión en vivo analizaremos dos catástrofes emblemáticas causadas por errores de discretización: el fallo del radar del misil Patriot en 1991 por acumulación de tiempo en veinticuatro bits, y la destrucción del cohete Ariane 5 en 1996 por desbordamiento de punto flotante a entero de dieciséis bits. Reflexiona sobre cómo proteger tus algoritmos ante estos límites físicos.",
        voice: "es-CO-SalomeNeural",
      },
    },
    {
      id: "act1-paso2",
      key: "paso2",
      templateSlide: 9,
      menuTitle: "Paso 2: Máquina de Turing",
      titleBlack: "Paso 2: La Máquina",
      titleAccent: "de Turing",
      subtitle: "Paso 2",
      paragraphs: [
        "Alan Turing formuló en 1936 el modelo formal que define la estructura del cómputo discreto moderno:",
        "• Cinta infinita de celdas discretas: Almacena símbolos de un alfabeto finito (0, 1 y blanco).",
        "• Cabezal y control de estados: Lee, escribe y transita entre un conjunto finito de estados (q₀ a qF).",
        "• Tesis de Church-Turing: Todo algoritmo ejecutable puede descomponerse en pasos discretos elementales.",
      ],
      svgDiagramId: "maquina_turing",
      apaReferences: [
        "Sipser, M. (2012). Introduction to the Theory of Computation (3rd ed.). Cengage Learning.",
      ],
      audioNarration: {
        text: "Paso 2: La Máquina de Turing. En 1936, Alan Turing concibió el modelo matemático que fundamenta la computación moderna. Está compuesto por una cinta dividida en celdas discretas, un cabezal lector-escritor de símbolos finitos y una tabla de estados finitos. Este modelo formal demuestra que cualquier cómputo complejo se reduce a pasos discretos y secuenciales.",
        voice: "es-CO-SalomeNeural",
      },
    },
    {
      id: "act1-fuente2",
      key: "fuente2",
      templateSlide: 14,
      menuTitle: "Fuente Paso 2",
      titleBlack: "Explora la",
      titleAccent: "Fuente del Paso 2",
      paragraphs: [
        "Comprueba el funcionamiento de la Máquina de Turing mediante simulaciones y análisis formal de transiciones:",
        "• Alfabeto y estados: Definición de símbolos de entrada y transiciones deterministas.",
        "• Función de transición: Mapeo formal delta de estado y símbolo a nuevo estado, símbolo y movimiento.",
        "• Experimentación práctica: Simulación paso a paso de inversión de bits e incremento binario.",
      ],
      links: [
        {
          label: "Simulador interactivo de Máquina de Turing (Recurso externo)",
          url: "https://turingmachine.io/",
        },
      ],
      apaReferences: [
        "Turing, A. M. (1936). On Computable Numbers, with an Application to the Entscheidungsproblem. Proceedings of the London Mathematical Society, 2(42), 230–265.",
      ],
      audioNarration: {
        text: "Fuente del Paso 2. Utiliza el simulador interactivo para ver en acción cómo el cabezal de Turing modifica los símbolos en la cinta discreta según la función de transición de estados.",
        voice: "es-CO-SalomeNeural",
      },
    },
    {
      id: "act1-paso3",
      key: "paso3",
      templateSlide: 9,
      menuTitle: "Paso 3: Estándar IEEE-754",
      titleBlack: "Paso 3: Codificación de",
      titleAccent: "números (IEEE-754)",
      subtitle: "Paso 3",
      paragraphs: [
        "El estándar IEEE-754 de precisión simple (32 bits) codifica números reales normalizados mediante tres campos:",
        "• Signo S (1 bit): 0 para valores positivos (+) y 1 para valores negativos (-).",
        "• Exponente sesgado E (8 bits): Exponente real más sesgo de +127 (rango de 0 a 255).",
        "• Mantisa normalizada M (23 bits): Fracción tras el 1 implícito: (-1)^S x (1.M)2 x 2^(E-127).",
      ],
      svgDiagramId: "ieee_754_32bits",
      apaReferences: [
        "IEEE Computer Society. (2019). IEEE Standard for Floating-Point Arithmetic (IEEE Std 754-2019).",
        "Tanenbaum, A. S. (2016). Structured Computer Organization (6th ed.). Pearson.",
      ],
      audioNarration: {
        text: "Paso 3: Estándar IEEE-754. Para almacenar números reales fraccionarios en 32 bits, el estándar IEEE-754 divide la palabra en tres campos esenciales: un bit de signo, ocho bits para el exponente con un sesgo de más ciento veintisiete, y veintitrés bits para la mantisa fraccionaria normalizada con uno implícito.",
        voice: "es-CO-SalomeNeural",
      },
    },
    {
      id: "act1-fuente3",
      key: "fuente3",
      templateSlide: 4,
      menuTitle: "Fuente Paso 3",
      titleBlack: "Ejemplo guiado",
      titleAccent: "IEEE-754 (−13.625)",
      paragraphs: [
        "Veamos paso a paso cómo se almacena el número real −13.625 en IEEE-754 de 32 bits:",
        "1. Signo: Como es negativo, S = 1.\n2. Parte entera y fraccionaria a binario: 13₁₀ = 1101₂ y 0.625₁₀ = 1/2 + 1/8 = .101₂ → 13.625₁₀ = 1101.101₂.\n3. Normalización científica binaria: 1.101101₂ × 2³ (la coma se desplazó 3 posiciones a la izquierda).\n4. Exponente sesgado: E = 3 + 127 = 130₁₀ = 10000010₂.\n5. Mantisa (23 bits tras el 1.): M = 10110100000000000000000₂.",
      ],
      highlightBox:
        "Resultado final en 32 bits: 1 | 10000010 | 10110100000000000000000 (Hexadecimal: 0xC15A0000).",
      audioNarration: {
        text: "Fuente del Paso 3. Analiza este ejemplo guiado de conversión del número real menos trece coma seiscientos veinticinco al formato de 32 bits, identificando el bit de signo, la normalización científica y el cálculo del exponente sesgado.",
        voice: "es-CO-SalomeNeural",
      },
    },
    {
      id: "act1-paso4",
      key: "paso4",
      templateSlide: 9,
      menuTitle: "Paso 4: Algoritmos y ASCII",
      titleBlack: "Paso 4: Algoritmos de",
      titleAccent: "implementación y ASCII",
      subtitle: "Paso 4",
      paragraphs: [
        "La representación de texto y el cambio de base se estructuran mediante algoritmos discretos deterministas:",
        "• Código ASCII: Mapeo de caracteres a enteros entre 0 y 127 (7 bits), empaquetados en bytes de 8 bits.",
        "• Algoritmo de división sucesiva: Extracción de residuos (N mod 2) y cocientes piso (piso N / 2).",
        "• Secuencia binaria: Los residuos en orden inverso forman la palabra binaria exacta del carácter.",
      ],
      svgDiagramId: "ascii_codificacion",
      apaReferences: [
        "Brookshear, J. G., & Brylow, D. (2020). Computer Science: An Overview (13th ed.). Pearson.",
      ],
      audioNarration: {
        text: "Paso 4: Algoritmos de implementación y código ASCII. Además de números, las computadoras discretizan el lenguaje asignando a cada carácter un código numérico entero único de ocho bits. Para convertir este valor a binario, se utiliza el algoritmo de divisiones sucesivas entre dos, recolectando los residuos en orden inverso.",
        voice: "es-CO-SalomeNeural",
      },
    },
    {
      id: "act1-fuente4",
      key: "fuente4",
      templateSlide: 25,
      menuTitle: "Tabla de referencia ASCII",
      titleBlack: "Tabla de referencia",
      titleAccent: "ASCII y Binario",
      paragraphs: [
        "Consulta esta tabla comparativa de caracteres frecuentes en ingeniería y su representación exacta en decimal, hexadecimal y binario de 8 bits:",
      ],
      interaction: {
        type: "interactive_table",
        tableData: {
          headers: [
            "Carácter",
            "Decimal (Base 10)",
            "Hexadecimal (Base 16)",
            "Binario 8-bit (Base 2)",
            "Observación",
          ],
          rows: [
            ["'0'", "48", "0x30", "00110000", "Primer dígito numérico ASCII"],
            ["'9'", "57", "0x39", "00111001", "Último dígito numérico ASCII"],
            ["'@'", "64", "0x40", "01000000", "Símbolo arroba (precede a 'A')"],
            ["'A'", "65", "0x41", "01000001", "Inicio del alfabeto mayúsculas"],
            ["'U'", "85", "0x55", "01010101", "Patrón alternante 01010101"],
            ["'a'", "97", "0x61", "01100001", "Minúscula = Mayúscula + 32 (bit 5 = 1)"],
          ],
        },
      },
    },
    {
      id: "act1-afianza-cards",
      key: "afianza-cards",
      templateSlide: 23,
      menuTitle: "Afianza: Conceptos clave",
      titleBlack: "Afianza tus",
      titleAccent: "conceptos clave",
      paragraphs: [
        "Gira cada tarjeta interactiva para repasar las definiciones formales de representación numérica discreta antes de resolver los retos prácticos.",
      ],
      interaction: {
        type: "dialogcards",
        instruction: "Haz clic en 'Girar' en cada tarjeta para verificar el concepto:",
        cards: [
          {
            front: "Exponente con sesgo (Biased Exponent) en IEEE-754",
            back: "Campo de 8 bits (en 32 bits) donde se suma +127 al exponente real de base 2 para representar exponentes tanto positivos como negativos sin bit de signo adicional.",
          },
          {
            front: "Mantisa normalizada (1.M)",
            back: "Parte fraccionaria de 23 bits en precisión simple que asume un 1 implícito a la izquierda del punto binario: (−1)^S × (1.M)₂ × 2^(E−127).",
          },
          {
            front: "Error de truncamiento / redondeo binario",
            back: "Diferencia entre el valor matemático real y su aproximación discreta debida al número finito de bits disponibles en la mantisa.",
          },
          {
            front: "Relación entre mayúsculas y minúsculas en ASCII",
            back: "En ASCII estándar, cualquier letra minúscula tiene un código decimal exactamente 32 unidades mayor que su mayúscula (basta activar el sexto bit: 'A'=65=01000001, 'a'=97=01100001).",
          },
        ],
      },
    },
    {
      id: "act1-afianza-algoritmo",
      key: "afianza-algoritmo",
      templateSlide: 26,
      menuTitle: "Afianza: Ordena el algoritmo",
      titleBlack: "Afianza: Algoritmo",
      titleAccent: "IEEE-754 paso a paso",
      paragraphs: [
        "Identifica la secuencia algorítmica correcta para codificar cualquier número real diferente de cero en el estándar IEEE-754 de 32 bits:",
      ],
      interaction: {
        type: "sort_algorithm_steps",
        instruction:
          "Ordena mentalmente los 5 pasos del algoritmo y selecciona los términos clave en orden cronológico:",
        stepsToOrder: [
          "Determinar el bit de *Signo* (0 si es positivo, 1 si es negativo)",
          "Convertir la parte entera y la parte *Fraccionaria* del valor absoluto a base 2",
          "Normalizar el número en notación científica binaria de la forma *UnoPuntoM* por 2 elevado a la k",
          "Calcular el exponente sesgado de 8 bits sumando *CientoVeintisiete* al exponente real k",
          "Escribir los 23 bits de la *Mantisa* rellenando con ceros a la derecha o redondeando",
        ],
      },
    },
    {
      id: "act1-aplica-candado",
      key: "aplica-candado",
      templateSlide: 25,
      menuTitle: "Aplica: Bóveda Binaria",
      titleBlack: "Aplica: Reto de la",
      titleAccent: "Bóveda Binaria (Escape Room)",
      paragraphs: [
        "¡Reto de ingeniería! El sistema de control de una planta automatizada requiere que ingreses tres códigos exactos de memoria discreta para desbloquear el diagnóstico:",
      ],
      interaction: {
        type: "combination_lock",
        instruction:
          "Ingresa el valor exacto en cada campo para abrir el candado binario:",
        textField:
          "Clave 1 — Escribe los 8 bits en binario del carácter ASCII 'A' (decimal 65): *01000001*\n" +
          "Clave 2 — Escribe el valor decimal del sesgo (bias) del exponente en IEEE-754 de 32 bits: *127*\n" +
          "Clave 3 — Escribe el valor decimal del exponente sesgado E para el número −13.625 (donde k = 3): *130*",
        feedback:
          "¡Bóveda desbloqueada! Has calculado con precisión la codificación ASCII y el exponente sesgado IEEE-754.",
      },
    },
    {
      id: "act1-aplica-informe",
      key: "aplica-informe",
      templateSlide: 25,
      menuTitle: "Aplica: Redacta tu análisis",
      titleBlack: "Aplica: Borrador de tu",
      titleAccent: "Informe Técnico (Medio #1)",
      paragraphs: [
        "Utiliza este espacio interactivo para redactar la conclusión técnica de tu evidencia (Medio #1) explicando cómo afecta la representación discreta de 32 bits a los cálculos científicos y descarga tu texto como archivo editable:",
      ],
      interaction: {
        type: "exportable_text_area",
        exportablePrompt: {
          label:
            "Redacta tu síntesis técnica sobre representación discreta (IEEE-754 y ASCII) y haz clic en 'Exportar texto':",
          placeholder:
            "1. Conversión realizada:\n2. Explicación de por qué ocurre pérdida de precisión al discretizar números reales:\n3. Recomendación de ingeniería para mitigar errores de punto flotante:",
        },
      },
    },
    {
      id: "act1-verifica",
      key: "verifica",
      templateSlide: 27,
      menuTitle: "Verifica tu aprendizaje",
      titleBlack: "Verifica tu",
      titleAccent: "aprendizaje",
      paragraphs: [
        "Antes de enviar tu evidencia en Moodle, responde esta verificación final sobre la representación discreta de datos:",
      ],
      interaction: {
        type: "true_false",
        instruction: "Determina si el enunciado técnico es Verdadero o Falso:",
        trueFalse: {
          question:
            "En el estándar IEEE-754 de 32 bits (precisión simple), incrementar el número de bits de la mantisa de 23 a 52 bits (pasando a 64 bits de doble precisión) reduce significativamente el error de redondeo pero sigue siendo una representación discreta y finita.",
          correct: true,
        },
        feedback:
          "¡Correcto! Pasar de 32 a 64 bits amplía la precisión de la mantisa a 52 bits, pero la cantidad de estados representables sigue siendo finita (2^64).",
      },
    },
    {
      id: "act1-cierre",
      key: "cierre",
      templateSlide: 31,
      menuTitle: "Cierre de la Actividad 1",
      titleBlack: "¡Has completado la",
      titleAccent: "Actividad 1!",
      paragraphs: [
        "Ahora comprendes que detrás de cada variable numérica y cada cadena de texto en un computador existe una estructura matemática discreta y finita gobernada por estándares como IEEE-754 y ASCII.",
        "En la próxima actividad conectaremos esta base discreta con el Principio de Inducción Matemática para demostrar formalmente la corrección de algoritmos iterativos y recursivos.",
      ],
    },
    {
      id: "act1-referencias",
      key: "referencias",
      templateSlide: 32,
      menuTitle: "Referencias bibliográficas",
      titleBlack: "Referencias",
      titleAccent: "bibliográficas (APA 7)",
      paragraphs: [],
      apaReferences: [
        "Brookshear, J. G., & Brylow, D. (2020). Computer Science: An Overview (13th ed.). Pearson.",
        "IEEE Computer Society. (2019). IEEE Standard for Floating-Point Arithmetic (IEEE Std 754-2019). IEEE.",
        "Rosen, K. H. (2019). Matemáticas discretas y sus aplicaciones (8.ª ed.). McGraw-Hill.",
        "Sipser, M. (2012). Introduction to the Theory of Computation (3rd ed.). Cengage Learning.",
        "Tanenbaum, A. S. (2016). Structured Computer Organization (6th ed.). Pearson.",
        "Turing, A. M. (1936). On Computable Numbers, with an Application to the Entscheidungsproblem. Proceedings of the London Mathematical Society, 2(42), 230–265.",
      ],
    },
  ],
  auditReport: [
    "Maqueta auditada: 'Maqueta_Actividad_faro_Matematicas_discretas_v2_Comentario.docx' del Prof. Oswaldo Rodríguez Díaz (Reto 11).",
    "Corrección pedagógica en Pregunta 4 de 'Analiza y responde' (Paso 1): En el documento Word del profesor estaba marcada con negrita la opción B por error tipográfico, pero la propia retroalimentación escrita por el profesor explicaba que la respuesta correcta es la opción A (la conversión binaria periódica y el truncamiento discreto). Se configuró la opción A como correcta.",
    "Ajuste de extensión en retroalimentaciones: Las retroalimentaciones originales superaban los 260–310 caracteres; se sintetizaron a menos de 190 caracteres conservando el 100 % del rigor matemático para cumplir la restricción visual de la plantilla institucional UAO (< 200 caracteres).",
    "Se omitió la diapositiva 1 '¿Cómo navegar?' en la Actividad 1 porque la guía institucional estipula que dicha diapositiva solo se incluye en la Actividad 0 (Bienvenida).",
    "Reemplazo de marcadores de imagen pendientes: Las 4 figuras técnicas solicitadas en la maqueta (Conjuntos numéricos, Máquina de Turing, Estructura IEEE-754 de 32 bits y Codificación ASCII/Binario) fueron diseñadas e inyectadas como diagramas vectoriales SVG de alta resolución con textos alternativos WCAG y citas APA en el botón 'Referencias'.",
    "Enriquecimiento interactivo sin permisos de administrador: Se integraron 8 mecánicas interactivas compatibles con mod_hvp 1.28.3 de la UAO (DragText, SingleChoiceSet, Interactive Table, Dialogcards, SortAlgorithmSteps, CombinationLock/Blanks, ExportableTextArea y TrueFalse) más narraciones de audio institucional.",
  ],
  textChanges: [
    "Síntesis de las 4 retroalimentaciones de 'Analiza y responde' a < 190 caracteres por límite de caja en plantilla fiuao-6-215.",
    "Corrección de la clave de respuesta de la pregunta 4 en 'Analiza y responde' (Opción A en lugar de B, alineada con la justificación del autor).",
    "Normalización de títulos de menú izquierdo a ≤ 30 caracteres para evitar desbordamiento en la barra lateral de CoursePresentation 1.27.",
    "Adición de ejemplo numérico guiado completo (−13.625 en IEEE-754 de 32 bits) y tabla comparativa ASCII de 8 bits para andamiar el entregable Medio #1.",
  ],
};

export const INITIAL_RETO11_PROJECTS: HasProjectSpec[] = [
  RETO11_ACT1_SPEC,
  RETO11_ACT0_SPEC,
];

export function getSeedProjectRecords(): HasProjectRecord[] {
  return INITIAL_RETO11_PROJECTS.map((spec) => ({
    id: spec.id,
    user_email: "oswaldo.rodriguez@uao.edu.co",
    title: spec.title,
    course_name: spec.courseName,
    module_name: spec.moduleName,
    activity_number: spec.activityNumber,
    template_id: spec.templateId,
    project_spec: spec,
    ph5p_script: generatePh5pPythonScript(spec),
    moodle_book: generateMoodleBookJson(spec),
    audit_report: spec.auditReport,
    package_url: `/generated/${spec.id}.h5p`,
    slides_count: spec.slides.length + (spec.includeNavigationGuide ? 1 : 0),
    interactions_count: spec.slides.filter((s) => Boolean(s.interaction)).length,
    status: "ready",
    created_at: new Date("2026-11-05T14:00:00Z").toISOString(),
    updated_at: new Date("2026-11-05T16:00:00Z").toISOString(),
  }));
}
