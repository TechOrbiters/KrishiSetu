/**
 * KRISHISETU — Admin Portal Production E2E Verification Test Suite
 * Validates the complete Admin Domain end-to-end:
 * 1. Admin Authentication & Role Enforcement (/api/auth/admin-login)
 * 2. RBAC & Security Isolation (401 on unauthenticated, 403 on non-admin role)
 * 3. Executive Command Center KPIs & Telemetry (/api/admin/dashboard)
 * 4. Farmers & FPOs Directory (/api/admin/farmers)
 * 5. Buyers Directory & Trade Volume (/api/admin/buyers)
 * 6. Live Cross-Portal Event Synchronization (logisticsSync bus)
 */

import { logisticsSync, LogisticsEvent } from '../src/lib/realtime/logisticsSync';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

async function runAdminE2ETests() {
  console.log('🛡️ Starting KrishiSetu Admin Portal Production E2E Test Suite...\n');
  let passed = 0;
  let total = 0;

  const adminHeaders = {
    'Authorization': 'Bearer demo_token_admin',
    'Content-Type': 'application/json',
  };

  const buyerHeaders = {
    'Authorization': 'Bearer demo_token_buyer',
    'Content-Type': 'application/json',
  };

  /* ========================================================================= */
  /* PART 1: ADMIN AUTHENTICATION & LOGIN                                      */
  /* ========================================================================= */

  // TEST 1: Admin Login with Authorized Phone
  total++;
  console.log('Test 1: Verifying Admin Login with authorized credentials (/api/auth/admin-login)...');
  try {
    const res = await fetch(`${BASE_URL}/api/auth/admin-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '9999999999' }),
    });
    const data = await res.json();
    if (res.status === 200 && data.success && data.customToken) {
      console.log(`  ✅ TEST 1 PASSED: Admin authenticated successfully (token: ${data.customToken.slice(0, 20)}...)`);
      passed++;
    } else {
      throw new Error(`Expected 200 with customToken, got ${res.status}: ${JSON.stringify(data)}`);
    }
  } catch (err: any) {
    throw new Error(`Test 1 Failed: ${err.message}`);
  }

  // TEST 2: Admin Login Rejection on Unauthorized Identity
  total++;
  console.log('Test 2: Verifying Admin Login Rejection for unauthorized phone number...');
  try {
    const res = await fetch(`${BASE_URL}/api/auth/admin-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '1111111111' }),
    });
    const data = await res.json();
    if (res.status === 403 && !data.success) {
      console.log('  ✅ TEST 2 PASSED: Unauthorized phone number correctly rejected with HTTP 403');
      passed++;
    } else {
      throw new Error(`Expected 403 Forbidden, got ${res.status}: ${JSON.stringify(data)}`);
    }
  } catch (err: any) {
    throw new Error(`Test 2 Failed: ${err.message}`);
  }

  // TEST 3: Admin Login Rejection on Malformed Input
  total++;
  console.log('Test 3: Verifying Admin Login Rejection on malformed input...');
  try {
    const res = await fetch(`${BASE_URL}/api/auth/admin-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '123' }),
    });
    const data = await res.json();
    if (res.status === 400 && !data.success) {
      console.log('  ✅ TEST 3 PASSED: Malformed phone rejected with HTTP 400');
      passed++;
    } else {
      throw new Error(`Expected 400 Bad Request, got ${res.status}: ${JSON.stringify(data)}`);
    }
  } catch (err: any) {
    throw new Error(`Test 3 Failed: ${err.message}`);
  }

  /* ========================================================================= */
  /* PART 2: RBAC & DATA ISOLATION ENFORCEMENT                                 */
  /* ========================================================================= */

  // TEST 4: Unauthenticated Request Rejection (401)
  total++;
  console.log('Test 4: Verifying Unauthenticated Access Rejection (HTTP 401)...');
  try {
    const res = await fetch(`${BASE_URL}/api/admin/dashboard`);
    if (res.status === 401) {
      console.log('  ✅ TEST 4 PASSED: Missing token rejected with HTTP 401');
      passed++;
    } else {
      throw new Error(`Expected 401 Unauthorized, got ${res.status}`);
    }
  } catch (err: any) {
    throw new Error(`Test 4 Failed: ${err.message}`);
  }

  // TEST 5: Non-Admin Role Rejection (HTTP 403)
  total++;
  console.log('Test 5: Verifying Non-Admin Role Rejection (HTTP 403)...');
  try {
    const res = await fetch(`${BASE_URL}/api/admin/dashboard`, {
      headers: buyerHeaders,
    });
    if (res.status === 403) {
      console.log('  ✅ TEST 5 PASSED: Buyer role access to Admin API blocked with HTTP 403');
      passed++;
    } else {
      throw new Error(`Expected 403 Forbidden, got ${res.status}`);
    }
  } catch (err: any) {
    throw new Error(`Test 5 Failed: ${err.message}`);
  }

  /* ========================================================================= */
  /* PART 3: ADMIN EXECUTIVE COMMAND CENTER & TELEMETRY                        */
  /* ========================================================================= */

  // TEST 6: Executive Dashboard Metrics API (/api/admin/dashboard)
  total++;
  console.log('Test 6: Verifying Executive Dashboard Metrics API (/api/admin/dashboard)...');
  try {
    const res = await fetch(`${BASE_URL}/api/admin/dashboard`, {
      headers: adminHeaders,
    });
    const result = await res.json();
    if (res.status === 200 && result.success && result.data) {
      const d = result.data;
      if (
        d.users && typeof d.users.total === 'number' &&
        d.orders && typeof d.orders.total === 'number' &&
        typeof d.orders.gmv === 'number' &&
        d.listings && typeof d.listings.total === 'number'
      ) {
        console.log(`  ✅ TEST 6 PASSED: Dashboard returned valid metrics (Users: ${d.users.total}, Orders: ${d.orders.total}, GMV: ₹${d.orders.gmv}, Listings: ${d.listings.total})`);
        passed++;
      } else {
        throw new Error(`Dashboard missing expected metrics: ${JSON.stringify(d)}`);
      }
    } else {
      throw new Error(`Expected 200 with valid dashboard data, got ${res.status}: ${JSON.stringify(result)}`);
    }
  } catch (err: any) {
    throw new Error(`Test 6 Failed: ${err.message}`);
  }

  /* ========================================================================= */
  /* PART 4: DIRECTORIES (FARMERS & BUYERS)                                    */
  /* ========================================================================= */

  // TEST 7: Farmers Directory Query (/api/admin/farmers)
  total++;
  console.log('Test 7: Verifying Farmers Directory Query (/api/admin/farmers)...');
  try {
    const res = await fetch(`${BASE_URL}/api/admin/farmers?page=1&limit=10`, {
      headers: adminHeaders,
    });
    const result = await res.json();
    if (res.status === 200 && result.success && result.data && Array.isArray(result.data.farmers)) {
      console.log(`  ✅ TEST 7 PASSED: Farmers directory returned ${result.data.farmers.length} farmers (total: ${result.data.pagination.total})`);
      passed++;
    } else {
      throw new Error(`Expected 200 with farmers array, got ${res.status}: ${JSON.stringify(result)}`);
    }
  } catch (err: any) {
    throw new Error(`Test 7 Failed: ${err.message}`);
  }

  // TEST 8: Buyers Directory Query (/api/admin/buyers)
  total++;
  console.log('Test 8: Verifying Buyers Directory Query (/api/admin/buyers)...');
  try {
    const res = await fetch(`${BASE_URL}/api/admin/buyers?page=1&limit=10`, {
      headers: adminHeaders,
    });
    const result = await res.json();
    if (res.status === 200 && result.success && result.data && Array.isArray(result.data.buyers)) {
      console.log(`  ✅ TEST 8 PASSED: Buyers directory returned ${result.data.buyers.length} buyers (total: ${result.data.pagination.total})`);
      passed++;
    } else {
      throw new Error(`Expected 200 with buyers array, got ${res.status}: ${JSON.stringify(result)}`);
    }
  } catch (err: any) {
    throw new Error(`Test 8 Failed: ${err.message}`);
  }

  /* ========================================================================= */
  /* PART 5: REAL-TIME CROSS-PORTAL SYNC EVENT PROPAGATION                     */
  /* ========================================================================= */

  // TEST 9: Cross-Portal Synchronization via BroadcastChannel Event Bus
  total++;
  console.log('Test 9: Verifying Cross-Portal Event Synchronization to Admin Console...');
  let adminReceivedEvent: LogisticsEvent | null = null;
  const unsubscribe = logisticsSync.subscribe((event) => {
    adminReceivedEvent = event;
  });

  const testEventPayload = {
    orderId: 'ORD-ADMIN-SYNC-001',
    buyerName: 'Amit Shah (Buyer)',
    produceName: 'Sharbati Wheat',
    quantityKg: 500,
    totalAmount: 14500,
    timestamp: Date.now(),
  };

  logisticsSync.broadcast('ORDER_PLACED', testEventPayload);

  if (
    adminReceivedEvent &&
    (adminReceivedEvent as any).type === 'ORDER_PLACED' &&
    (adminReceivedEvent as any).payload.orderId === 'ORD-ADMIN-SYNC-001'
  ) {
    console.log('  ✅ TEST 9 PASSED: Admin live listener received cross-portal order dispatch in real-time');
    passed++;
  } else {
    throw new Error('Test 9 Failed: Real-time broadcast was not received by admin listener');
  }
  unsubscribe();

  // TEST 10: Produce Listing Broadcast to Admin Surveillance
  total++;
  console.log('Test 10: Verifying Produce Listing broadcast propagation to Admin...');
  let produceEvent: LogisticsEvent | null = null;
  const unsubProduce = logisticsSync.subscribe((event) => {
    if (event.type === 'LISTING_CREATED') {
      produceEvent = event;
    }
  });

  logisticsSync.broadcast('LISTING_CREATED', {
    listingId: 'LISTING-ADMIN-SURVEILLANCE-777',
    cropName: 'Nashik Red Onion',
    quantityKg: 2000,
    pricePerKg: 22,
    timestamp: Date.now(),
  });

  if (
    produceEvent &&
    (produceEvent as any).payload.listingId === 'LISTING-ADMIN-SURVEILLANCE-777'
  ) {
    console.log('  ✅ TEST 10 PASSED: Produce listing broadcast instantly received for Admin surveillance');
    passed++;
  } else {
    throw new Error('Test 10 Failed: Produce listing broadcast not received');
  }
  unsubProduce();

  /* ========================================================================= */
  /* SUMMARY                                                                   */
  /* ========================================================================= */
  console.log(`\n🎉 Admin Portal Verification Complete: ${passed}/${total} test suites verified successfully!\n`);
}

runAdminE2ETests().catch((err) => {
  console.error('\n❌ Admin Portal Test Suite Failed:');
  console.error(err);
  process.exit(1);
});
