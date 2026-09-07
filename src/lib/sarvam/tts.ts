import { sarvamFetch } from "./client";

export interface TTSRequest {
  text: string;
  targetLanguageCode?: string;
  speaker?: "aditya" | "priya" | "ritu" | "rahul" | "simran" | "meera" | "ananya" | "arvind" | "shivam" | string;
  pitch?: number;
  pace?: number;
}

export interface TTSResult {
  audioBase64: string | null;
  format: "audio/wav" | "audio/mp3";
  languageCode: string;
  fallbackUsed: boolean;
  notes?: string;
}

const BULBUL_V3_SPEAKERS = new Set([
  'aditya', 'ritu', 'ashutosh', 'priya', 'neha', 'rahul', 'pooja', 'rohan',
  'simran', 'kavya', 'amit', 'dev', 'ishita', 'shreya', 'ratan', 'varun',
  'manan', 'sumit', 'roopa', 'kabir', 'aayan', 'shubh', 'advait', 'anand',
  'tanya', 'tarun', 'sunny', 'mani', 'gokul', 'vijay', 'shruti', 'suhani',
  'mohit', 'kavitha', 'rehan', 'soham', 'rupali'
]);

function resolveSpeaker(speakerInput?: string): string {
  if (!speakerInput) return 'aditya';
  const lower = speakerInput.toLowerCase();
  if (BULBUL_V3_SPEAKERS.has(lower)) return lower;
  if (lower === 'meera' || lower === 'ananya' || lower === 'female') return 'priya';
  if (lower === 'shivam' || lower === 'arvind' || lower === 'male') return 'aditya';
  return 'aditya';
}

/**
 * Converts text into spoken Indic audio via Sarvam Bulbul TTS model.
 */
export async function generateSpeech(request: TTSRequest): Promise<TTSResult> {
  const {
    text,
    targetLanguageCode = "hi-IN",
    speaker = "aditya",
    pitch = 0,
    pace = 1.0,
  } = request;

  if (!text || text.trim().length === 0) {
    return {
      audioBase64: null,
      format: "audio/wav",
      languageCode: targetLanguageCode,
      fallbackUsed: true,
      notes: "Empty text provided to TTS.",
    };
  }

  // Sarvam API limits each input string to at most 500 characters
  let cleanText = text.trim();
  if (cleanText.length > 480) {
    const truncated = cleanText.slice(0, 480);
    const lastPunct = Math.max(
      truncated.lastIndexOf("।"),
      truncated.lastIndexOf("."),
      truncated.lastIndexOf("?"),
      truncated.lastIndexOf("\n")
    );
    cleanText = lastPunct > 100 ? truncated.slice(0, lastPunct + 1) : truncated + "...";
  }

  try {
    const data = await sarvamFetch<{
      audios?: string[];
      audio_content?: string;
    }>("/text-to-speech", {
      body: {
        inputs: [cleanText],
        target_language_code: targetLanguageCode,
        speaker: resolveSpeaker(speaker),
        pitch,
        pace,
        model: "bulbul:v3",
      },
    });

    const audioBase64 = data.audios?.[0] || data.audio_content || null;

    if (!audioBase64) {
      return {
        audioBase64: null,
        format: "audio/wav",
        languageCode: targetLanguageCode,
        fallbackUsed: true,
        notes: "No audio generated from Sarvam TTS response.",
      };
    }

    return {
      audioBase64,
      format: "audio/wav",
      languageCode: targetLanguageCode,
      fallbackUsed: false,
    };
  } catch (err: any) {
    console.warn("[Sarvam TTS] API exception. Returning text fallback.", err?.message || err);
    return {
      audioBase64: null,
      format: "audio/wav",
      languageCode: targetLanguageCode,
      fallbackUsed: true,
      notes: `TTS service unavailable: ${err?.message || "Exception"}`,
    };
  }
}
