// =============================================================================
// HAS H5P Generator — Motor Servidor de Síntesis de Voz Institucional
// Doble motor con respaldo y dynamic import() para serverless
// =============================================================================

const ALLOWED_VOICES: Record<string, string> = {
  "es-CO-SalomeNeural": "es-CO-SalomeNeural",
  "es-CO-GonzaloNeural": "es-CO-GonzaloNeural",
  "es-MX-DaliaNeural": "es-MX-DaliaNeural",
  "es-MX-JorgeNeural": "es-MX-JorgeNeural",
  "es-ES-ElviraNeural": "es-ES-ElviraNeural",
  "es-ES-AlvaroNeural": "es-ES-AlvaroNeural",
  "es-AR-ElenaNeural": "es-AR-ElenaNeural",
  "en-US-AnaNeural": "en-US-AnaNeural",
  "en-US-GuyNeural": "en-US-GuyNeural",
  "en-US-AriaNeural": "en-US-AriaNeural",
  "en-GB-SoniaNeural": "en-GB-SoniaNeural",
  "en-GB-RyanNeural": "en-GB-RyanNeural",
};

export function cleanTextForTts(rawText: string): string {
  return rawText
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/#{1,6}\s/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 1800);
}

async function synthWithMsEdge(
  text: string,
  voiceId: string,
  rate: string
): Promise<Buffer> {
  const { MsEdgeTTS, OUTPUT_FORMAT } = await import("msedge-tts");
  const tts = new MsEdgeTTS();
  await tts.setMetadata(voiceId, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
  const { audioStream } = tts.toStream(text, { rate });
  const chunks: Buffer[] = [];
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error("msedge-tts timeout (10s)")),
      10000
    );
    audioStream.on("data", (chunk: Buffer) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    audioStream.on("end", () => {
      clearTimeout(timeout);
      resolve();
    });
    audioStream.on("error", (err: Error) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
  const buf = Buffer.concat(chunks);
  if (buf.length === 0) {
    throw new Error("msedge-tts devolvió buffer vacío");
  }
  return buf;
}

async function synthWithUniversal(
  text: string,
  voiceId: string,
  rate: string
): Promise<Buffer> {
  const { EdgeTTS } = await import("edge-tts-universal");
  const tts = new EdgeTTS(text, voiceId, {
    rate,
    volume: "+0%",
    pitch: "+0Hz",
  });
  const result = await Promise.race([
    tts.synthesize(),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("edge-tts-universal timeout (6s)")), 6000)
    ),
  ]);
  const arrayBuf = await result.audio.arrayBuffer();
  const buf = Buffer.from(arrayBuf);
  if (buf.length === 0) {
    throw new Error("edge-tts-universal devolvió buffer vacío");
  }
  return buf;
}

export async function synthesizeEdgeTtsMp3(
  rawText: string,
  voice = "es-CO-SalomeNeural",
  rate = "+0%"
): Promise<{ buffer: Buffer; voiceId: string; engine: string }> {
  const cleaned = cleanTextForTts(rawText);
  if (!cleaned) {
    throw new Error("Texto vacío para síntesis de voz");
  }
  const voiceId = ALLOWED_VOICES[voice] || "es-CO-SalomeNeural";

  try {
    const buffer = await synthWithMsEdge(cleaned, voiceId, rate);
    return { buffer, voiceId, engine: "msedge-tts" };
  } catch (err1: any) {
    console.warn(
      "[EdgeTTS] Primary msedge-tts failed, trying edge-tts-universal fallback:",
      err1?.message
    );
    const buffer = await synthWithUniversal(cleaned, voiceId, rate);
    return { buffer, voiceId, engine: "edge-tts-universal" };
  }
}
