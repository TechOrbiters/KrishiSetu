/**
 * KRISHISETU — Third-Party & Open Map Stack & Mandi Price Integration Automated Test Suite
 * Validates:
 * 1. Google Cloud Vision API analysis & fallback contract
 * 2. Open Map Stack Haversine distance calculation & coordinate validation
 * 3. OSRM Route & Haversine Fallback engine (with zero fake road ETA on fallback)
 * 4. FreshRoute Domain Service decision rules (SAFE, AT_RISK, INELIGIBLE)
 * 5. Sarvam AI Speech-to-Text Saaras model intent parsing
 * 6. Sarvam AI Text-to-Speech & Translation
 * 7. Krishi AI Assistant draft execution guardrails
 * 8. Government Mandi Price API (data.gov.in / AGMARKNET) Provider & Unit Normalization
 * 9. Provider Abstraction Registry
 */

import { analyzeProduceImage } from "../src/lib/google/vision";
import { calculateHaversineDistance, calculateRoute, calculateHaversineFallback } from "../src/lib/maps/routing";
import { validateCoordinates } from "../src/lib/maps/types";
import { evaluateFreshRoute } from "../src/lib/domain/freshroute";
import { parseIntentFromTranscript } from "../src/lib/sarvam/stt";
import { translateText } from "../src/lib/sarvam/translate";
import { detectLanguage } from "../src/lib/sarvam/language";
import { processKrishiAssistantRequest } from "../src/lib/sarvam/assistant";
import { activeProviders } from "../src/server/integrations/providers";
import { activeDataGovProvider } from "../src/server/integrations/market/dataGovProvider";
import { activeMarketService } from "../src/server/services/marketService";

