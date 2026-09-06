/**
 * KRISHISETU — Step 4 Supply-Demand Matching & SmartMatch Engine Verification Test Suite
 * Tests buyer demand CRUD, deterministic SmartMatch engine scoring (30% price, 25% distance, 20% qty, 10% quality, 10% delivery, 5% reliability),
 * inventory awareness, and exclusion of expired/paused listings.
 */

import { calculateSmartMatchScore } from '../src/lib/domain/aiEngine';
import { getApiUrl, getAuthHeaders } from '../src/lib/api/client';

async function runStep4Tests() {
  console.log('🧪 Starting AI MANDI Step 4 Supply-Demand Matching Verification Tests...\n');
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, message: string) {
    total++;
    if (condition) {
      console.log(`✅ TEST ${total} PASSED: ${message}`);
      passed++;
    } else {
      console.error(`❌ TEST ${total} FAILED: ${message}`);
      throw new Error(`Test failed: ${message}`);
    }
  }

  // 1. Test POST /api/demands input validation and creation
  let createdDemandId: string | null = null;
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(getApiUrl('/api/demands'), {
      method: 'POST',
      headers,
      body: JSON.stringify({
        crop_name: 'आलू (Potato)',
        target_quantity_kg: 1000,
        target_price_per_kg: 22,
        location_name: 'लखनऊ सब्जी मंडी, यूपी',
        quality_grade: 'A',
      }),
    });
    const json = await res.json();
    if (!json.success) {
      console.error('POST /api/demands failed with response:', json);
    }
    assert(
      json.success === true && json.demand?.id !== undefined,
      'Created buyer demand record in DB via POST /api/demands'
    );
    if (json.demand?.id) {
      createdDemandId = json.demand.id;
    }
  } catch (err: any) {
    assert(false, `POST /api/demands test failed: ${err.message}`);
  }

  // 2. Test GET /api/demands and GET /api/demands/:id
  try {
    if (createdDemandId) {
      const res = await fetch(getApiUrl(`/api/demands/${createdDemandId}`));
      const json = await res.json();
      assert(
        json.success === true && json.demand?.crop_name !== undefined,
        'Fetched single buyer demand record by ID via GET /api/demands/:id'
      );
    }
  } catch (err: any) {
    assert(false, `GET /api/demands/:id test failed: ${err.message}`);
  }

  // 3. Test SmartMatch Engine Weighted Scoring Formula
  // Formula weights: 30% price, 25% distance, 20% qty, 10% quality, 10% delivery time, 5% reliability
  try {
    const sampleListing = {
      price_per_kg: 20,
      available_quantity: 1000,
      grade: 'A',
      harvest_date: new Date().toISOString().split('T')[0],
      shelf_life_days: 7,
      latitude: 26.8467,
      longitude: 80.9462,
      status: 'ACTIVE',
      verification_status: 'VERIFIED',
    };
    const sampleDemand = {
      target_price_per_kg: 22,
      target_quantity_kg: 1000,
      quality_grade: 'A',
      latitude: 26.8500,
      longitude: 80.9500,
    };

    const matchOutput = calculateSmartMatchScore(sampleListing, sampleDemand);
    assert(
      matchOutput.score > 80 && matchOutput.isEligible === true && matchOutput.reasons.length > 0,
      'SmartMatch engine calculated deterministic weighted score and returned structured reasons'
    );
    assert(
      matchOutput.breakdown.priceScore === 100 && matchOutput.breakdown.quantityScore === 100,
      'Price (30%) and Quantity (20%) scores computed accurately'
    );
  } catch (err: any) {
    assert(false, `SmartMatch Engine calculation test failed: ${err.message}`);
  }

  // 4. Test Real Inventory Awareness: Exclude Expired / Paused / Zero Quantity Listings
  try {
    const expiredListing = {
      price_per_kg: 20,
      available_quantity: 500,
      grade: 'A',
      harvest_date: '2024-01-01', // Expired date
      shelf_life_days: 2,
      status: 'EXPIRED',
    };
    const pausedListing = {
      price_per_kg: 20,
      available_quantity: 500,
      status: 'PAUSED',
    };
    const zeroQtyListing = {
      price_per_kg: 20,
      available_quantity: 0,
      status: 'ACTIVE',
    };
    const demand = { target_price_per_kg: 22, target_quantity_kg: 500 };

    const expiredResult = calculateSmartMatchScore(expiredListing, demand);
    const pausedResult = calculateSmartMatchScore(pausedListing, demand);
    const zeroQtyResult = calculateSmartMatchScore(zeroQtyListing, demand);

    assert(
      expiredResult.isEligible === false && pausedResult.isEligible === false && zeroQtyResult.isEligible === false,
      'Inventory awareness correctly excluded expired, paused, and zero quantity listings from eligible matches'
    );
  } catch (err: any) {
    assert(false, `Inventory awareness test failed: ${err.message}`);
  }

  // 5. Test GET /api/demands/:id/matches endpoint
  try {
    if (createdDemandId) {
      const res = await fetch(getApiUrl(`/api/demands/${createdDemandId}/matches`));
      const json = await res.json();
      assert(
        json.success === true && Array.isArray(json.matches),
        'GET /api/demands/:id/matches returned real supply matches list'
      );
    }
  } catch (err: any) {
    assert(false, `GET /api/demands/:id/matches test failed: ${err.message}`);
  }

  console.log(`\n🎉 Step 4 Verification Summary: ${passed}/${total} tests passed successfully!`);
}

runStep4Tests().catch((err) => {
  console.error('\n❌ Step 4 Test Suite execution failed:', err);
  process.exit(1);
});
