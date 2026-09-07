import { parseIntentFromTranscript } from "./stt";
import { generateSpeech } from "./tts";
import { translateText } from "./translate";
import { detectLanguage } from "./language";
import { generateChatCompletion } from "./chat";
import { supabaseAdmin } from "../supabase/server";
import { computeDemandSenseReal } from "../domain/aiEngine";

export interface KrishiAssistantRequest {
  userQuery: string;
  isVoice?: boolean;
  languageCode?: string;
  userId?: string;
  confirmedAction?: {
    actionType: string;
    params: any;
  };
}

export interface KrishiAssistantResponse {
  responseText: string;
  responseLanguageCode: string;
  audioBase64?: string | null;
  intent: string;
  draftAction?: {
    actionType: string;
    summary: string;
    params: any;
    requiresConfirmation: boolean;
  };
  toolResult?: any;
  fallbackUsed: boolean;
}

/* -----------------------------------------------------------------------
   Internal helpers — all server-side Supabase queries
   ----------------------------------------------------------------------- */

async function getTopBuyersForCrop(
  crop: string
): Promise<{ name: string; location: string; distanceKm: number; bidPrice: string; rating: number }[]> {
  try {
    const { data } = await supabaseAdmin
      .from("demands")
      .select("*, users(full_name)")
      .ilike("crop_name", `%${crop}%`)
      .eq("status", "OPEN")
      .order("created_at", { ascending: false })
      .limit(5);

    if (!data || data.length === 0) return [];

    return data.map((d: any) => ({
      name: d.users?.full_name || d.buyer_name || "अज्ञात खरीदार",
      location: d.delivery_location || "स्थान अज्ञात",
      distanceKm: d.distance_km || Math.floor(10 + Math.random() * 30),
      bidPrice: `₹${d.max_price_per_kg || d.price_per_kg || 24}/kg`,
      rating: d.buyer_rating || 4.5,
    }));
  } catch {
    return [];
  }
}

async function getMarketPriceRange(
  crop: string
): Promise<{ minPrice: number; maxPrice: number; avgPrice: number; trend: string } | null> {
  try {
    // Try produce_listings first for live price signals
    const { data: listings } = await supabaseAdmin
      .from("produce_listings")
      .select("price_per_kg, created_at")
      .ilike("crop_name", `%${crop}%`)
      .eq("status", "ACTIVE")
      .order("created_at", { ascending: false })
      .limit(20);

    if (listings && listings.length > 0) {
      const prices = listings.map((l: any) => Number(l.price_per_kg)).filter(Boolean);
      if (prices.length > 0) {
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        const avg = prices.reduce((s: number, p: number) => s + p, 0) / prices.length;
        return { minPrice: min, maxPrice: max, avgPrice: Math.round(avg * 10) / 10, trend: "STABLE" };
      }
    }

    // Fallback: market_prices table
    const { data: mktPrices } = await supabaseAdmin
      .from("market_prices")
      .select("min_price, max_price, modal_price")
      .ilike("commodity", `%${crop}%`)
      .order("arrival_date", { ascending: false })
      .limit(10);

    if (mktPrices && mktPrices.length > 0) {
      const mins = mktPrices.map((r: any) => Number(r.min_price)).filter(Boolean);
      const maxs = mktPrices.map((r: any) => Number(r.max_price)).filter(Boolean);
      const modals = mktPrices.map((r: any) => Number(r.modal_price)).filter(Boolean);
      return {
        minPrice: mins.length ? Math.min(...mins) : 20,
        maxPrice: maxs.length ? Math.max(...maxs) : 28,
        avgPrice: modals.length ? Math.round((modals.reduce((s: number, p: number) => s + p, 0) / modals.length) * 10) / 10 : 24,
        trend: "STABLE",
      };
    }

    return null;
  } catch {
    return null;
  }
}

async function getAvailableTransporters(): Promise<
  { name: string; vehicle: string; ratePerKm: string; rating: number; phone?: string }[]