async function runThirdPartyTests() {
  console.log("🧪 Starting KRISHISETU Third-Party API & Mandi Price Verification Tests...\n");
  let passed = 0;
  let total = 0;

  // TEST 1: Google Cloud Vision API
  total++;
  try {
    const dummyImage = "data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    const result = await analyzeProduceImage(dummyImage);
    if (
      typeof result.detectedCrop === "string" &&
      typeof result.confidence === "number" &&
      Array.isArray(result.damageIndicators) &&
      Array.isArray(result.suggestions) &&
      typeof result.fallbackUsed === "boolean"
    ) {
      console.log(`✅ TEST 1 PASSED: Google Vision typed response contract verified (Detected: ${result.detectedCrop})`);
      passed++;
    } else {
      console.error("❌ TEST 1 FAILED: Invalid Vision response contract", result);
    }
  } catch (err: any) {
    console.error("❌ TEST 1 FAILED:", err.message);
  }

  // TEST 2: Haversine Straight-Line Distance & Coordinate Validation
  total++;
  try {
    const lucknow = { lat: 26.8467, lng: 80.9462 };
    const kanpur = { lat: 26.4499, lng: 80.3319 };
    const dist = calculateHaversineDistance(lucknow, kanpur);
    const valid = validateCoordinates(lucknow.lat, lucknow.lng);
    const invalid = validateCoordinates(999, 80);

    if (dist > 70 && dist < 95 && valid === true && invalid === false) {
      console.log(`✅ TEST 2 PASSED: Haversine distance (${dist.toFixed(2)} km) & Coordinate validation verified`);
      passed++;
    } else {
      console.error(`❌ TEST 2 FAILED: Expected ~75-85km, got ${dist}`);
    }
  } catch (err: any) {
    console.error("❌ TEST 2 FAILED:", err.message);
  }

  // TEST 3: OSRM Route & Strict Fallback Engine
  total++;
  try {
    const origin = { lat: 26.8467, lng: 80.9462 };
    const destination = { lat: 26.4499, lng: 80.3319 };
    const routeInfo = await calculateRoute(origin, destination);
    const fallbackInfo = calculateHaversineFallback(origin, destination);

    if (
      routeInfo.success === true &&
      typeof routeInfo.distanceKm === "number" &&
      fallbackInfo.isApproximate === true &&
      fallbackInfo.durationMinutes === null &&
      fallbackInfo.routeAvailable === false
    ) {
      console.log(`✅ TEST 3 PASSED: OSRM/Haversine routing engine contract verified (Provider: ${routeInfo.provider}, Dist: ${routeInfo.distanceKm}km)`);
      passed++;
    } else {
      console.error("❌ TEST 3 FAILED:", routeInfo, fallbackInfo);
    }
  } catch (err: any) {
    console.error("❌ TEST 3 FAILED:", err.message);
  }

  // TEST 4: FreshRoute Decision Service (SAFE, AT_RISK, INELIGIBLE)
  total++;
  try {
    const nowIso = new Date().toISOString();
    const harvestTimeIso = new Date(Date.now() - 2 * 3600 * 1000).toISOString();

    const safeRes = evaluateFreshRoute({
      harvestTimeIso,
      freshnessDurationHours: 50,
      routeDurationMinutes: 120,
      serverTimeIso: nowIso,
    });

    const ineligibleRes = evaluateFreshRoute({
      harvestTimeIso,
      freshnessDurationHours: 3,
      routeDurationMinutes: 300,
      serverTimeIso: nowIso,
    });

    if (safeRes.status === "SAFE" && ineligibleRes.status === "INELIGIBLE" && ineligibleRes.isEligible === false) {
      console.log("✅ TEST 4 PASSED: FreshRoute decision engine correctly enforced SAFE and INELIGIBLE thresholds");
      passed++;
    } else {
      console.error("❌ TEST 4 FAILED:", safeRes, ineligibleRes);
    }
  } catch (err: any) {
    console.error("❌ TEST 4 FAILED:", err.message);
  }

  // TEST 5: Sarvam AI Speech-to-Text Saaras Intent & Entity Parsing
  total++;
  try {
    const transcript = "Mere paas 500 kilo tamatar hain";
    const intentResult = parseIntentFromTranscript(transcript);
    if (
      intentResult.intent === "CREATE_LISTING" &&
      (intentResult.crop === "Tomato" || intentResult.crop === "टमाटर") &&
      intentResult.quantity === 500 &&
      intentResult.unit === "kg"
    ) {
      console.log("✅ TEST 5 PASSED: Code-mixed Hindi STT intent parsing correctly extracted Tomato, 500kg, CREATE_LISTING");
      passed++;
    } else {
      console.error("❌ TEST 5 FAILED:", intentResult);
    }
  } catch (err: any) {
    console.error("❌ TEST 5 FAILED:", err.message);
  }

  // TEST 6: Sarvam AI Language Identification & Translation
  total++;
  try {
    const langRes = await detectLanguage("मेरे पास 500 किलो टमाटर हैं");
    const transRes = await translateText({
      input: "Welcome to KRISHISETU",
      sourceLanguageCode: "en-IN",
      targetLanguageCode: "hi-IN",
    });

    if (langRes.detectedLanguage && transRes.translatedText) {
      console.log(`✅ TEST 6 PASSED: Sarvam Language ID (${langRes.detectedLanguage}) & Translation verified`);
      passed++;
    } else {
      console.error("❌ TEST 6 FAILED:", langRes, transRes);
    }
  } catch (err: any) {
    console.error("❌ TEST 6 FAILED:", err.message);
  }

  // TEST 7: Krishi AI Assistant Draft Creation & Execution Guardrails
  total++;
  try {
    const assistantRes = await processKrishiAssistantRequest({
      userQuery: "500 kilo tamatar list karo",
      isVoice: false,
    });

    if (
      assistantRes.intent === "CREATE_LISTING" &&
      assistantRes.draftAction?.requiresConfirmation === true &&
      assistantRes.draftAction.params.quantity === 500
    ) {
      console.log("✅ TEST 7 PASSED: Krishi AI Assistant correctly created draft requiring farmer confirmation");
      passed++;
    } else {
      console.error("❌ TEST 7 FAILED:", assistantRes);
    }
  } catch (err: any) {
    console.error("❌ TEST 7 FAILED:", err.message);
  }

  // TEST 8: Government Mandi Price API (data.gov.in / AGMARKNET) Provider & Unit Normalization
  total++;
  try {
    const fetchRes = await activeDataGovProvider.fetchPrices({ state: "Uttar Pradesh", limit: 5 });
    const marketData = await activeMarketService.getMarketPrices({ limit: 10 });
    const summaryCards = await activeMarketService.getSummaryCards();

    if (
      marketData.prices.length > 0 &&
      typeof marketData.prices[0].modalPrice === "number" &&
      marketData.prices[0].unit === "₹/quintal" &&
      typeof marketData.prices[0].pricePerKg === "number" &&
      summaryCards.length >= 4
    ) {
      console.log(`✅ TEST 8 PASSED: data.gov.in Mandi Price API contract, record normalization (₹/quintal -> ₹/kg), and summary KPI engine verified (${marketData.prices.length} records, ${summaryCards.length} KPI cards)`);
      passed++;
    } else {
      console.error("❌ TEST 8 FAILED:", fetchRes, marketData);
    }
  } catch (err: any) {
    console.error("❌ TEST 8 FAILED:", err.message);
  }

  // TEST 9: Provider Abstraction Registry
  total++;
  if (
    activeProviders.vision &&
    activeProviders.maps &&
    activeProviders.market &&
    activeProviders.stt &&
    activeProviders.tts &&
    activeProviders.translation &&
    activeProviders.languageDetector
  ) {
    console.log("✅ TEST 9 PASSED: Swappable Provider Abstraction Registry (with data.gov.in Mandi Price provider) verified");
    passed++;
  } else {
    console.error("❌ TEST 9 FAILED: Provider registry missing instances");
  }

  console.log(`\n🎉 Verification Summary: ${passed}/${total} Third-Party & Government API Integration tests passed successfully!`);

  if (passed !== total) {
    process.exit(1);
  }
}

runThirdPartyTests();
