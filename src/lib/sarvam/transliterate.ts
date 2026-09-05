import { sarvamFetch } from "./client";

export interface TransliterateRequest {
  input: string;
  sourceLanguageCode?: string;
  targetLanguageCode?: string; // e.g. 'hi-IN'
}

export interface TransliterateResult {
  transliteratedText: string;
  sourceLanguageCode: string;
  targetLanguageCode: string;
  fallbackUsed: boolean;
}

const STATIC_TRANSLITERATION_MAP: Record<string, string> = {
  tamatar: "टमाटर",
  aalu: "आलू",
  aloo: "आलू",
  pyaz: "प्याज",
  pyaaz: "प्याज",
  mirchi: "मिर्च",
  gehu: "गेहूं",
  chawal: "चावल",
  makka: "मक्का",
  lehsun: "लहसुन",
  adrak: "अदरक",
};

/**
 * Transliterates text between scripts (e.g. Roman Hindi -> Devanagari Hindi) for search normalization.
 */
export async function transliterateText(
  req: TransliterateRequest
): Promise<TransliterateResult> {
  const { input, sourceLanguageCode = "en-IN", targetLanguageCode = "hi-IN" } = req;

  if (!input || input.trim().length === 0) {
    return {
      transliteratedText: "",
      sourceLanguageCode,
      targetLanguageCode,
      fallbackUsed: false,
    };
  }

  const lower = input.trim().toLowerCase();
  if (STATIC_TRANSLITERATION_MAP[lower]) {
    return {
      transliteratedText: STATIC_TRANSLITERATION_MAP[lower],
      sourceLanguageCode,
      targetLanguageCode,
      fallbackUsed: false,
    };
  }

  try {
    const data = await sarvamFetch<{
      transliterated_text?: string;
    }>("/transliterate", {
      body: {
        input,
        source_language_code: sourceLanguageCode,
        target_language_code: targetLanguageCode,
      },
    });

    const transliteratedText = data.transliterated_text || input;

    return {
      transliteratedText,
      sourceLanguageCode,
      targetLanguageCode,
      fallbackUsed: false,
    };
  } catch (err: any) {
    console.warn("[Sarvam Transliterate] API exception. Returning input fallback.", err?.message || err);
    return {
      transliteratedText: input,
      sourceLanguageCode,
      targetLanguageCode,
      fallbackUsed: true,
    };
  }
}
