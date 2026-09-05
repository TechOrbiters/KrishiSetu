import { sarvamFetch } from "./client";

export interface TTSRequest {
  text: string;
  targetLanguageCode?: string;
  speaker?: "meera" | "ananya" | "arvind" | "shivam";
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

/**
 * Converts text into spoken Indic audio via Sarvam Bulbul TTS model.
 */
export async function generateSpeech(request: TTSRequest): Promise<TTSResult> {
  const {
    text,
    targetLanguageCode = "hi-IN",
    speaker = "meera",
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

  try {
    const data = await sarvamFetch<{
      audios?: string[];
      audio_content?: string;
    }>("/text-to-speech", {
      body: {
        inputs: [text],
        target_language_code: targetLanguageCode,
        speaker,
        pitch,
        pace,
        model: "bulbul:v1",
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
