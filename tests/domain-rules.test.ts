/**
 * KRISHISETU — Domain Business Rules Verification Test Suite
 * Asserts strict non-negotiable invariants:
 * 1. Product price and transport price are separate.
 * 2. Farmer revenue = product_price * quantity (ZERO transport deduction).
 * 3. FreshRoute constraint: ETA <= freshness_deadline - 2h safety buffer.
 */

import { calculateFarmerRevenue } from '../src/lib/domain/pricing';
import { isFreshnessSafe, evaluateFreshness } from '../src/lib/domain/freshness';

function runTests() {
  console.log('🧪 Starting KRISHISETU Critical Business Rules Verification Tests...\n');
  let passed = 0;
  let total = 0;

  // TEST 1: Pricing Math & Zero Transport Deduction
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

  // TEST 2: FreshRoute Safety Constraint (Eligible)
  total++;
  const safeCheck = isFreshnessSafe(24, 20);
  if (safeCheck === true) {
    console.log('✅ TEST 2 PASSED: Freshness window 24h & ETA 20h -> Eligible (isFreshnessSafe = true)');
    passed++;
  } else {
    console.error('❌ TEST 2 FAILED: Expected true, got', safeCheck);
  }

  // TEST 3: FreshRoute Safety Constraint (Ineligible/Expired)
  total++;
  const unsafeCheck = isFreshnessSafe(24, 23); // 23h ETA > (24h - 2h safety buffer) = 22h limit
  if (unsafeCheck === false) {
    console.log('✅ TEST 3 PASSED: Freshness window 24h & ETA 23h -> Ineligible (isFreshnessSafe = false)');
    passed++;
  } else {
    console.error('❌ TEST 3 FAILED: Expected false, got', unsafeCheck);
  }

  // TEST 4: Freshness Evaluation Engine
  total++;
  const evalResult = evaluateFreshness(new Date().toISOString(), 24, 25);
  if (evalResult.eligible === false && evalResult.status === 'EXPIRED') {
    console.log('✅ TEST 4 PASSED: Freshness engine correctly flagged EXPIRED status for ETA exceeding deadline');
    passed++;
  } else {
    console.error('❌ TEST 4 FAILED:', evalResult);
  }

  console.log(`\n🎉 Verification Summary: ${passed}/${total} tests passed successfully!`);

  if (passed !== total) {
    process.exit(1);
  }
}

runTests();
