import { sarvamFetch } from "./client";

export interface TranslateRequest {
  input: string;
  sourceLanguageCode?: string;
  targetLanguageCode: string;
  speakerGender?: "Male" | "Female";
  mode?: "formal" | "modern-colloquial" | "classic-colloquial" | "code-mixed" | "colloquial";
}

export interface TranslateResult {
  translatedText: string;
  sourceLanguageCode: string;
  targetLanguageCode: string;
  fallbackUsed: boolean;
}

/**
 * Translates dynamic text between Indic languages using Sarvam Translate API.
 * Static UI strings must use local dictionary i18n instead of calling this API.
 */
export async function translateText(req: TranslateRequest): Promise<TranslateResult> {
  const { input, sourceLanguageCode = "auto", targetLanguageCode, mode = "formal" } = req;

  if (!input || input.trim().length === 0) {
    return {
      translatedText: "",
      sourceLanguageCode,
      targetLanguageCode,
      fallbackUsed: false,
    };
  }

  let resolvedSource = sourceLanguageCode;
  if (!resolvedSource || resolvedSource === "auto") {
    const isDevanagari = /[\u0900-\u097F]/.test(input);
    resolvedSource = isDevanagari ? "hi-IN" : "en-IN";
  }

  // If source and target match, return input directly without external call
  if (resolvedSource === targetLanguageCode) {
    return {
      translatedText: input,
      sourceLanguageCode: resolvedSource,
      targetLanguageCode,
      fallbackUsed: false,
    };
  }

  const resolvedMode = mode === "colloquial" ? "modern-colloquial" : (mode || "formal");

  try {
    const data = await sarvamFetch<{
      translated_text?: string;
      translated_text_list?: string[];
      source_language_code?: string;
    }>("/translate", {
      body: {
        input,
        source_language_code: resolvedSource,
        target_language_code: targetLanguageCode,
        mode: resolvedMode,
        model: "mayura:v1",
      },
    });

    const translatedText =
      data.translated_text || data.translated_text_list?.[0] || input;

    return {
      translatedText,
      sourceLanguageCode: data.source_language_code || sourceLanguageCode,
      targetLanguageCode,
      fallbackUsed: false,
    };
  } catch (err: any) {
    console.warn("[Sarvam Translate] API exception. Returning original text fallback.", err?.message || err);
    return {
      translatedText: input,
      sourceLanguageCode: sourceLanguageCode || "en-IN",
      targetLanguageCode,
      fallbackUsed: true,
    };
  }
}
