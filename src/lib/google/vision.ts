import { createClient } from "@supabase/supabase-js";

export interface VisionAnalysisResult {
  detectedCrop: string;
  confidence: number;
  visualCondition: "EXCELLENT" | "GOOD" | "AVERAGE" | "POOR" | "UNKNOWN";
  damageIndicators: string[];
  suggestions: string[];
  modelTimestamp: string;
  fallbackUsed: boolean;
  rawLabels?: string[];
  notes?: string;
}

const CROP_DICTIONARY: Record<string, string> = {
  tomato: "Tomato",
  tomatoes: "Tomato",
  potato: "Potato",
  potatoes: "Potato",
  onion: "Onion",
  onions: "Onion",
  chili: "Green Chili",
  chilli: "Green Chili",
  pepper: "Capsicum",
  capsicum: "Capsicum",
  apple: "Apple",
  apples: "Apple",
  banana: "Banana",
  bananas: "Banana",
  mango: "Mango",
  mangoes: "Mango",
  wheat: "Wheat",
  rice: "Paddy/Rice",
  corn: "Maize/Corn",
  maize: "Maize/Corn",
  garlic: "Garlic",
  ginger: "Ginger",
  cabbage: "Cabbage",
  cauliflower: "Cauliflower",
  carrot: "Carrot",
  carrots: "Carrot",
};

const DAMAGE_KEYWORDS: Record<string, string> = {
  rot: "Visible rotting or decay",
  decay: "Visible decay",
  mold: "Possible mold infection",
  fungus: "Fungal marks detected",
  spot: "Surface spotting/blemishes",
  blemish: "Surface blemishes",
  bruise: "Mechanical bruising",
  discoloration: "Color irregularity/discoloration",
  withered: "Dehydration or wilting",
};

/**
 * Analyzes produce photo using Google Cloud Vision API.
 * Vision is strictly an ASSISTIVE feature and does not make authoritative grading decisions.
 * Returns structured domain result or fallback if API call fails.
 */
export async function analyzeProduceImage(
  imageBase64OrUrl: string
): Promise<VisionAnalysisResult> {
  const apiKey = process.env.GOOGLE_VISION_API_KEY;

  if (!apiKey) {
    console.warn("[Vision] GOOGLE_VISION_API_KEY missing. Using manual fallback.");
    return getFallbackResult("Google Vision API key is not configured.");
  }

  try {
    let imagePayload: { content?: string; source?: { imageUri: string } } = {};

    if (imageBase64OrUrl.startsWith("http://") || imageBase64OrUrl.startsWith("https://")) {
      imagePayload = { source: { imageUri: imageBase64OrUrl } };
    } else {
      // Remove data URL prefix if present
      const base64Data = imageBase64OrUrl.replace(/^data:image\/\w+;base64,/, "");
      imagePayload = { content: base64Data };
    }

    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requests: [
            {
              image: imagePayload,
              features: [
                { type: "LABEL_DETECTION", maxResults: 15 },
                { type: "OBJECT_LOCALIZATION", maxResults: 10 },
                { type: "IMAGE_PROPERTIES", maxResults: 1 },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("[Vision] API Error Response:", errText);
      return getFallbackResult(`Vision API error: HTTP ${response.status}`);
    }

    const data = await response.json();
    const result = data.responses?.[0];

    if (!result || result.error) {
      console.error("[Vision] Annotation Error:", result?.error);
      return getFallbackResult(result?.error?.message || "No vision result parsed.");
    }

    // Process Labels
    const labels: Array<{ description: string; score: number }> =
      result.labelAnnotations || [];
    const objects: Array<{ name: string; score: number }> =
      result.localizedObjectAnnotations || [];

    const rawLabels = labels.map((l) => l.description);
    let detectedCrop = "Unknown Produce";
    let highestCropScore = 0;
    const damageIndicators: string[] = [];

    // Search for known crops in labels and objects
    const allDetections = [
      ...labels.map((l) => ({ name: l.description.toLowerCase(), score: l.score })),
      ...objects.map((o) => ({ name: o.name.toLowerCase(), score: o.score })),
    ];

    for (const item of allDetections) {
      for (const [key, cropName] of Object.entries(CROP_DICTIONARY)) {
        if (item.name.includes(key) && item.score > highestCropScore) {
          detectedCrop = cropName;
          highestCropScore = item.score;
        }
      }

      // Check damage indicators
      for (const [dmgKey, dmgDesc] of Object.entries(DAMAGE_KEYWORDS)) {
        if (item.name.includes(dmgKey) && !damageIndicators.includes(dmgDesc)) {
          damageIndicators.push(dmgDesc);
        }
      }
    }

    // Evaluate visual condition from score and damage indicators
    let visualCondition: VisionAnalysisResult["visualCondition"] = "GOOD";
    if (damageIndicators.length >= 2) {
      visualCondition = "POOR";
    } else if (damageIndicators.length === 1) {
      visualCondition = "AVERAGE";
    } else if (highestCropScore > 0.85) {
      visualCondition = "EXCELLENT";
    }

    const suggestions: string[] = [
      "Review crop identification and adjust variety if necessary.",
      "Ensure proper grading before creating marketplace listing.",
    ];

    if (damageIndicators.length > 0) {
      suggestions.push("Check produce for pest or fungal damage before bulk packing.");
    }

    return {
      detectedCrop,
      confidence: Math.round((highestCropScore || 0.75) * 100) / 100,
      visualCondition,
      damageIndicators,
      suggestions,
      modelTimestamp: new Date().toISOString(),
      fallbackUsed: false,
      rawLabels,
      notes: "AI photo assistance result. Farmer must confirm details before submission.",
    };
  } catch (err: any) {
    console.error("[Vision] Exception:", err);
    return getFallbackResult(err?.message || "Vision service exception.");
  }
}

function getFallbackResult(reason: string): VisionAnalysisResult {
  return {
    detectedCrop: "Unspecified Produce",
    confidence: 0,
    visualCondition: "UNKNOWN",
    damageIndicators: [],
    suggestions: ["AI photo assistance unavailable. You can enter the details manually."],
    modelTimestamp: new Date().toISOString(),
    fallbackUsed: true,
    notes: `Fallback triggered: ${reason}`,
  };
}
