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

/**
 * Parses code-mixed Hindi/English speech text for Mandi domain intent and entities.
 */
export function parseIntentFromTranscript(text: string): ExtractedIntent {
  const lower = text.toLowerCase().trim();
  let intent: ExtractedIntent["intent"] = "UNKNOWN";
  let crop: string | undefined;
  let quantity: number | undefined;
  let unit = "kg";
  let pricePerKg: number | undefined;
  let location: string | undefined;

  // Intent Detection
  if (
    lower.includes("list") ||
    lower.includes("bechna") ||
    lower.includes("बेचना") ||
    lower.includes("sell") ||
    lower.includes("paas") ||
    lower.includes("पास") ||
    lower.includes("उपज") ||
    lower.includes("फसल") ||
    lower.includes("crop")
  ) {
    intent = "CREATE_LISTING";
  } else if (lower.includes("buyer") || lower.includes("kharidne") || lower.includes("khareed") || lower.includes("खरीदार")) {
    intent = "FIND_BUYER";
  } else if (lower.includes("bhav") || lower.includes("rate") || lower.includes("price") || lower.includes("daam") || lower.includes("भाव") || lower.includes("दाम")) {
    intent = "CHECK_PRICES";
  } else if (lower.includes("kamaee") || lower.includes("earning") || lower.includes("revenue") || lower.includes("hisab") || lower.includes("कमाई")) {
    intent = "CALCULATE_REVENUE";
  } else if (lower.includes("transporter") || lower.includes("gadi") || lower.includes("truck") || lower.includes("गाड़ी")) {
    intent = "GET_TRANSPORTERS";
  } else if (lower.includes("track") || lower.includes("kahan hai") || lower.includes("status")) {
    intent = "TRACK_ORDER";
  } else if (lower.includes("demand") || lower.includes("demand forecast")) {
    intent = "DEMAND_FORECAST";
  }

  // Crop Detection
  for (const [key, val] of Object.entries(CROP_MAP)) {
    if (lower.includes(key.toLowerCase())) {
      crop = val;
      break;
    }
  }

  // Price Extraction (e.g. 24 rupey, rs 24, 24/kg, 24 रुपये, ₹24, भाव 24)
  const priceSuffixMatch = lower.match(
    /(\d+)\s*(?:रुपये|रुपए|rupey|rupees|rs|\/kg|per kg|प्रति किलो|प्रति किग्रा|प्रति kg)/i
  );
  const pricePrefixMatch = lower.match(/(?:₹|rs\.?|rupees|rupey|rate|bhav|भाव|कीमत)\s*(\d+)/i);

  if (priceSuffixMatch && priceSuffixMatch[1]) {
    const val = parseInt(priceSuffixMatch[1], 10);
    if (val > 0 && val < 100000) pricePerKg = val;
  } else if (pricePrefixMatch && pricePrefixMatch[1]) {
    const val = parseInt(pricePrefixMatch[1], 10);
    if (val > 0 && val < 100000) pricePerKg = val;
  }

  // Quantity Extraction (e.g. 500 kilo, 500 kg, 20 quintal, 20 क्विंटल, 500 किलो)
  const qtyMatch = lower.match(
    /(\d+)\s*(kilo|kg|quintal|ton|tonnes|किलो|क्विंटल|कुंतल|टन|किग्रा)/i
  );
  if (qtyMatch && qtyMatch[1]) {
    const rawQty = parseInt(qtyMatch[1], 10);
    const rawUnit = (qtyMatch[2] || "").toLowerCase();
    if (rawUnit === "quintal" || rawUnit === "क्विंटल" || rawUnit === "कुंतल") {
      quantity = rawQty * 100;
      unit = "kg";
    } else if (rawUnit === "ton" || rawUnit === "tonnes" || rawUnit === "टन") {
      quantity = rawQty * 1000;
      unit = "kg";
    } else {
      quantity = rawQty;
      unit = "kg";
    }
  } else {
    // If no explicit unit, find any number that isn't the price
    const allNumbers = Array.from(lower.matchAll(/\b(\d+)\b/g)).map((m) => parseInt(m[1], 10));
    const nonPrice = allNumbers.find((n) => n !== pricePerKg && n > 0);
    if (nonPrice) {
      quantity = nonPrice;
      unit = "kg";
    }
  }


  // Location Extraction (e.g. in Lucknow, at Barabanki)
  const cityMatch = lower.match(/(in|mein|में|at|se|से)\s+([a-zA-Z\u0900-\u097F]+)/i);
  if (cityMatch && cityMatch[2]) {
    location = cityMatch[2].charAt(0).toUpperCase() + cityMatch[2].slice(1);
  }

  return {
    intent,
    crop,
    quantity,
    unit,
    pricePerKg,
    location,
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
