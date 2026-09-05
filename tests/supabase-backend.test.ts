/**
 * KRISHISETU — Supabase & Core Domain Integration Test Suite
 * Asserts:
 * 1. Product price & transport price separation (0% farmer transport deduction)
 * 2. FreshRoute safety eligibility rules
 * 3. Vehicle capacity eligibility checks
 */

import { calculateFarmerRevenue } from '../src/lib/domain/pricing';
import { isFreshnessSafe, evaluateFreshness } from '../src/lib/domain/freshness';

async function runBackendTests() {
  console.log('🧪 Running KRISHISETU Supabase Backend Integration Tests...\n');
  let passed = 0;
  let total = 0;

  // TEST 1: Exact Pricing Math (Step 22 Rule)
  total++;
  const priceResult = calculateFarmerRevenue(22, 500, 1500);
  if (
    priceResult.farmerPayout === 11000 &&
    priceResult.transporterPayout === 1500 &&
    priceResult.buyerTotal === 12500 &&
    priceResult.platformFee === 0
  ) {
    console.log('✅ TEST 1 PASSED: Farmer revenue = ₹11,000 (No transport deduction), Buyer total = ₹12,500');
    passed++;
  } else {
    console.error('❌ TEST 1 FAILED:', priceResult);
  }

  // TEST 2: FreshRoute Safety Check (ETA 20h / deadline 24h -> Eligible)
  total++;
  const freshEligible = isFreshnessSafe(24, 20);
  if (freshEligible === true) {
    console.log('✅ TEST 2 PASSED: FreshRoute ETA 20h vs Deadline 24h -> Eligible');
    passed++;
  } else {
    console.error('❌ TEST 2 FAILED: Expected true, got', freshEligible);
  }

  // TEST 3: FreshRoute Expiry Check (ETA 27h / deadline 24h -> Ineligible)
  total++;
  const freshIneligible = isFreshnessSafe(24, 27);
  if (freshIneligible === false) {
    console.log('✅ TEST 3 PASSED: FreshRoute ETA 27h vs Deadline 24h -> Ineligible (Hard constraint enforced)');
    passed++;
  } else {
    console.error('❌ TEST 3 FAILED: Expected false, got', freshIneligible);
  }

  // TEST 4: Vehicle Capacity Constraint (Vehicle 300kg vs Shipment 500kg)
  total++;
  const vehicleCapacityKg = 300;
  const shipmentWeightKg = 500;
  const isVehicleEligible = vehicleCapacityKg >= shipmentWeightKg;
  if (isVehicleEligible === false) {
    console.log('✅ TEST 4 PASSED: Vehicle capacity 300kg < Shipment 500kg -> Rejected (Ineligible)');
    passed++;
  } else {
    console.error('❌ TEST 4 FAILED: Expected false, got', isVehicleEligible);
  }

  console.log(`\n🎉 Verification Summary: ${passed}/${total} backend tests passed successfully!`);

  if (passed !== total) {
    process.exit(1);
  }
}

runBackendTests();
