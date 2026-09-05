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
  tamatar: "Tomato",
  tomato: "Tomato",
  tomatoes: "Tomato",
  aalu: "Potato",
  aloo: "Potato",
  potato: "Potato",
  pyaz: "Onion",
  pyaaz: "Onion",
  onion: "Onion",
  mirchi: "Green Chili",
  chili: "Green Chili",
  gehu: "Wheat",
  wheat: "Wheat",
  chawal: "Paddy/Rice",
  rice: "Paddy/Rice",
  makka: "Maize/Corn",
  corn: "Maize/Corn",
  lehsun: "Garlic",
  garlic: "Garlic",
  adrak: "Ginger",
  ginger: "Ginger",
};

/**
 * Parses code-mixed Hindi/English speech text for Mandi domain intent and entities.
 */
export function parseIntentFromTranscript(text: string): ExtractedIntent {
  const lower = text.toLowerCase();
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
    lower.includes("sell") ||
    lower.includes("paas") ||
    lower.includes("crop")
  ) {
    intent = "CREATE_LISTING";
  } else if (lower.includes("buyer") || lower.includes("kharidne") || lower.includes("khareed")) {
    intent = "FIND_BUYER";
  } else if (lower.includes("bhav") || lower.includes("rate") || lower.includes("price") || lower.includes("daam")) {
    intent = "CHECK_PRICES";
  } else if (lower.includes("kamaee") || lower.includes("earning") || lower.includes("revenue") || lower.includes("hisab")) {
    intent = "CALCULATE_REVENUE";
  } else if (lower.includes("transporter") || lower.includes("gadi") || lower.includes("truck")) {
    intent = "GET_TRANSPORTERS";
  } else if (lower.includes("track") || lower.includes("kahan hai") || lower.includes("status")) {
    intent = "TRACK_ORDER";
  } else if (lower.includes("demand") || lower.includes("demand forecast")) {
    intent = "DEMAND_FORECAST";
  }

  // Crop Detection
  for (const [key, val] of Object.entries(CROP_MAP)) {
    if (lower.includes(key)) {
      crop = val;
      break;
    }
  }

  // Quantity Extraction (e.g. 500 kilo, 500 kg, 20 quintal)
  const qtyMatch = lower.match(/(\d+)\s*(kilo|kg|quintal|ton|tonnes)/i);
  if (qtyMatch) {
    const rawQty = parseInt(qtyMatch[1], 10);
    const rawUnit = qtyMatch[2].toLowerCase();
    if (rawUnit === "quintal") {
      quantity = rawQty * 100;
      unit = "kg";
    } else if (rawUnit === "ton" || rawUnit === "tonnes") {
      quantity = rawQty * 1000;
      unit = "kg";
    } else {
      quantity = rawQty;
      unit = "kg";
    }
  } else {
    // Standalone number extraction if crop exists
    const standaloneMatch = lower.match(/(\d+)/);
    if (standaloneMatch && crop) {
      quantity = parseInt(standaloneMatch[1], 10);
    }
  }

  // Price Extraction (e.g. 24 rupey, rs 24, 24/kg)
  const priceMatch = lower.match(/(rs|rupey|rupees|₹)?\s*(\d+)\s*(per kg|\/kg|rupey|rs)?/i);
  if (priceMatch && priceMatch[2]) {
    const val = parseInt(priceMatch[2], 10);
    if (val > 0 && val < 500 && val !== quantity) {
      pricePerKg = val;
    }
  }

  // Location Extraction (e.g. Lucknow, Kanpur, Delhi)
  const cityMatch = lower.match(/(in|mein|at|se)\s+([a-zA-Z]+)/i);
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
 */
export async function transcribeAudio(
  audioBufferOrBase64: Buffer | string,
  model = "saaras:v1"
): Promise<STTResult> {
  try {
    const formData = new FormData();

    let blob: Blob;
    if (typeof audioBufferOrBase64 === "string") {
      const base64Clean = audioBufferOrBase64.replace(/^data:audio\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Clean, "base64");
      blob = new Blob([new Uint8Array(buffer)], { type: "audio/wav" });
    } else {
      blob = new Blob([new Uint8Array(audioBufferOrBase64)], { type: "audio/wav" });
    }

    formData.append("file", blob, "input.wav");
    formData.append("model", model);
    formData.append("with_intent", "true");

    const data = await sarvamFetch<{
      transcript: string;
      language_code?: string;
      confidence?: number;
    }>("/speech-to-text", {
      body: formData,
      isFormData: true,
    });

    const transcript = data.transcript || "";
    const languageCode = data.language_code || "hi-IN";
    const extractedIntent = parseIntentFromTranscript(transcript);

    return {
      transcript,
      languageCode,
      extractedIntent,
      confidence: data.confidence || 0.9,
      fallbackUsed: false,
    };
  } catch (err: any) {
    console.warn("[Sarvam STT] Exception or fallback required:", err?.message || err);
    return {
      transcript: "Mere paas 500 kilo tamatar hain.",
      languageCode: "hi-IN",
      extractedIntent: parseIntentFromTranscript("Mere paas 500 kilo tamatar hain."),
      confidence: 0.8,
      fallbackUsed: true,
    };
  }
}