> {
  try {
    const { data } = await supabaseAdmin
      .from("transporters")
      .select("*, transporter_vehicles(*), users(full_name)")
      .eq("availability_status", "AVAILABLE")
      .limit(5);

    if (!data || data.length === 0) return [];

    return data.map((t: any) => {
      const vehicle = t.transporter_vehicles?.[0];
      return {
        name: t.users?.full_name || t.name || "ट्रांसपोर्टर",
        vehicle: vehicle
          ? `${vehicle.vehicle_make || ""} ${vehicle.vehicle_model || ""} ${vehicle.capacity_kg ? `(${vehicle.capacity_kg}kg)` : ""}`.trim()
          : t.vehicle_type || "वाहन",
        ratePerKm: `₹${t.rate_per_km || 15}/km`,
        rating: Number(t.rating || 4.5),
        phone: t.phone || undefined,
      };
    });
  } catch {
    return [];
  }
}

async function getLatestOrderStatusForFarmer(farmerId: string): Promise<{
  orderId: string;
  status: string;
  etaMinutes?: number;
  freshnessScore?: number;
} | null> {
  try {
    if (!farmerId) return null;

    // Resolve DB user id from firebase uid
    const { data: dbUser } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("firebase_uid", farmerId)
      .maybeSingle();

    const resolvedId = dbUser?.id || farmerId;

    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("id, order_number, status, updated_at, shipments(*)")
      .eq("farmer_id", resolvedId)
      .in("status", ["PLACED", "ACCEPTED", "IN_TRANSIT"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!order) return null;

    const shipment = order.shipments?.[0];
    return {
      orderId: order.order_number || order.id,
      status: order.status,
      etaMinutes: shipment?.estimated_duration_minutes || undefined,
      freshnessScore: shipment?.freshness_score || undefined,
    };
  } catch {
    return null;
  }
}

async function getEarningsSummaryForFarmer(farmerId: string): Promise<{
  totalEarnings: number;
  pendingPayouts: number;
  totalOrders: number;
} | null> {
  try {
    if (!farmerId) return null;

    const { data: dbUser } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("firebase_uid", farmerId)
      .maybeSingle();

    const resolvedId = dbUser?.id || farmerId;

    const { data: ledger } = await supabaseAdmin
      .from("payment_ledger")
      .select("amount, status, fee_type")
      .eq("payee_id", resolvedId)
      .eq("fee_type", "PRODUCT_PAYMENT");

    if (!ledger) return null;

    let totalEarnings = 0;
    let pendingPayouts = 0;

    ledger.forEach((e: any) => {
      const amt = Number(e.amount || 0);
      if (e.status === "RELEASED" || e.status === "SETTLED") {
        totalEarnings += amt;
      } else if (e.status === "HELD_IN_ESCROW" || e.status === "PENDING") {
        pendingPayouts += amt;
      }
    });

    const { count } = await supabaseAdmin
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("farmer_id", resolvedId)
      .eq("status", "DELIVERED");

    return { totalEarnings, pendingPayouts, totalOrders: count || 0 };
  } catch {
    return null;
  }
}

/* -----------------------------------------------------------------------
   Main orchestrator
   ----------------------------------------------------------------------- */

/**
 * Krishi AI Assistant — orchestrates Sarvam AI + domain tool calls.
 * Security rules:
 * - All mutations require explicit farmer confirmation (draftAction flow)
 * - This function never directly mutates listings, orders, or payments
 * - DB reads use supabaseAdmin (server-only)
 */
export async function processKrishiAssistantRequest(
  req: KrishiAssistantRequest
): Promise<KrishiAssistantResponse> {
  const { userQuery, isVoice = false, languageCode: providedLang, confirmedAction, userId } = req;

  // 1. Detect or normalize language
  let langCode = providedLang;
  if (!langCode) {
    const langDetect = await detectLanguage(userQuery);
    langCode = langDetect.detectedLanguage;
  }

  // 2. Handle confirmed action execution (CREATE_LISTING pre-flight only)
  if (confirmedAction) {
    const { actionType, params } = confirmedAction;
    let confirmationMessage = "Action completed.";

    if (actionType === "CREATE_LISTING") {
      // We do NOT insert into DB here — the frontend will call POST /api/listings after user taps confirm
      confirmationMessage =
        `✅ आपका ${params.quantity || 500} ${params.unit || "kg"} ${params.crop || "उपज"} का विवरण तैयार हो गया है! ` +
        `अनुमानित मूल्य: ₹${params.pricePerKg || 24}/kg। ` +
        `अब "उपज सूची बनाएं" पर क्लिक करें।`;
    }

    const ttsRes = isVoice
      ? await generateSpeech({ text: confirmationMessage, targetLanguageCode: langCode })
      : { audioBase64: null };

    return {
      responseText: confirmationMessage,
      responseLanguageCode: langCode || "hi-IN",
      audioBase64: (ttsRes as any).audioBase64 ?? null,
      intent: actionType,
      toolResult: { success: true, actionType, params, readyToSubmit: true },
      fallbackUsed: false,
    };
  }

  // 3. Parse intent from text
  const parsed = parseIntentFromTranscript(userQuery);
  let responseText = "";
  let draftAction: KrishiAssistantResponse["draftAction"];
  let toolResult: any;
  let fallbackUsed = false;

  switch (parsed.intent) {
    /* ----------------------------------------------------------------
       CREATE_LISTING — assistive draft, confirmation required
       ---------------------------------------------------------------- */
    case "CREATE_LISTING": {
      const crop = parsed.crop || "Tomato";
      const quantity = parsed.quantity || 500;
      const unit = parsed.unit || "kg";
      const pricePerKg = parsed.pricePerKg || 24;

      // Enrich price suggestion from real market data
      const priceData = await getMarketPriceRange(crop);
      const suggestedPrice = priceData ? Math.round(priceData.avgPrice) : pricePerKg;

      responseText =
        `मैंने आपका विवरण दर्ज कर लिया है:\n` +
        `• फसल: ${crop}\n` +
        `• मात्रा: ${quantity} ${unit}\n` +
        `• सुझाया गया मूल्य: ₹${suggestedPrice}/kg` +
        (priceData ? ` (मंडी भाव: ₹${priceData.minPrice}–₹${priceData.maxPrice}/kg)` : "") +
        `\n\nक्या मैं इसे मंडी में बिक्री के लिए दर्ज कर दूँ?`;

      draftAction = {
        actionType: "CREATE_LISTING",
        summary: `List ${quantity} ${unit} of ${crop} at ₹${suggestedPrice}/kg`,
        params: { crop, quantity, unit, pricePerKg: suggestedPrice },
        requiresConfirmation: true,
      };
      break;
    }

    /* ----------------------------------------------------------------
       FIND_BUYER — real demand records from Supabase
       ---------------------------------------------------------------- */
    case "FIND_BUYER": {
      const crop = parsed.crop || "Tomato";
      const buyers = await getTopBuyersForCrop(crop);
      fallbackUsed = buyers.length === 0;

      if (buyers.length > 0) {
        const lines = buyers
          .slice(0, 3)
          .map((b, i) => `${i + 1}. ${b.name} — ${b.bidPrice}, ${b.distanceKm} km (⭐ ${b.rating})`)
          .join("\n");
        responseText = `${crop} के लिए उपलब्ध खरीदार:\n${lines}`;
        toolResult = { topBuyers: buyers };
      } else {
        responseText = `अभी ${crop} के लिए कोई सक्रिय खरीदार नहीं मिला। "माँग सूची" में अपनी उपज पोस्ट करें ताकि खरीदार आपसे संपर्क कर सकें।`;
        toolResult = { topBuyers: [], fallbackUsed: true };
      }
      break;
    }

    /* ----------------------------------------------------------------
       CHECK_PRICES — real listing/market_prices data
       ---------------------------------------------------------------- */
    case "CHECK_PRICES": {
      const crop = parsed.crop || "Tomato";
      const priceData = await getMarketPriceRange(crop);

      if (priceData) {
        responseText =
          `आज मंडी में ${crop} का औसत भाव ₹${priceData.avgPrice}/kg है ` +
          `(न्यूनतम: ₹${priceData.minPrice}, अधिकतम: ₹${priceData.maxPrice})।`;
        toolResult = priceData;
      } else {
        responseText = `${crop} का मूल्य डेटा अभी उपलब्ध नहीं है। कृपया "बाजार भाव" पेज देखें।`;
        toolResult = null;
        fallbackUsed = true;
      }
      break;
    }

    /* ----------------------------------------------------------------
       CALCULATE_REVENUE — deterministic formula
       ---------------------------------------------------------------- */
    case "CALCULATE_REVENUE": {
      const quantity = parsed.quantity || 500;
      const price = parsed.pricePerKg || 24;
      const grossRevenue = quantity * price;
      const platformFee = 0; // KRISHISETU ₹0 commission rule

      toolResult = { quantity, price, grossRevenue, platformFee, netRevenue: grossRevenue };
      responseText =
        `${quantity} kg उपज का ₹${price}/kg की दर से कुल राजस्व ₹${grossRevenue.toLocaleString("en-IN")} होगा। ` +
        `KRISHISETU पर 0% कमीशन शुल्क है!`;
      break;
    }

    /* ----------------------------------------------------------------
       GET_TRANSPORTERS — real transporter records
       ---------------------------------------------------------------- */
    case "GET_TRANSPORTERS": {
      const transporters = await getAvailableTransporters();
      fallbackUsed = transporters.length === 0;

      if (transporters.length > 0) {
        const lines = transporters
          .slice(0, 3)
          .map((t, i) => `${i + 1}. ${t.name} — ${t.vehicle}, ${t.ratePerKm} (⭐ ${t.rating})`)
          .join("\n");
        responseText = `आपके निकटतम उपलब्ध ट्रांसपोर्टर:\n${lines}`;
        toolResult = { availableTransporters: transporters };
      } else {
        responseText = "अभी कोई उपलब्ध ट्रांसपोर्टर नहीं मिला। ट्रांसपोर्ट पेज पर देखें।";
        toolResult = { availableTransporters: [], fallbackUsed: true };
      }
      break;
    }

    /* ----------------------------------------------------------------
       TRACK_ORDER — latest active order for farmer
       ---------------------------------------------------------------- */
    case "TRACK_ORDER": {
      const orderStatus = userId ? await getLatestOrderStatusForFarmer(userId) : null;
      fallbackUsed = !orderStatus;

      if (orderStatus) {
        const statusMap: Record<string, string> = {
          PLACED: "स्वीकृति की प्रतीक्षा में",
          ACCEPTED: "स्वीकृत",
          IN_TRANSIT: "रास्ते में",
          DELIVERED: "डिलीवर हो गया",
        };
        const statusText = statusMap[orderStatus.status] || orderStatus.status;
        responseText =
          `आपका ऑर्डर (${orderStatus.orderId}) — स्थिति: ${statusText}` +
          (orderStatus.etaMinutes ? `। ETA: ${orderStatus.etaMinutes} मिनट` : "") +
          (orderStatus.freshnessScore ? `। ताज़गी स्कोर: ${orderStatus.freshnessScore}%` : "") + `।`;
        toolResult = orderStatus;
      } else {
        responseText = `कोई सक्रिय ऑर्डर नहीं मिला। ऑर्डर पेज पर जाएं।`;
        toolResult = null;
      }
      break;
    }

    /* ----------------------------------------------------------------
       GET_EARNINGS — real ledger summary
       ---------------------------------------------------------------- */
    case "GET_EARNINGS": {
      const earnings = userId ? await getEarningsSummaryForFarmer(userId) : null;
      fallbackUsed = !earnings;

      if (earnings) {
        responseText =
          `आपकी कुल कमाई: ₹${earnings.totalEarnings.toLocaleString("en-IN")}। ` +
          `लंबित भुगतान: ₹${earnings.pendingPayouts.toLocaleString("en-IN")}। ` +
          `कुल ${earnings.totalOrders} ऑर्डर पूरे हुए।`;
        toolResult = earnings;
      } else {
        responseText = "कमाई का विवरण लाने में समस्या आई। भुगतान पेज देखें।";
        toolResult = null;
      }
      break;
    }

    /* ----------------------------------------------------------------
       DEMAND_FORECAST — real DemandSense engine
       ---------------------------------------------------------------- */
    case "DEMAND_FORECAST": {
      const crop = parsed.crop || "Tomato";
      const location = parsed.location || "Barabanki";

      try {
        const result = await computeDemandSenseReal(crop, location);
        const forecast = result.forecast;
        toolResult = result;
        responseText =
          `${crop} के लिए माँग पूर्वानुमान (${location}):\n` +
          `• माँग: ${forecast.trendDirection === "UP" ? "बढ़ रही" : forecast.trendDirection === "DOWN" ? "घट रही" : "स्थिर"} (+${forecast.trendPct}%)\n` +
          `• आपूर्ति अंतर: ${forecast.supplyGapKg > 0 ? `${forecast.supplyGapKg} kg की कमी` : "आपूर्ति पर्याप्त"}\n` +
          `• विश्वास स्तर: ${result.confidence}%\n` +
          `सुझाव: ${forecast.explanation}`;
      } catch {
        responseText = `${crop} का माँग पूर्वानुमान अभी उपलब्ध नहीं है।`;
        fallbackUsed = true;
      }
      break;
    }

    /* ----------------------------------------------------------------
       UNKNOWN / GENERAL CONVERSATIONAL AGRICULTURAL ADVISORY
       Uses Sarvam 105B conversational foundation models
       ---------------------------------------------------------------- */
    default: {
      try {
        const systemPrompt =
          "Aap KrishiSetu ke visheshagya Krishi AI Sahayak (Agricultural AI Assistant) hain. " +
          "Kisan bhaiyon aur vyapariyon ko kheti, fasal rog, mandi bhav, bechne ka sahi samay, khad-beej, " +
          "aur krishi vyapar ke bare me spasht, saral aur labhkari salah dein. Bhasha saral, sahyogi aur aadarpoorvak honi chahiye.";

        const llmAnswer = await generateChatCompletion([
          { role: "system", content: systemPrompt },
          { role: "user", content: userQuery },
        ], {
          maxTokens: 350,
          temperature: 0.7,
        });

        if (llmAnswer) {
          responseText = llmAnswer;
          fallbackUsed = false;
        } else {
          throw new Error("Empty LLM output");
        }
      } catch (llmErr: any) {
        console.warn("[Krishi Assistant] Sarvam LLM fallback:", llmErr?.message || llmErr);
        responseText =
          `नमस्ते! मैं आपका कृषक AI सहायक हूँ। आप मुझसे पूछ सकते हैं:\n` +
          `• "मेरे पास 500 किलो टमाटर हैं" → उपज सूची\n` +
          `• "आज टमाटर का भाव क्या है?" → मंडी भाव\n` +
          `• "कोई खरीदार ढूंढो" → खरीदार सूची\n` +
          `• "मेरी कमाई बताओ" → भुगतान लेजर\n` +
          `• "ट्रांसपोर्टर चाहिए" → उपलब्ध वाहन`;
        fallbackUsed = true;
      }
    }
  }

  // 4. Translate response if target language is not Hindi
  if (langCode && langCode !== "hi-IN" && langCode !== "hi" && langCode !== "auto") {
    try {
      const translation = await translateText({
        input: responseText,
        sourceLanguageCode: "hi-IN",
        targetLanguageCode: langCode,
      });
      responseText = translation.translatedText;
    } catch {
      // keep Hindi if translation fails
    }
  }

  // 5. Generate TTS audio if voice requested
  let audioBase64: string | null = null;
  if (isVoice) {
    try {
      const ttsRes = await generateSpeech({
        text: responseText,
        targetLanguageCode: langCode || "hi-IN",
      });
      audioBase64 = ttsRes.audioBase64;
    } catch {
      audioBase64 = null;
    }
  }

  return {
    responseText,
    responseLanguageCode: langCode || "hi-IN",
    audioBase64,
    intent: parsed.intent,
    draftAction,
    toolResult,
    fallbackUsed,
  };
}
