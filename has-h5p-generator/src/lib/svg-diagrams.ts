// =============================================================================
// HAS H5P Generator — Motor de Diagramas Vectoriales SVG y Fórmulas Matemáticas
// Identidad Visual UAO (#8A1428 Granate, #0099E6 Azul Facultad, #E0F3FA Fondo)
// =============================================================================

import type { CustomDiagramSpec } from "./custom-diagram";
import type { PresentationTemplateColors } from "./h5p-catalog";

export interface GeneratedSvgAsset {
  filename: string;
  svgContent: string;
  altText: string;
  width: number;
  height: number;
  apaCitation: string;
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export const BUILTIN_RETO11_SVGS: Record<string, GeneratedSvgAsset> = {
  welcome_community: {
    filename: "has-uao-bienvenida.png",
    width: 800,
    height: 600,
    altText:
      "Ilustración institucional UAO sobre comunidad de aprendizaje virtual, foros colaborativos y ruta formativa en Matemáticas Discretas.",
    apaCitation:
      "Equipo 35 HAS [Hermaioni, Alex, Simón]. (2026). Ecosistema de aprendizaje colaborativo UAO [Ilustración vectorial]. Universidad Autónoma de Occidente.",
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#E0F3FA"/>
      <stop offset="100%" stop-color="#FFFFFF"/>
    </linearGradient>
    <linearGradient id="uaoGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#8A1428"/>
      <stop offset="100%" stop-color="#AC0B32"/>
    </linearGradient>
  </defs>
  <rect width="800" height="600" rx="24" fill="url(#bgGrad)"/>
  <rect x="30" y="30" width="740" height="84" rx="16" fill="url(#uaoGrad)"/>
  <text x="60" y="72" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#FFFFFF">CAMPUS DIGITAL UAO · TRAYECTORIA FORMATIVA</text>
  <text x="60" y="98" font-family="Arial, sans-serif" font-size="15" fill="#E0F3FA">Matemáticas Discretas · Comunidad de Aprendizaje y Red Colaborativa</text>

  <!-- Nodos de la ruta de bienvenida -->
  <g transform="translate(55, 155)">
    <rect width="210" height="260" rx="18" fill="#FFFFFF" stroke="#0099E6" stroke-width="3"/>
    <circle cx="105" cy="58" r="32" fill="#E0F3FA"/>
    <text x="105" y="68" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="#8A1428">01</text>
    <text x="105" y="122" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#0B0F19">Foro Social</text>
    <text x="105" y="152" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" fill="#334155">Preséntate en texto,</text>
    <text x="105" y="172" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" fill="#334155">audio, imagen o video</text>
    <text x="105" y="192" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" fill="#334155">y conecta con tu equipo.</text>
    <rect x="35" y="214" width="140" height="28" rx="14" fill="#8A1428"/>
    <text x="105" y="233" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#FFFFFF">Comunidad UAO</text>
  </g>

  <g transform="translate(295, 155)">
    <rect width="210" height="260" rx="18" fill="#FFFFFF" stroke="#0099E6" stroke-width="3"/>
    <circle cx="105" cy="58" r="32" fill="#E0F3FA"/>
    <text x="105" y="68" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="#0099E6">02</text>
    <text x="105" y="122" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#0B0F19">Explora tu Ruta</text>
    <text x="105" y="152" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" fill="#334155">Revisa anuncios, proceso</text>
    <text x="105" y="172" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" fill="#334155">evaluativo y los 4 módulos</text>
    <text x="105" y="192" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" fill="#334155">del ambiente virtual.</text>
    <rect x="35" y="214" width="140" height="28" rx="14" fill="#0099E6"/>
    <text x="105" y="233" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#FFFFFF">Navegación Activa</text>
  </g>

  <g transform="translate(535, 155)">
    <rect width="210" height="260" rx="18" fill="#FFFFFF" stroke="#8A1428" stroke-width="3"/>
    <circle cx="105" cy="58" r="32" fill="#E0F3FA"/>
    <text x="105" y="68" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="#8A1428">03</text>
    <text x="105" y="122" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#0B0F19">Encuentro Sincrónico</text>
    <text x="105" y="152" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" fill="#334155">Participa en la sesión</text>
    <text x="105" y="172" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" fill="#334155">en vivo para despejar dudas</text>
    <text x="105" y="192" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" fill="#334155">e iniciar el Reto 1.</text>
    <rect x="35" y="214" width="140" height="28" rx="14" fill="#1D5CFF"/>
    <text x="105" y="233" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#FFFFFF">Acompañamiento</text>
  </g>

  <rect x="55" y="455" width="690" height="105" rx="16" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2"/>
  <text x="400" y="492" text-anchor="middle" font-family="Arial, sans-serif" font-size="17" font-weight="bold" fill="#8A1428">Competencia Cuantitativa y Pensamiento Lógico-Matemático</text>
  <text x="400" y="520" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#334155">Integrar modelos discretos y algoritmos computacionales en escenarios reales de Ingeniería de Datos y Multimedia.</text>
  <text x="400" y="544" text-anchor="middle" font-family="monospace" font-size="13" font-weight="bold" fill="#0099E6">01010101 01000001 01001111  →  "UAO"  |  IEEE-754 (32 &amp; 64 bits)</text>
</svg>`,
  },

  ieee754_architecture: {
    filename: "has-ieee754-arquitectura.png",
    width: 860,
    height: 580,
    altText:
      "Diagrama técnico del estándar IEEE-754 de 32 bits (precisión simple: 1 bit de signo, 8 bits de exponente con sesgo 127 y 23 bits de mantisa) y 64 bits (precisión doble: 1 bit de signo, 11 bits de exponente con sesgo 1023 y 52 bits de mantisa) junto con la ecuación matemática de reconstrucción.",
    apaCitation:
      "Institute of Electrical and Electronics Engineers [IEEE]. (2019). IEEE Standard for Floating-Point Arithmetic (IEEE 754-2019). Adaptado gráficamente por Equipo 35 HAS - UAO.",
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 860 580" width="860" height="580">
  <rect width="860" height="580" rx="20" fill="#F8FAFC"/>
  <rect x="24" y="20" width="812" height="72" rx="14" fill="#8A1428"/>
  <text x="48" y="52" font-family="Arial, sans-serif" font-size="22" font-weight="bold" fill="#FFFFFF">ESTÁNDAR IEEE-754: ARITMÉTICA DE PUNTO FLOTANTE EN MÁQUINA</text>
  <text x="48" y="76" font-family="Arial, sans-serif" font-size="14" fill="#E0F3FA">Del conjunto infinito de los números reales (ℝ) a una representación finita y discreta de 32 y 64 bits</text>

  <!-- Fórmula Matemática Renderizada en Vector (Reemplaza MathDisplay) -->
  <rect x="24" y="108" width="812" height="86" rx="14" fill="#E0F3FA" stroke="#0099E6" stroke-width="2"/>
  <text x="430" y="136" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#8A1428">MODELO MATEMÁTICO DE NORMALIZACIÓN EN BASE 2</text>
  <text x="430" y="172" text-anchor="middle" font-family="Georgia, serif" font-size="25" font-weight="bold" fill="#0B0F19">
    x = (−1)ˢ × (1 . b₁b₂b₃…bₘ)₂ × 2^(E − Bias)
  </text>

  <!-- Precisión Simple 32 Bits -->
  <g transform="translate(24, 214)">
    <rect width="812" height="155" rx="14" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2"/>
    <text x="24" y="32" font-family="Arial, sans-serif" font-size="17" font-weight="bold" fill="#0B0F19">1. Precisión Simple (binary32 — 32 bits / 4 bytes) · Sesgo (Bias) = 127</text>

    <!-- Bit Signo -->
    <rect x="24" y="48" width="110" height="64" rx="8" fill="#8A1428"/>
    <text x="79" y="75" text-anchor="middle" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#FFFFFF">Signo (S)</text>
    <text x="79" y="98" text-anchor="middle" font-family="monospace" font-size="14" fill="#E0F3FA">1 bit [b₃₁]</text>

    <!-- Exponente -->
    <rect x="144" y="48" width="230" height="64" rx="8" fill="#0099E6"/>
    <text x="259" y="75" text-anchor="middle" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#FFFFFF">Exponente (E = e + 127)</text>
    <text x="259" y="98" text-anchor="middle" font-family="monospace" font-size="14" fill="#FFFFFF">8 bits [b₃₀ … b₂₃]</text>

    <!-- Mantisa -->
    <rect x="384" y="48" width="404" height="64" rx="8" fill="#1D5CFF"/>
    <text x="586" y="75" text-anchor="middle" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#FFFFFF">Mantisa / Fracción Normalizada (M)</text>
    <text x="586" y="98" text-anchor="middle" font-family="monospace" font-size="14" fill="#E0F3FA">23 bits [b₂₂ … b₀] (bit implícito 1.)</text>

    <text x="24" y="138" font-family="monospace" font-size="13" font-weight="bold" fill="#334155">Ejemplo (−12.5)₁₀ = −1100.1₂ = −1.1001₂ × 2³  →  S = 1 | E = 3+127 = 130 (10000010₂) | M = 10010000000000000000000₂</text>
  </g>

  <!-- Precisión Doble 64 Bits -->
  <g transform="translate(24, 386)">
    <rect width="812" height="168" rx="14" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2"/>
    <text x="24" y="32" font-family="Arial, sans-serif" font-size="17" font-weight="bold" fill="#0B0F19">2. Precisión Doble (binary64 — 64 bits / 8 bytes) · Sesgo (Bias) = 1023</text>

    <rect x="24" y="48" width="110" height="64" rx="8" fill="#8A1428"/>
    <text x="79" y="75" text-anchor="middle" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#FFFFFF">Signo (S)</text>
    <text x="79" y="98" text-anchor="middle" font-family="monospace" font-size="14" fill="#E0F3FA">1 bit [b₆₃]</text>

    <rect x="144" y="48" width="250" height="64" rx="8" fill="#0099E6"/>
    <text x="269" y="75" text-anchor="middle" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#FFFFFF">Exponente (E = e + 1023)</text>
    <text x="269" y="98" text-anchor="middle" font-family="monospace" font-size="14" fill="#FFFFFF">11 bits [b₆₂ … b₅₂]</text>

    <rect x="404" y="48" width="384" height="64" rx="8" fill="#0B0F19"/>
    <text x="596" y="75" text-anchor="middle" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#FFFFFF">Mantisa de Alta Precisión (M)</text>
    <text x="596" y="98" text-anchor="middle" font-family="monospace" font-size="14" fill="#0099E6">52 bits [b₅₁ … b₀] (~15-17 dígitos dec.)</text>

    <text x="24" y="140" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#8A1428">Nota clave:</text>
    <text x="105" y="140" font-family="Arial, sans-serif" font-size="13" fill="#334155">Solo un subconjunto finito de números racionales diádicos (k / 2ⁿ) tiene representación exacta en punto flotante.</text>
  </g>
</svg>`,
  },

  turing_machine: {
    filename: "has-maquina-turing.png",
    width: 860,
    height: 560,
    altText:
      "Diagrama formal de la Máquina de Turing con cinta infinita de celdas binarias, cabezal de lectura/escritura, unidad de control de estados finitos y definición de la 7-tupla M = (Q, Sigma, Gamma, delta, q0, B, F).",
    apaCitation:
      "Barchini, G. E. (2008). Las Máquinas de Turing como Modelo General de la Computación. Revista Colombiana de Computación, 10(1), 7-25. Diagrama vectorial por Equipo 35 HAS.",
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 860 560" width="860" height="560">
  <rect width="860" height="560" rx="20" fill="#F8FAFC"/>
  <rect x="24" y="20" width="812" height="72" rx="14" fill="#8A1428"/>
  <text x="48" y="52" font-family="Arial, sans-serif" font-size="22" font-weight="bold" fill="#FFFFFF">PASO 2 · LA MÁQUINA DE TURING Y LOS LENGUAJES FORMALES</text>
  <text x="48" y="76" font-family="Arial, sans-serif" font-size="14" fill="#E0F3FA">Abstracción matemática del procesamiento algorítmico y manipulación discreta de símbolos</text>

  <!-- Definición formal 7-tupla -->
  <rect x="24" y="110" width="812" height="70" rx="12" fill="#E0F3FA" stroke="#0099E6" stroke-width="2"/>
  <text x="430" y="138" text-anchor="middle" font-family="Georgia, serif" font-size="22" font-weight="bold" fill="#0B0F19">
    M = ( Q, Σ, Γ, δ, q₀, B, F )     donde     δ : Q × Γ → Q × Γ × { L, R }
  </text>
  <text x="430" y="164" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" fill="#334155">
    Q: Estados finitos · Σ: Alfabeto de entrada {0,1} · Γ: Símbolos de cinta · δ: Función de transición · q₀: Estado inicial · F: Estados finales
  </text>

  <!-- Cinta Infinita -->
  <g transform="translate(50, 210)">
    <text x="380" y="0" text-anchor="middle" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#8A1428">CINTA INFINITA DE CELDAS DISCRETAS (MEMORIA LINEAL)</text>
    <g transform="translate(0, 16)">
      <rect x="0" y="0" width="84" height="70" fill="#E2E8F0" stroke="#64748B" stroke-width="2"/>
      <text x="42" y="44" text-anchor="middle" font-family="monospace" font-size="24" fill="#475569">B</text>

      <rect x="84" y="0" width="84" height="70" fill="#FFFFFF" stroke="#64748B" stroke-width="2"/>
      <text x="126" y="44" text-anchor="middle" font-family="monospace" font-size="26" font-weight="bold" fill="#0B0F19">0</text>

      <rect x="168" y="0" width="84" height="70" fill="#FFFFFF" stroke="#64748B" stroke-width="2"/>
      <text x="210" y="44" text-anchor="middle" font-family="monospace" font-size="26" font-weight="bold" fill="#0B0F19">1</text>

      <rect x="252" y="0" width="84" height="70" fill="#FFFFFF" stroke="#64748B" stroke-width="2"/>
      <text x="294" y="44" text-anchor="middle" font-family="monospace" font-size="26" font-weight="bold" fill="#0B0F19">0</text>

      <!-- Celda Activa bajo el Cabezal -->
      <rect x="336" y="-6" width="88" height="82" rx="6" fill="#E0F3FA" stroke="#8A1428" stroke-width="4"/>
      <text x="380" y="44" text-anchor="middle" font-family="monospace" font-size="30" font-weight="bold" fill="#8A1428">1</text>

      <rect x="424" y="0" width="84" height="70" fill="#FFFFFF" stroke="#64748B" stroke-width="2"/>
      <text x="466" y="44" text-anchor="middle" font-family="monospace" font-size="26" font-weight="bold" fill="#0B0F19">1</text>

      <rect x="508" y="0" width="84" height="70" fill="#FFFFFF" stroke="#64748B" stroke-width="2"/>
      <text x="550" y="44" text-anchor="middle" font-family="monospace" font-size="26" font-weight="bold" fill="#0B0F19">0</text>

      <rect x="592" y="0" width="84" height="70" fill="#FFFFFF" stroke="#64748B" stroke-width="2"/>
      <text x="634" y="44" text-anchor="middle" font-family="monospace" font-size="26" font-weight="bold" fill="#0B0F19">1</text>

      <rect x="676" y="0" width="84" height="70" fill="#E2E8F0" stroke="#64748B" stroke-width="2"/>
      <text x="718" y="44" text-anchor="middle" font-family="monospace" font-size="24" fill="#475569">B</text>
    </g>

    <!-- Cabezal Lector/Escritor -->
    <polygon points="380,104 354,142 406,142" fill="#8A1428"/>
    <rect x="240" y="142" width="280" height="156" rx="16" fill="#0B0F19" stroke="#0099E6" stroke-width="3"/>
    <text x="380" y="174" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#0099E6">CABEZAL LECTOR / ESCRITOR</text>
    <text x="380" y="204" text-anchor="middle" font-family="monospace" font-size="16" fill="#FFFFFF">Estado Actual: q₂ (Normalizando)</text>
    <text x="380" y="234" text-anchor="middle" font-family="monospace" font-size="15" fill="#E0F3FA">Regla: δ(q₂, '1') = (q₃, '0', R)</text>
    <rect x="275" y="252" width="210" height="30" rx="8" fill="#8A1428"/>
    <text x="380" y="272" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#FFFFFF">1. Lee → 2. Escribe → 3. Mueve</text>
  </g>
</svg>`,
  },

  number_sets_venn: {
    filename: "has-conjuntos-numericos.png",
    width: 840,
    height: 540,
    altText:
      "Diagrama de contención de los conjuntos numéricos Naturales (N), Enteros (Z), Racionales (Q), Irracionales (I) y Reales (R), destacando cuáles son representables de forma exacta en aritmética de punto flotante.",
    apaCitation:
      "Rodríguez Díaz, O., & Equipo 35 HAS. (2026). Jerarquía de conjuntos numéricos y discretización en máquina [Diagrama conceptual]. Universidad Autónoma de Occidente.",
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 840 540" width="840" height="540">
  <rect width="840" height="540" rx="20" fill="#F8FAFC"/>
  <rect x="24" y="20" width="792" height="68" rx="14" fill="#8A1428"/>
  <text x="48" y="50" font-family="Arial, sans-serif" font-size="21" font-weight="bold" fill="#FFFFFF">ACTIVACIÓN DE SABERES: CONJUNTOS NUMÉRICOS (ℕ ⊂ ℤ ⊂ ℚ ⊂ ℝ)</text>
  <text x="48" y="73" font-family="Arial, sans-serif" font-size="14" fill="#E0F3FA">De contar elementos discretos (ℕ) a medir magnitudes continuas (ℝ) y discretizarlas en binario</text>

  <!-- Conjunto R -->
  <rect x="24" y="106" width="792" height="408" rx="18" fill="#FFFFFF" stroke="#0B0F19" stroke-width="3"/>
  <text x="48" y="138" font-family="Arial, sans-serif" font-size="19" font-weight="bold" fill="#0B0F19">ℝ · Números Reales ( ℝ = ℚ ∪ 𝕀 ) — Usados para medir (continuos)</text>

  <!-- Racionales Q -->
  <rect x="46" y="156" width="490" height="334" rx="16" fill="#E0F3FA" stroke="#0099E6" stroke-width="3"/>
  <text x="68" y="188" font-family="Arial, sans-serif" font-size="17" font-weight="bold" fill="#0099E6">ℚ · Racionales = { a/b | a, b ∈ ℤ, b ≠ 0 }</text>
  <text x="68" y="212" font-family="monospace" font-size="14" fill="#0B0F19">Ejemplos: 1/2 = 0.5 (exacto en base 2), 1/3 = 0.333… (periódico)</text>

  <!-- Enteros Z -->
  <rect x="74" y="232" width="434" height="236" rx="14" fill="#FFFFFF" stroke="#1D5CFF" stroke-width="2.5"/>
  <text x="96" y="264" font-family="Arial, sans-serif" font-size="17" font-weight="bold" fill="#1D5CFF">ℤ · Enteros = { …, −3, −2, −1, 0, 1, 2, 3, … }</text>
  <text x="96" y="288" font-family="monospace" font-size="14" fill="#334155">Complemento a 2 / Signo-Magnitud en registros enteros</text>

  <!-- Naturales N -->
  <rect x="104" y="308" width="374" height="138" rx="12" fill="#8A1428"/>
  <text x="291" y="348" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#FFFFFF">ℕ · Naturales = { 1, 2, 3, 4, … }</text>
  <text x="291" y="378" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#E0F3FA">Usados para contar unidades discretas</text>
  <text x="291" y="408" text-anchor="middle" font-family="monospace" font-size="14" font-weight="bold" fill="#FFFFFF">Base 2 directa: 13₁₀ = 1101₂</text>

  <!-- Irracionales I -->
  <rect x="556" y="156" width="238" height="334" rx="16" fill="#FFF7ED" stroke="#FE9800" stroke-width="3"/>
  <text x="675" y="192" text-anchor="middle" font-family="Arial, sans-serif" font-size="17" font-weight="bold" fill="#9A3412">𝕀 · Irracionales</text>
  <text x="675" y="220" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" fill="#7C2D12">No pueden expresarse</text>
  <text x="675" y="240" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" fill="#7C2D12">como fracción a/b.</text>
  <text x="675" y="276" text-anchor="middle" font-family="Georgia, serif" font-size="19" font-weight="bold" fill="#8A1428">π ≈ 3.14159265…</text>
  <text x="675" y="308" text-anchor="middle" font-family="Georgia, serif" font-size="19" font-weight="bold" fill="#8A1428">√2 ≈ 1.41421356…</text>
  <text x="675" y="340" text-anchor="middle" font-family="Georgia, serif" font-size="19" font-weight="bold" fill="#8A1428">e ≈ 2.71828182…</text>
  <rect x="574" y="374" width="202" height="92" rx="10" fill="#8A1428"/>
  <text x="675" y="402" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#FFFFFF">EN PUNTO FLOTANTE:</text>
  <text x="675" y="424" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#E0F3FA">Siempre se truncan o</text>
  <text x="675" y="444" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#E0F3FA">aproximan a un racional.</text>
</svg>`,
  },

  ascii_encoding_flow: {
    filename: "has-ascii-codificacion.png",
    width: 860,
    height: 540,
    altText:
      "Esquema de codificación y decodificación de caracteres en código ASCII de 8 bits (1 byte por carácter) mostrando la conversión paso a paso entre texto, decimal, hexadecimal y binario.",
    apaCitation:
      "American National Standards Institute [ANSI]. (1986). Coded Character Sets - 7-Bit American National Standard Code for Information Interchange (ASCII). Adaptado por Equipo 35 HAS - UAO.",
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 860 540" width="860" height="540">
  <rect width="860" height="540" rx="20" fill="#F8FAFC"/>
  <rect x="24" y="20" width="812" height="68" rx="14" fill="#8A1428"/>
  <text x="48" y="50" font-family="Arial, sans-serif" font-size="21" font-weight="bold" fill="#FFFFFF">PASO 4 · CODIFICACIÓN DE CARACTERES EN CÓDIGO ASCII (8 BITS / 1 BYTE)</text>
  <text x="48" y="73" font-family="Arial, sans-serif" font-size="14" fill="#E0F3FA">Algoritmo directo (Texto → Decimal → Binario de 8 bits) y proceso inverso (Trama binaria → Texto)</text>

  <!-- Tabla visual de ejemplo "UAO" -->
  <g transform="translate(24, 110)">
    <rect width="812" height="260" rx="14" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2"/>
    <rect width="812" height="46" rx="14" fill="#0B0F19"/>
    <text x="90" y="30" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#FFFFFF">CARÁCTER</text>
    <text x="240" y="30" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#0099E6">DECIMAL (DEC)</text>
    <text x="410" y="30" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#E0F3FA">HEXADECIMAL (HEX)</text>
    <text x="640" y="30" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#FE9800">BINARIO (1 BYTE = 8 BITS)</text>

    <!-- Fila U -->
    <line x1="20" y1="112" x2="792" y2="112" stroke="#E2E8F0" stroke-width="1.5"/>
    <text x="90" y="90" text-anchor="middle" font-family="monospace" font-size="26" font-weight="bold" fill="#8A1428">'U'</text>
    <text x="240" y="90" text-anchor="middle" font-family="monospace" font-size="22" font-weight="bold" fill="#0B0F19">85₁₀</text>
    <text x="410" y="90" text-anchor="middle" font-family="monospace" font-size="22" fill="#1D5CFF">0x55</text>
    <rect x="520" y="62" width="240" height="38" rx="8" fill="#E0F3FA"/>
    <text x="640" y="88" text-anchor="middle" font-family="monospace" font-size="22" font-weight="bold" fill="#0B0F19">01010101₂</text>

    <!-- Fila A -->
    <line x1="20" y1="180" x2="792" y2="180" stroke="#E2E8F0" stroke-width="1.5"/>
    <text x="90" y="156" text-anchor="middle" font-family="monospace" font-size="26" font-weight="bold" fill="#8A1428">'A'</text>
    <text x="240" y="156" text-anchor="middle" font-family="monospace" font-size="22" font-weight="bold" fill="#0B0F19">65₁₀</text>
    <text x="410" y="156" text-anchor="middle" font-family="monospace" font-size="22" fill="#1D5CFF">0x41</text>
    <rect x="520" y="128" width="240" height="38" rx="8" fill="#E0F3FA"/>
    <text x="640" y="154" text-anchor="middle" font-family="monospace" font-size="22" font-weight="bold" fill="#0B0F19">01000001₂</text>

    <!-- Fila O -->
    <text x="90" y="224" text-anchor="middle" font-family="monospace" font-size="26" font-weight="bold" fill="#8A1428">'O'</text>
    <text x="240" y="224" text-anchor="middle" font-family="monospace" font-size="22" font-weight="bold" fill="#0B0F19">79₁₀</text>
    <text x="410" y="224" text-anchor="middle" font-family="monospace" font-size="22" fill="#1D5CFF">0x4F</text>
    <rect x="520" y="196" width="240" height="38" rx="8" fill="#E0F3FA"/>
    <text x="640" y="222" text-anchor="middle" font-family="monospace" font-size="22" font-weight="bold" fill="#0B0F19">01001111₂</text>
  </g>

  <!-- Pesos posicionales de 1 Byte -->
  <rect x="24" y="390" width="812" height="126" rx="14" fill="#E0F3FA" stroke="#0099E6" stroke-width="2"/>
  <text x="430" y="420" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#8A1428">PESOS POSICIONALES DE UN BYTE (8 BITS): b₇ b₆ b₅ b₄ b₃ b₂ b₁ b₀</text>
  <text x="430" y="454" text-anchor="middle" font-family="monospace" font-size="20" font-weight="bold" fill="#0B0F19">
    [ 2⁷=128 | 2⁶=64 | 2⁵=32 | 2⁴=16 | 2³=8 | 2²=4 | 2¹=2 | 2⁰=1 ]
  </text>
  <text x="430" y="488" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#334155">
    Proceso inverso: agrupar la cadena binaria en bloques de 8 bits, sumar las potencias activas y mapear al carácter ASCII.
  </text>
</svg>`,
  },
};

// Aliases para compatibilidad con identificadores en español de Reto 11
BUILTIN_RETO11_SVGS["conjuntos_numericos"] = BUILTIN_RETO11_SVGS["number_sets_venn"];
BUILTIN_RETO11_SVGS["maquina_turing"] = BUILTIN_RETO11_SVGS["turing_machine"];
BUILTIN_RETO11_SVGS["ieee_754_32bits"] = BUILTIN_RETO11_SVGS["ieee754_architecture"];
BUILTIN_RETO11_SVGS["ascii_codificacion"] = BUILTIN_RETO11_SVGS["ascii_encoding_flow"];

export function generateCustomConceptSvg(params: {
  id: string;
  title: string;
  subtitle: string;
  formula?: string;
  highlights: string[];
}): GeneratedSvgAsset {
  const safeTitle = escapeXml(params.title.slice(0, 58));
  const safeSub = escapeXml(params.subtitle.slice(0, 90));
  const safeFormula = escapeXml(
    params.formula || "f(n) : Dominio Discreto → Representación Binaria {0, 1}*"
  );
  const rawItems = (params.highlights || []).filter(Boolean);
  const defaultItems = [
    "Comprender y traducir la información a representación discreta.",
    "Modelar con precisión considerando las limitaciones de memoria finita.",
    "Diseñar y validar algoritmos robustos ante truncamiento y desbordamiento.",
  ];
  const items = [
    rawItems[0] || defaultItems[0],
    rawItems[1] || defaultItems[1],
    rawItems[2] || defaultItems[2],
  ];

  const cardsXml = items
    .map((item, idx) => {
      const x = 36 + idx * 260;
      const color = idx === 0 ? "#8A1428" : idx === 1 ? "#0099E6" : "#1D5CFF";
      const lines = item.match(/.{1,30}(\s|$)/g) || [item];
      return `<g transform="translate(${x}, 220)">
        <rect width="240" height="230" rx="16" fill="#FFFFFF" stroke="${color}" stroke-width="3"/>
        <rect x="20" y="20" width="44" height="44" rx="10" fill="${color}"/>
        <text x="42" y="50" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" font-weight="bold" fill="#FFFFFF">0${idx + 1}</text>
        ${lines
          .slice(0, 4)
          .map(
            (l, li) =>
              `<text x="20" y="${105 + li * 26}" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#0B0F19">${escapeXml(
                l.trim()
              )}</text>`
          )
          .join("\n")}
      </g>`;
    })
    .join("\n");

  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 840 520" width="840" height="520">
  <rect width="840" height="520" rx="20" fill="#F8FAFC"/>
  <rect x="24" y="20" width="792" height="76" rx="14" fill="#8A1428"/>
  <text x="48" y="54" font-family="Arial, sans-serif" font-size="21" font-weight="bold" fill="#FFFFFF">${safeTitle}</text>
  <text x="48" y="80" font-family="Arial, sans-serif" font-size="14" fill="#E0F3FA">${safeSub}</text>
  <rect x="24" y="114" width="792" height="82" rx="14" fill="#E0F3FA" stroke="#0099E6" stroke-width="2"/>
  <text x="420" y="142" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#8A1428">ESQUEMA SINTÉTICO INSTITUCIONAL UAO</text>
  <text x="420" y="174" text-anchor="middle" font-family="Georgia, serif" font-size="20" font-weight="bold" fill="#0B0F19">${safeFormula}</text>
  ${cardsXml}
</svg>`;

  return {
    filename: `has-custom-${params.id}.png`,
    svgContent,
    altText: `Infografía técnica institucional UAO sobre ${params.title}: ${params.subtitle}`,
    width: 840,
    height: 520,
    apaCitation: `Equipo 35 HAS & Campus Digital UAO. (2026). ${params.title} [Esquema gráfico]. Universidad Autónoma de Occidente.`,
  };
}

function wrapDiagramText(value: string, maxChars: number): string[] {
  const words = value.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 3);
}

function diagramText(
  x: number,
  y: number,
  value: string,
  options: { maxChars?: number; fontSize?: number; fill?: string; anchor?: "start" | "middle" | "end"; weight?: number } = {}
): string {
  const lines = wrapDiagramText(value, options.maxChars ?? 28);
  const fontSize = options.fontSize ?? 18;
  return `<text x="${x}" y="${y}" text-anchor="${options.anchor ?? "middle"}" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="${options.weight ?? 500}" fill="${options.fill ?? "#0F172A"}">${lines.map((line, index) => `<tspan x="${x}" dy="${index === 0 ? 0 : fontSize + 5}">${escapeXml(line)}</tspan>`).join("")}</text>`;
}

function nodeShape(
  x: number,
  y: number,
  width: number,
  height: number,
  label: string,
  detail: string | undefined,
  type: string,
  colors: PresentationTemplateColors,
  index: number
): string {
  const fill = type === "start" || type === "end" ? colors.primary : index % 2 === 0 ? colors.cardBg : colors.highlightBg;
  const stroke = index % 2 === 0 ? colors.primary : colors.accent;
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  const shape = type === "decision"
    ? `<polygon points="${centerX},${y} ${x + width},${centerY} ${centerX},${y + height} ${x},${centerY}" fill="${fill}" stroke="${stroke}" stroke-width="4"/>`
    : `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${type === "start" || type === "end" ? 38 : 18}" fill="${fill}" stroke="${stroke}" stroke-width="4"/>`;
  const textColor = type === "start" || type === "end" ? colors.badgeText : colors.textPrimary;
  const labelLines = wrapDiagramText(label, 22);
  const labelStartY = detail ? centerY - 8 - ((labelLines.length - 1) * 12) : centerY + 7 - ((labelLines.length - 1) * 12);
  const labelXml = diagramText(centerX, labelStartY, label, { maxChars: 22, fontSize: 19, fill: textColor, weight: 700 });
  const detailXml = detail
    ? diagramText(centerX, labelStartY + labelLines.length * 24, detail, { maxChars: 30, fontSize: 14, fill: textColor })
    : "";
  return `<g>${shape}${labelXml}${detailXml}</g>`;
}

function flowDiagram(params: CustomDiagramSpec, colors: PresentationTemplateColors): string {
  const nodes = params.nodes.slice(0, 8);
  const columns = Math.min(nodes.length, 4);
  const cellWidth = 186;
  const cellHeight = 104;
  const startX = 72;
  const startY = nodes.length <= 4 ? 280 : 218;
  const positions = nodes.map((_, index) => ({
    x: startX + (index % columns) * 218,
    y: startY + Math.floor(index / columns) * 172,
  }));
  const nodeIndex = new Map(nodes.map((node, index) => [node.id, index]));
  const edgesXml = params.edges.map((edge) => {
    const fromIndex = nodeIndex.get(edge.from);
    const toIndex = nodeIndex.get(edge.to);
    if (fromIndex === undefined || toIndex === undefined) return "";
    const from = positions[fromIndex];
    const to = positions[toIndex];
    const x1 = from.x + cellWidth / 2;
    const y1 = from.y + cellHeight / 2;
    const x2 = to.x + cellWidth / 2;
    const y2 = to.y + cellHeight / 2;
    const label = edge.label
      ? diagramText((x1 + x2) / 2, (y1 + y2) / 2 - 8, edge.label, { maxChars: 18, fontSize: 13, fill: colors.textMuted })
      : "";
    return `<g><path d="M ${x1} ${y1} L ${x2} ${y2}" fill="none" stroke="${colors.accent}" stroke-width="5" marker-end="url(#arrow)"/>${label}</g>`;
  }).join("");
  const nodesXml = nodes.map((node, index) => nodeShape(
    positions[index].x,
    positions[index].y,
    cellWidth,
    cellHeight,
    node.label,
    node.detail,
    node.type,
    colors,
    index
  )).join("");
  return `${edgesXml}${nodesXml}`;
}

function comparisonDiagram(params: CustomDiagramSpec, colors: PresentationTemplateColors): string {
  const nodes = params.nodes.slice(0, 4);
  const columns = Math.min(2, nodes.length);
  const cardWidth = 360;
  const cardX = [94, 546];
  const headerY = 205;
  const cards = nodes.slice(0, columns).map((node, index) => {
    const x = cardX[index];
    const fill = index === 0 ? colors.highlightBg : colors.cardBg;
    const bullets = (node.detail ? [node.detail, ...params.highlights.slice(index, index + 2)] : params.highlights.slice(index * 2, index * 2 + 3)).filter(Boolean).slice(0, 3);
    return `<g><rect x="${x}" y="${headerY}" width="${cardWidth}" height="282" rx="22" fill="${fill}" stroke="${index === 0 ? colors.primary : colors.accent}" stroke-width="4"/><rect x="${x}" y="${headerY}" width="${cardWidth}" height="72" rx="22" fill="${index === 0 ? colors.primary : colors.accent}"/>${diagramText(x + cardWidth / 2, headerY + 46, node.label, { maxChars: 27, fontSize: 22, fill: colors.badgeText, weight: 700 })}${bullets.map((item, bulletIndex) => `<circle cx="${x + 34}" cy="${headerY + 122 + bulletIndex * 55}" r="7" fill="${index === 0 ? colors.primary : colors.accent}"/>${diagramText(x + 58, headerY + 128 + bulletIndex * 55, item, { maxChars: 31, fontSize: 16, fill: colors.textPrimary, anchor: "start" })}`).join("")}</g>`;
  }).join("");
  return cards;
}

function timelineDiagram(params: CustomDiagramSpec, colors: PresentationTemplateColors): string {
  const nodes = params.nodes.slice(0, 6);
  const startX = 104;
  const gap = nodes.length > 1 ? 792 / (nodes.length - 1) : 0;
  const axisY = 350;
  const axis = `<line x1="${startX}" y1="${axisY}" x2="${startX + 792}" y2="${axisY}" stroke="${colors.primary}" stroke-width="7" stroke-linecap="round"/>`;
  return axis + nodes.map((node, index) => {
    const x = startX + index * gap;
    const above = index % 2 === 0;
    const boxY = above ? 190 : 404;
    const boxX = Math.max(32, Math.min(808, x - 80));
    return `<g><line x1="${x}" y1="${above ? axisY - 8 : axisY + 8}" x2="${x}" y2="${above ? boxY + 104 : boxY}" stroke="${colors.accent}" stroke-width="4"/><circle cx="${x}" cy="${axisY}" r="15" fill="${colors.accent}" stroke="#FFFFFF" stroke-width="5"/><rect x="${boxX}" y="${boxY}" width="160" height="104" rx="16" fill="${colors.cardBg}" stroke="${index % 2 === 0 ? colors.primary : colors.accent}" stroke-width="3"/>${diagramText(boxX + 80, boxY + 38, node.label, { maxChars: 18, fontSize: 17, weight: 700 })}${node.detail ? diagramText(boxX + 80, boxY + 71, node.detail, { maxChars: 22, fontSize: 13, fill: colors.textMuted }) : ""}</g>`;
  }).join("");
}

function conceptDiagram(params: CustomDiagramSpec, colors: PresentationTemplateColors): string {
  const nodes = params.nodes.slice(0, 6);
  const center = { x: 500, y: 350 };
  const radiusX = 338;
  const radiusY = 125;
  const positions = nodes.map((_, index) => {
    const angle = -Math.PI / 2 + (Math.PI * 2 * index) / nodes.length;
    return { x: center.x + Math.cos(angle) * radiusX, y: center.y + Math.sin(angle) * radiusY };
  });
  const edges = params.edges.map((edge) => {
    const from = positions[nodes.findIndex((node) => node.id === edge.from)];
    const to = positions[nodes.findIndex((node) => node.id === edge.to)];
    if (!from || !to) return "";
    return `<line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" stroke="${colors.cardBorder}" stroke-width="5"/>`;
  }).join("");
  const nodeXml = nodes.map((node, index) => nodeShape(
    positions[index].x - 88,
    positions[index].y - 51,
    176,
    102,
    node.label,
    node.detail,
    index === 0 ? "start" : node.type,
    colors,
    index
  )).join("");
  return `${edges}${nodeXml}`;
}

function graphDiagram(params: CustomDiagramSpec, colors: PresentationTemplateColors): string {
  const graph = params.graph!;
  const left = 140;
  const top = 220;
  const width = 720;
  const height = 245;
  const pointX = (x: number) => left + ((x - graph.xMin) / (graph.xMax - graph.xMin)) * width;
  const pointY = (y: number) => top + height - ((y - graph.yMin) / (graph.yMax - graph.yMin)) * height;
  const grid = Array.from({ length: 5 }, (_, index) => {
    const x = left + (width * index) / 4;
    const y = top + (height * index) / 4;
    return `<line x1="${x}" y1="${top}" x2="${x}" y2="${top + height}" stroke="${colors.cardBorder}" stroke-width="2"/><line x1="${left}" y1="${y}" x2="${left + width}" y2="${y}" stroke="${colors.cardBorder}" stroke-width="2"/>`;
  }).join("");
  const path = graph.points.map((point, index) => `${index === 0 ? "M" : "L"} ${pointX(point.x)} ${pointY(point.y)}`).join(" ");
  const points = graph.points.map((point) => `<circle cx="${pointX(point.x)}" cy="${pointY(point.y)}" r="8" fill="${colors.accent}" stroke="#FFFFFF" stroke-width="3"/>`).join("");
  const xTicks = [graph.xMin, graph.xMax].map((value) => diagramText(pointX(value), top + height + 26, String(value), { fontSize: 14, fill: colors.textMuted })).join("");
  const yTicks = [graph.yMin, graph.yMax].map((value) => diagramText(left - 30, pointY(value) + 5, String(value), { fontSize: 14, fill: colors.textMuted, anchor: "end" })).join("");
  return `${grid}<path d="${path}" fill="none" stroke="${colors.primary}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>${points}${xTicks}${yTicks}${diagramText(left + width / 2, 520, graph.xLabel, { fontSize: 16, weight: 700, fill: colors.textPrimary })}<text x="34" y="340" transform="rotate(-90 34 340)" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="700" fill="${colors.textPrimary}">${escapeXml(graph.yLabel)}</text>`;
}

export function generateCustomDiagramSvg(params: CustomDiagramSpec & { id: string; theme: PresentationTemplateColors }): GeneratedSvgAsset {
  const colors = params.theme;
  const diagramContent = params.kind === "flow"
    ? flowDiagram(params, colors)
    : params.kind === "comparison"
      ? comparisonDiagram(params, colors)
      : params.kind === "timeline"
        ? timelineDiagram(params, colors)
        : params.kind === "graph"
          ? graphDiagram(params, colors)
          : conceptDiagram(params, colors);
  const title = escapeXml(params.title);
  const subtitle = escapeXml(params.subtitle);
  const formula = params.formula ? `<rect x="110" y="150" width="780" height="32" rx="12" fill="${colors.highlightBg}"/><text x="500" y="171" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" font-weight="700" fill="${colors.textPrimary}">${escapeXml(params.formula.slice(0, 100))}</text>` : "";
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 600" width="1000" height="600"><defs><marker id="arrow" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto"><path d="M 0 0 L 12 6 L 0 12 z" fill="${colors.accent}"/></marker></defs><rect width="1000" height="600" rx="24" fill="${colors.background}"/><rect x="32" y="28" width="936" height="112" rx="20" fill="${colors.primary}"/><text x="66" y="78" font-family="Arial, sans-serif" font-size="30" font-weight="700" fill="${colors.badgeText}">${title}</text><text x="66" y="116" font-family="Arial, sans-serif" font-size="18" fill="${colors.badgeText}">${subtitle}</text><rect x="38" y="160" width="924" height="390" rx="24" fill="${colors.cardBg}" stroke="${colors.cardBorder}" stroke-width="3"/>${diagramContent}${formula}</svg>`;
  const safeId = params.id.replace(/[^A-Za-z0-9_-]/g, "-").slice(0, 80) || "diagram";

  return {
    filename: `has-custom-${safeId}.png`,
    svgContent,
    altText: `Diagrama ${params.kind}: ${params.title}. ${params.subtitle}`,
    width: 1000,
    height: 600,
    apaCitation: `Equipo 35 HAS & Campus Digital UAO. (2026). ${params.title} [Diagrama ${params.kind}]. Universidad Autónoma de Occidente.`,
  };
}
