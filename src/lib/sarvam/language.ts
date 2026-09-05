import { sarvamFetch } from "./client";

export interface LanguageDetectionResult {
  detectedLanguage: string; // e.g. 'hi-IN', 'ta-IN', 'en-IN'
  confidence: number;
  script?: string;
  fallbackUsed: boolean;
}

/**
 * Identifies language of text input using Sarvam AI Language Identification API.
 */
export async function detectLanguage(text: string): Promise<LanguageDetectionResult> {
  if (!text || text.trim().length === 0) {
    return {
      detectedLanguage: "hi-IN",
      confidence: 1.0,
      fallbackUsed: false,
    };
  }

  try {
    const data = await sarvamFetch<{
      language_code?: string;
      detected_language?: string;
      confidence?: number;
      script?: string;
    }>("/text-language-detection", {
      body: {
        input: text,
      },
    });

    const detectedLanguage = data.language_code || data.detected_language || "hi-IN";

    return {
      detectedLanguage,
      confidence: data.confidence || 0.9,
      script: data.script,
      fallbackUsed: false,
    };
  } catch (err: any) {
    console.warn("[Sarvam Language] Exception or fallback required:", err?.message || err);
    // Simple heuristic fallback for basic script detection
    const isDevanagari = /[\u0900-\u097F]/.test(text);
    return {
      detectedLanguage: isDevanagari ? "hi-IN" : "en-IN",
      confidence: 0.7,
      fallbackUsed: true,
    };
  }
}
