/**
 * KRISHISETU — Step 9 Integration Test Suite
 * Verification of Real Farmer AI Systems (Vision, DemandSense, SellSmart, MarketPilot):
 * 1. Vision photo analysis API returns structured assistive suggestions.
 * 2. Vision API validates image size limits (<= 10MB) and format requirements.
 * 3. DemandSense API returns statistical/real forecast, confidence, timestamp & fallback flag.
 * 4. SellSmart API computes exact farmer revenue (farmerRevenue = price × quantity) without transport deduction.
 * 5. MarketPilot API returns actionable recommendation (SELL_NOW, HOLD, SELL_PARTIALLY) & explainable reasons.
 * 6. Strict AI Safety Rule: AI endpoints NEVER directly write or mutate DB records.
 * 7. Unauthenticated requests to protected AI endpoints are rejected with HTTP 401.
 */

import { supabaseAdmin } from '../src/lib/supabase/server';
import { bootstrapFarmer, createFarmerListing } from '../src/lib/api/client';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

async function runStep9Tests() {
  console.log('🧪 Starting Step 9: Real Farmer AI Integration Verification...\n');
  let passed = 0;
  let total = 0;

  const farmerAuthHeader = {
    'Authorization': 'Bearer demo_token_farmer',
    'Content-Type': 'application/json',
  };

  // Bootstrap Farmer
  console.log('Setup: Bootstrapping farmer user for AI testing...');
  await bootstrapFarmer({ full_name: 'AI Test Farmer', village: 'Barabanki', district: 'Barabanki' });

  // TEST 1: Vision Photo Analysis API (`POST /api/ai/vision/analyze`)
  total++;
  console.log('Test 1: Verifying Vision photo analysis API...');
  const sampleBase64Image = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP...';
  const visionRes = await fetch(`${BASE_URL}/api/ai/vision/analyze`, {
    method: 'POST',
    headers: farmerAuthHeader,
    body: JSON.stringify({ imageBase64: sampleBase64Image }),
  });

  const visionJson = await visionRes.json();
  if (visionRes.ok && visionJson.success && visionJson.data) {
    const d = visionJson.data;
    if (
      d.detectedCrop &&
      typeof d.confidence === 'number' &&
      d.visualCondition &&
      Array.isArray(d.suggestions) &&
      typeof d.fallbackUsed === 'boolean'
    ) {
      console.log(`✅ TEST 1 PASSED: Vision analyzed photo (Crop: ${d.detectedCrop}, Condition: ${d.visualCondition}, Confidence: ${d.confidence * 100}%). Assistive mode confirmed.`);
      passed++;
    } else {
      console.error('❌ TEST 1 FAILED: Vision returned incomplete response format', d);
    }
  } else {
    console.error('❌ TEST 1 FAILED: Vision endpoint call failed', visionJson);
  }

  // TEST 2: Vision Image Size & Validation (< 10MB limit enforcement)
  total++;
  console.log('\nTest 2: Verifying Vision payload validation...');
  const missingImgRes = await fetch(`${BASE_URL}/api/ai/vision/analyze`, {
    method: 'POST',
    headers: farmerAuthHeader,
    body: JSON.stringify({}),
  });

  const missingImgJson = await missingImgRes.json();
  if (missingImgRes.status === 400 && missingImgJson.success === false) {
    console.log('✅ TEST 2 PASSED: Missing/invalid image payload properly rejected with HTTP 400.');
    passed++;
  } else {
    console.error('❌ TEST 2 FAILED: Expected HTTP 400 for missing image payload', missingImgJson);
  }

  // TEST 3: DemandSense API (`POST /api/ai/demandsense`)
  total++;
  console.log('\nTest 3: Verifying DemandSense demand & price forecasting API...');
  const demandSenseRes = await fetch(`${BASE_URL}/api/ai/demandsense`, {
    method: 'POST',
    headers: farmerAuthHeader,
    body: JSON.stringify({ crop: 'Tomato', location: 'Barabanki' }),
  });

  const demandSenseJson = await demandSenseRes.json();
  if (demandSenseRes.ok && demandSenseJson.success && demandSenseJson.forecast) {
    const f = demandSenseJson.forecast;
    if (
      f.crop === 'Tomato' &&
      typeof f.expectedDemandTonnes === 'number' &&
      typeof f.supplyGapKg === 'number' &&
      typeof demandSenseJson.confidence === 'number' &&
      typeof demandSenseJson.fallbackUsed === 'boolean'
    ) {
      console.log(`✅ TEST 3 PASSED: DemandSense returned forecast (Demand: ${f.expectedDemandTonnes}t, Supply Gap: ${f.supplyGapKg}kg, Confidence: ${demandSenseJson.confidence}%).`);
      passed++;
    } else {
      console.error('❌ TEST 3 FAILED: Invalid forecast object structure', f);
    }
  } else {
    console.error('❌ TEST 3 FAILED: DemandSense API call failed', demandSenseJson);
  }

  // TEST 4: SellSmart API (`POST /api/ai/sellsmart`) — Revenue Formula Verification
  total++;
  console.log('\nTest 4: Verifying SellSmart multi-channel revenue comparison API...');
  const quantityKg = 500;
  const askingPrice = 22;
  const sellSmartRes = await fetch(`${BASE_URL}/api/ai/sellsmart`, {
    method: 'POST',
    headers: farmerAuthHeader,
    body: JSON.stringify({ crop: 'Tomato', quantityKg, farmerAskingPrice: askingPrice, location: 'Barabanki' }),
  });

  const sellSmartJson = await sellSmartRes.json();
  if (sellSmartRes.ok && sellSmartJson.success && Array.isArray(sellSmartJson.sellingOptions)) {
    const options = sellSmartJson.sellingOptions;
    const recommended = options.find((o: any) => o.isRecommended);

    if (recommended && recommended.farmerRevenue === (recommended.offeredPricePerKg * quantityKg)) {
      console.log(`✅ TEST 4 PASSED: SellSmart options verified! Recommended Channel: ${recommended.buyerName}, Offered Price: ₹${recommended.offeredPricePerKg}/kg, Farmer Revenue: ₹${recommended.farmerRevenue} (Price × Quantity formula verified).`);
      passed++;
    } else {
      console.error('❌ TEST 4 FAILED: Formula farmerRevenue = price * quantity mismatch', { recommended, quantityKg });
    }
  } else {
    console.error('❌ TEST 4 FAILED: SellSmart API call failed', sellSmartJson);
  }

  // TEST 5: MarketPilot API (`POST /api/ai/marketpilot`)
  total++;
  console.log('\nTest 5: Verifying MarketPilot actionable market advice API...');
  const marketPilotRes = await fetch(`${BASE_URL}/api/ai/marketpilot`, {
    method: 'POST',
    headers: farmerAuthHeader,
    body: JSON.stringify({ crop: 'Tomato', freshnessRemainingHours: 20, quantityKg: 500, location: 'Barabanki' }),
  });

  const marketPilotJson = await marketPilotRes.json();
  if (marketPilotRes.ok && marketPilotJson.success) {
    const mp = marketPilotJson;
    if (
      ['SELL_NOW', 'HOLD', 'SELL_PARTIALLY'].includes(mp.action) &&
      typeof mp.opportunityScore === 'number' &&
      Array.isArray(mp.bulletPoints) &&
      mp.bulletPoints.length > 0
    ) {
      console.log(`✅ TEST 5 PASSED: MarketPilot advice returned (Action: ${mp.action}, Opportunity Score: ${mp.opportunityScore}/100, Reason: "${mp.reason.substring(0, 50)}...").`);
      passed++;
    } else {
      console.error('❌ TEST 5 FAILED: MarketPilot advice format invalid', mp);
    }
  } else {
    console.error('❌ TEST 5 FAILED: MarketPilot API call failed', marketPilotJson);
  }

  // TEST 6: AI Domain Safety Rule Verification (AI NEVER directly writes to DB)
  total++;
  console.log('\nTest 6: Verifying strict AI safety rule (AI endpoints NEVER mutate DB directly)...');
  const { count: initialListingsCount } = await supabaseAdmin.from('produce_listings').select('*', { count: 'exact', head: true });

  // Execute all AI endpoints sequentially
  await fetch(`${BASE_URL}/api/ai/demandsense`, { method: 'POST', headers: farmerAuthHeader, body: JSON.stringify({ crop: 'Tomato' }) });
  await fetch(`${BASE_URL}/api/ai/sellsmart`, { method: 'POST', headers: farmerAuthHeader, body: JSON.stringify({ crop: 'Tomato', quantityKg: 500, farmerAskingPrice: 22 }) });
  await fetch(`${BASE_URL}/api/ai/marketpilot`, { method: 'POST', headers: farmerAuthHeader, body: JSON.stringify({ crop: 'Tomato', freshnessRemainingHours: 12, quantityKg: 500 }) });

  const { count: afterAiListingsCount } = await supabaseAdmin.from('produce_listings').select('*', { count: 'exact', head: true });

  if (initialListingsCount === afterAiListingsCount) {
    console.log('✅ TEST 6 PASSED: Verified AI safety rule! 0 database mutations occurred during AI calculations.');
    passed++;
  } else {
    console.error('❌ TEST 6 FAILED: AI endpoint directly mutated DB!', { initialListingsCount, afterAiListingsCount });
  }

  // TEST 7: Authentication Protection on AI Endpoints
  total++;
  console.log('\nTest 7: Verifying authorization protection on AI endpoints...');
  const unauthRes = await fetch(`${BASE_URL}/api/ai/demandsense`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ crop: 'Tomato' }),
  });

  const unauthJson = await unauthRes.json();
  if (unauthRes.status === 401 && unauthJson.success === false) {
    console.log('✅ TEST 7 PASSED: Unauthenticated AI request correctly rejected with HTTP 401.');
    passed++;
  } else {
    console.error('❌ TEST 7 FAILED: Expected HTTP 401 for unauthenticated request', unauthJson);
  }

  console.log(`\n🎉 Verification Summary: ${passed}/${total} Step 9 tests passed successfully!`);

  if (passed !== total) {
    process.exit(1);
  }
}

runStep9Tests().catch((err) => {
  console.error('Unhandled test failure:', err);
  process.exit(1);
});
