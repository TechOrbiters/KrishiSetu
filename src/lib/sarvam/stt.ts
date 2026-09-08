import { sarvamFetch } from "./client";

export interface ExtractedIntent {
  intent:
    | "CREATE_LISTING"
    | "FIND_BUYER"
    | "CHECK_PRICES"
    | "CALCULATE_REVENUE"
    | "GET_TRANSPORTERS"
    | "TRACK_ORDER"
    | "GET_EARNINGS"
    | "DEMAND_FORECAST"
    | "UNKNOWN";
  crop?: string;
  quantity?: number;
  unit?: string;
  pricePerKg?: number;
  location?: string;
  rawText?: string;
}

export interface STTResult {
  transcript: string;
  languageCode: string;
  extractedIntent: ExtractedIntent;
  confidence: number;
  fallbackUsed: boolean;
}

const CROP_MAP: Record<string, string> = {
  // Hindi Devanagari
  टमाटर: "टमाटर",
  आलू: "आलू",
  प्याज: "प्याज",
  प्याज़: "प्याज",
  गेहूं: "गेहूँ",
  गेहूँ: "गेहूँ",
  गोभी: "गोभी",
  फूलगोभी: "गोभी",
  पत्तागोभी: "पत्तागोभी",
  मिर्च: "हरी मिर्च",
  हरीमिर्च: "हरी मिर्च",
  लहसुन: "लहसुन",
  अदरक: "अदरक",
  चावल: "चावल",
  धान: "धान",
  मक्का: "मक्का",
  बैंगन: "बैंगन",
  भिंडी: "भिंडी",
  गाजर: "गाजर",
  मूली: "मूली",
  मटर: "मटर",
  सरसों: "सरसों",
  चना: "चना",

  // Hinglish / Romanized
  tamatar: "टमाटर",
  tomato: "Tomato",
  tomatoes: "Tomato",
  aalu: "आलू",
  aloo: "आलू",
  potato: "Potato",
  potatoes: "Potato",
  pyaz: "प्याज",
  pyaaz: "प्याज",
  onion: "Onion",
  onions: "Onion",
  gobhi: "गोभी",
  cauliflower: "Cauliflower",
  mirchi: "हरी मिर्च",
  chili: "Green Chili",
  gehu: "गेहूँ",
  wheat: "Wheat",
  chawal: "चावल",
  rice: "Paddy/Rice",
  dhan: "धान",
  paddy: "Paddy/Rice",
  makka: "मक्का",
  corn: "Maize/Corn",
  lehsun: "लहसुन",
  garlic: "Garlic",
  adrak: "अदरक",
  ginger: "Ginger",
  baingan: "बैंगन",
  brinjal: "Eggplant/Brinjal",
  bhindi: "भिंडी",
  okra: "Okra/Ladyfinger",
};

import { parseMandiIntent, ExtractedIntent as MandiExtractedIntent } from "../mandiIntent";

/**
 * Parses code-mixed Hindi/English speech text for Mandi domain intent and entities.
 */
export function parseIntentFromTranscript(text: string): ExtractedIntent {
  const parsed = parseMandiIntent(text);
  return {
    intent: (parsed.intent as any) || "CREATE_LISTING",
    crop: parsed.crop,
    quantity: parsed.quantity,
    unit: parsed.unit || "kg",
    pricePerKg: parsed.pricePerKg,
    location: parsed.location,
    rawText: text,
  };
}

/**
 * Transcribes audio via Sarvam Saaras Speech-to-Text model.
 * Uses current Saaras v4 model with mode = "transcribe".
 * Strictly avoids returning mock fallback transcripts.
 */
export async function transcribeAudio(
  audioBufferOrBase64: Buffer | string,
  model = "saaras:v3"
): Promise<STTResult> {
  const formData = new FormData();

  let blob: Blob;
  if (typeof audioBufferOrBase64 === "string") {
    const base64Clean = audioBufferOrBase64.replace(/^data:audio\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Clean, "base64");
    blob = new Blob([new Uint8Array(buffer)], { type: "audio/webm" });
  } else {
    blob = new Blob([new Uint8Array(audioBufferOrBase64)], { type: "audio/webm" });
  }

  formData.append("file", blob, "recording.webm");
  formData.append("model", model);
  formData.append("mode", "transcribe");

  const data = await sarvamFetch<{
    transcript: string;
    language_code?: string;
    confidence?: number;
  }>("/speech-to-text", {
    body: formData,
    isFormData: true,
  });

  const transcript = (data.transcript || "").trim();
  const languageCode = data.language_code || "hi-IN";
  const extractedIntent = parseIntentFromTranscript(transcript);

  return {
    transcript,
    languageCode,
    extractedIntent,
    confidence: data.confidence ?? 0.95,
    fallbackUsed: false,
  };
}
