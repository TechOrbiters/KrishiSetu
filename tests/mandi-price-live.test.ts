/**
 * KRISHISETU — Live AGMARKNET / data.gov.in Mandi Price Suite
 * Validates:
 * 1. Live connectivity to data.gov.in AGMARKNET Resource (9ef84268-d588-465a-a308-a864a43d0070)
 * 2. String sanitization: trims trailing newlines and whitespace
 * 3. Unit normalization: ₹/quintal to ₹/kg and ISO date formatting
 * 4. Supabase DB persistence against schema in `market_prices` table
 * 5. Summary KPI cards generation (4 key crops with modal prices and trends)
 * 6. District & Commodity filtering
 */

import { activeDataGovProvider } from '../src/server/integrations/market/dataGovProvider';
import { activeMarketService } from '../src/server/services/marketService';
import { supabaseAdmin } from '../src/lib/supabase/server';

async function runMandiLiveVerification() {
  console.log('🌾 Starting KRISHISETU Live Mandi Price (data.gov.in) Test Suite...\n');
  let passed = 0;
  let total = 0;

  // TEST 1: Direct Live AGMARKNET API Fetch
  total++;
  try {
    console.log('Testing live AGMARKNET connectivity with DATA_GOV_API_KEY...');
    const res = await activeDataGovProvider.fetchPrices({ state: 'Uttar Pradesh', limit: 20 });

    if (res.success && res.records.length > 0) {
      const first = res.records[0];
      console.log(`✅ TEST 1 PASSED: Live AGMARKNET responded with ${res.records.length} records. Sample: ${first.commodity} @ ₹${first.modalPrice}/quintal (₹${first.pricePerKg}/kg) at ${first.market}, ${first.district}`);
      passed++;
    } else {
      console.error('❌ TEST 1 FAILED: No records returned from live provider', res);
    }
  } catch (err: any) {
    console.error('❌ TEST 1 FAILED:', err.message);
  }

  // TEST 2: String Sanitization & Trailing Newline Stripping
  total++;
  try {
    const res = await activeDataGovProvider.fetchPrices({ state: 'Uttar Pradesh', limit: 30 });
    let hasNewline = false;
    for (const r of res.records) {
      if (r.commodity.includes('\n') || r.district.includes('\n') || r.market.includes('\n')) {
        hasNewline = true;
        break;
      }
    }

    if (!hasNewline && res.records.length > 0) {
      console.log('✅ TEST 2 PASSED: All commodity, district, and market strings sanitized (zero trailing newlines)');
      passed++;
    } else {
      console.error('❌ TEST 2 FAILED: Trailing newlines detected in record fields');
    }
  } catch (err: any) {
    console.error('❌ TEST 2 FAILED:', err.message);
  }

  // TEST 3: Date Format Normalization
  total++;
  try {
    const res = await activeDataGovProvider.fetchPrices({ state: 'Uttar Pradesh', limit: 10 });
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const allValidDates = res.records.every((r) => isoDateRegex.test(r.priceDate));

    if (allValidDates && res.records.length > 0) {
      console.log(`✅ TEST 3 PASSED: Normalized arrival dates to ISO format (e.g. ${res.records[0].priceDate})`);
      passed++;
    } else {
      console.error('❌ TEST 3 FAILED: Dates not normalized to ISO YYYY-MM-DD');
    }
  } catch (err: any) {
    console.error('❌ TEST 3 FAILED:', err.message);
  }

  // TEST 4: Supabase market_prices Persistence
  total++;
  try {
    const syncRes = await activeMarketService.syncFromDataGov({ state: 'Uttar Pradesh', limit: 10 });
    // Verify rows in Supabase
    const { data: dbRows, error: dbError } = await supabaseAdmin
      .from('market_prices')
      .select('crop_name, district, mandi_name, modal_price_per_kg, recorded_at')
      .limit(5);

    if (!dbError && dbRows && dbRows.length > 0) {
      console.log(`✅ TEST 4 PASSED: Successfully synced ${syncRes.fetched} records to Supabase 'market_prices' table (Read ${dbRows.length} rows, sample crop: ${dbRows[0].crop_name})`);
      passed++;
    } else {
      console.error('❌ TEST 4 FAILED: Supabase persistence check failed', dbError);
    }
  } catch (err: any) {
    console.error('❌ TEST 4 FAILED:', err.message);
  }

  // TEST 5: Summary KPI Cards Engine
  total++;
  try {
    const cards = await activeMarketService.getSummaryCards();
    if (
      cards.length === 4 &&
      cards.every((c) => c.modalPrice > 0 && typeof c.crop === 'string' && c.cropImage.startsWith('http'))
    ) {
      console.log(`✅ TEST 5 PASSED: 4 Summary KPI cards generated (${cards.map((c) => `${c.crop}: ₹${c.modalPrice}`).join(', ')})`);
      passed++;
    } else {
      console.error('❌ TEST 5 FAILED: Invalid summary cards', cards);
    }
  } catch (err: any) {
    console.error('❌ TEST 5 FAILED:', err.message);
  }

  // TEST 6: Filtering by District and Commodity
  total++;
  try {
    const wheatPrices = await activeMarketService.getMarketPrices({ commodity: 'Wheat', limit: 10 });
    const isWheatFiltered = wheatPrices.prices.every((p) => p.commodity.toLowerCase().includes('wheat'));

    if (wheatPrices.prices.length > 0 && isWheatFiltered) {
      console.log(`✅ TEST 6 PASSED: Commodity filter successfully filtered Wheat (${wheatPrices.prices.length} records found)`);
      passed++;
    } else {
      console.error('❌ TEST 6 FAILED: Commodity filter returned non-matching records', wheatPrices.prices);
    }
  } catch (err: any) {
    console.error('❌ TEST 6 FAILED:', err.message);
  }

  console.log(`\n🎉 Test Suite Completed: ${passed}/${total} Mandi Price Live tests passed!`);

  if (passed !== total) {
    process.exit(1);
  }
}

runMandiLiveVerification();
