/**
 * KRISHISETU — Step 6 Integration Test Suite
 * Verification of complete Farmer -> Transporter workflow:
 * 1. Farmer receives order with 12h acceptance window.
 * 2. Expired order cannot be accepted (returns HTTP 400, releases stock).
 * 3. Transport request is auto-created on order acceptance.
 * 4. Real transporters with vehicle/capacity/location appear in marketplace.
 * 5. Vehicle capacity constraints strictly enforced (insufficient capacity returns HTTP 400).
 * 6. Two simultaneous accepts -> exactly one succeeds (HTTP 200), second fails with HTTP 409 Conflict.
 */

import { supabaseAdmin } from '../src/lib/supabase/server';
import { bootstrapFarmer, createFarmerListing, createBuyerOrder } from '../src/lib/api/client';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

async function runStep6Tests() {
  console.log('🧪 Starting Step 6: Farmer -> Transporter Workflow Integration Verification...\n');
  let passed = 0;
  let total = 0;

  const farmerAuthHeader = {
    'Authorization': 'Bearer demo_token_farmer',
    'Content-Type': 'application/json',
  };

  const transporterAHeader = {
    'Authorization': 'Bearer demo_token_transporter_a',
    'Content-Type': 'application/json',
  };

  const transporterBHeader = {
    'Authorization': 'Bearer demo_token_transporter_b',
    'Content-Type': 'application/json',
  };

  // 0. Bootstrap farmer user & transporters in DB
  console.log('Setup: Bootstrapping farmer user and transporters in database...');
  const farmerBoot: any = await bootstrapFarmer({ full_name: 'Test Farmer Step6', village: 'Barabanki', district: 'Barabanki' });
  const farmerDbUserId = farmerBoot.user?.id || farmerBoot.data?.user?.id;

  const driverAUuid = '00000000-0000-4000-f000-000000000001';
  const driverBUuid = '00000000-0000-4000-f000-000000000002';

  await supabaseAdmin.from('users').delete().in('firebase_uid', ['demo_uid_transporter_a', 'demo_uid_transporter_b']);
  await supabaseAdmin.from('users').delete().in('phone', ['+919812345671', '+919812345672']);

  await supabaseAdmin.from('users').upsert([
    {
      id: driverAUuid,
      firebase_uid: 'demo_uid_transporter_a',
      phone: '+919812345671',
      full_name: 'Rajesh Transport (Driver A)',
      role: 'TRANSPORTER',
    },
    {
      id: driverBUuid,
      firebase_uid: 'demo_uid_transporter_b',
      phone: '+919812345672',
      full_name: 'Sandeep Logistics (Driver B)',
      role: 'TRANSPORTER',
    },
  ]);

  await supabaseAdmin.from('transporter_profiles').upsert([
    {
      user_id: driverAUuid,
      full_name: 'Rajesh Transport (Driver A)',
      phone: '+919812345671',
      vehicle_type: 'Mini Truck',
      vehicle_number: 'UP32 AB 1001',
      capacity_kg: 1000,
      availability: true,
      rating: 4.8,
    },
    {
      user_id: driverBUuid,
      full_name: 'Sandeep Logistics (Driver B)',
      phone: '+919812345672',
      vehicle_type: 'Pickup 1.5T',
      vehicle_number: 'UP32 CD 2002',
      capacity_kg: 1500,
      availability: true,
      rating: 4.9,
    },
  ], { onConflict: 'user_id' });

  const listingRes = await createFarmerListing({
    crop_name: 'Wheat Step6',
    category: 'Grains',
    quantity: 1000,
    price_per_kg: 25,
    grade: 'A',
    harvest_date: new Date().toISOString().split('T')[0],
    shelf_life_days: 7,
    location_name: 'Lucknow Mandi',
  });

  const listing = listingRes.data;
  if (!listing || !listing.id) {
    throw new Error('Failed to setup produce listing for Step 6 test');
  }

  const listingId = listing.id;

  // TEST 1: Order creation has 12h expiration window
  total++;
  console.log('Test 1: Verifying order creation sets 12h acceptance window...');
  const orderRes = await createBuyerOrder({
    listing_id: listingId,
    quantity: 200,
    unit_price: 25,
    delivery_fee: 500,
  });

  if (orderRes.success && orderRes.data && orderRes.data.id) {
    const order = orderRes.data;
    const createdAtMs = new Date(order.created_at).getTime();
    const expiresAtMs = new Date(order.expires_at).getTime();
    const diffHours = (expiresAtMs - createdAtMs) / (1000 * 3600);

    if (Math.abs(diffHours - 12) < 0.1) {
      console.log(`✅ TEST 1 PASSED: Order ${order.id} has exact 12h expiration window (${diffHours.toFixed(1)}h).`);
      passed++;
    } else {
      console.error(`❌ TEST 1 FAILED: Expected 12h window, got ${diffHours.toFixed(1)}h`);
    }
  } else {
    console.error('❌ TEST 1 FAILED: Order creation failed', orderRes);
  }

  // TEST 2: Expired order cannot be accepted (past 12h window)
  total++;
  console.log('\nTest 2: Verifying expired order cannot be accepted...');
  const expOrderRes = await createBuyerOrder({
    listing_id: listingId,
    quantity: 50,
    unit_price: 25,
    delivery_fee: 300,
  });

  const expOrder = expOrderRes.data;
  if (expOrder && expOrder.id) {
    const pastExpiresAt = new Date(Date.now() - 24 * 3600 * 1000).toISOString();

    // Directly set expires_at in orders table to 24h ago
    await supabaseAdmin
      .from('orders')
      .update({ expires_at: pastExpiresAt })
      .eq('id', expOrder.id);

    const acceptExpiredRes = await fetch(`${BASE_URL}/api/orders/${expOrder.id}/accept`, {
      method: 'POST',
      headers: farmerAuthHeader,
    });

    const acceptExpiredJson = await acceptExpiredRes.json();
    if (acceptExpiredRes.status === 400 && acceptExpiredJson.success === false) {
      console.log('✅ TEST 2 PASSED: Expired order rejected with HTTP 400 error:', acceptExpiredJson.error);
      passed++;
    } else {
      console.error('❌ TEST 2 FAILED: Expected HTTP 400, got', acceptExpiredRes.status, acceptExpiredJson);
    }
  } else {
    console.error('❌ TEST 2 FAILED: Failed to create order for expiration test');
  }

  // TEST 3: Order acceptance auto-creates transport request
  total++;
  console.log('\nTest 3: Verifying order acceptance creates transport request...');
  const validOrderRes = await createBuyerOrder({
    listing_id: listingId,
    quantity: 150,
    unit_price: 25,
    delivery_fee: 400,
  });

  const validOrder = validOrderRes.data;
  let transportRequestId: string | null = null;

  if (validOrder && validOrder.id) {
    const acceptValidRes = await fetch(`${BASE_URL}/api/orders/${validOrder.id}/accept`, {
      method: 'POST',
      headers: farmerAuthHeader,
    });

    const acceptValidJson = await acceptValidRes.json();
    if (acceptValidRes.ok && acceptValidJson.success && acceptValidJson.transportRequest) {
      transportRequestId = acceptValidJson.transportRequest.id;
      console.log('✅ TEST 3 PASSED: Order accepted & transport request auto-created:', transportRequestId || acceptValidJson.transportRequest.order_id);
      passed++;
    } else {
      console.error('❌ TEST 3 FAILED: Transport request auto-creation failed', acceptValidJson);
    }
  } else {
    console.error('❌ TEST 3 FAILED: Failed to create valid order');
  }

  // TEST 4: Transporter marketplace returns real transporters & vehicle data
  total++;
  console.log('\nTest 4: Verifying transporter marketplace API returns real profiles & vehicles...');
  const transportersRes = await fetch(`${BASE_URL}/api/transport/transporters`, {
    headers: farmerAuthHeader,
  });

  const transportersJson = await transportersRes.json();
  if (transportersRes.ok && transportersJson.success && Array.isArray(transportersJson.transporters) && transportersJson.transporters.length > 0) {
    const t = transportersJson.transporters[0];
    console.log(`✅ TEST 4 PASSED: Retrieved ${transportersJson.transporters.length} real transporters. Sample: ${t.full_name} (${t.vehicle_type}, ${t.capacity_kg}kg).`);
    passed++;
  } else {
    console.error('❌ TEST 4 FAILED: Transporters endpoint failed', transportersJson);
  }

  // TEST 5: Capacity rules enforced (vehicle capacity < order weight -> rejected)
  total++;
  console.log('\nTest 5: Verifying vehicle capacity constraints enforcement...');
  if (!transportRequestId && validOrder) {
    const trRes = await fetch(`${BASE_URL}/api/transport/requests`, {
      method: 'POST',
      headers: farmerAuthHeader,
      body: JSON.stringify({ order_id: validOrder.id, fare_amount: 500, distance_km: 15 }),
    });
    const trJson = await trRes.json();
    transportRequestId = trJson.request?.id;
  }

  if (transportRequestId) {
    // Attempt to accept 150kg shipment with a 100kg vehicle
    const capacityRes = await fetch(`${BASE_URL}/api/transport/requests/${transportRequestId}/accept`, {
      method: 'POST',
      headers: transporterAHeader,
      body: JSON.stringify({
        transporter_id: driverAUuid,
        vehicle_capacity_kg: 100, // Insufficient for 150kg order
        quantity_kg: 150,
      }),
    });

    const capacityJson = await capacityRes.json();
    if (capacityRes.status === 400 && capacityJson.success === false) {
      console.log('✅ TEST 5 PASSED: Low capacity vehicle rejected with HTTP 400 error:', capacityJson.error);
      passed++;
    } else {
      console.error('❌ TEST 5 FAILED: Expected HTTP 400 for low vehicle capacity, got', capacityRes.status, capacityJson);
    }
  } else {
    console.error('❌ TEST 5 FAILED: Transport request missing for capacity test');
  }

  // TEST 6: Two simultaneous accepts -> exactly one succeeds (HTTP 200), second receives HTTP 409 Conflict
  total++;
  console.log('\nTest 6: Verifying transactional atomic double-claim prevention...');
  const concurrentOrderRes = await createBuyerOrder({
    listing_id: listingId,
    quantity: 100,
    unit_price: 25,
    delivery_fee: 450,
  });
  const concurrentOrder = concurrentOrderRes.data;

  if (concurrentOrder) {
    // Create transport request for concurrent test
    const trRes = await fetch(`${BASE_URL}/api/transport/requests`, {
      method: 'POST',
      headers: farmerAuthHeader,
      body: JSON.stringify({ order_id: concurrentOrder.id, fare_amount: 450, distance_km: 12 }),
    });
    const trJson = await trRes.json();
    console.log('Test 6 created transport request:', trJson);
    const concurrentReqId = trJson.request?.id;

    if (concurrentReqId) {
      // Trigger simultaneous acceptance with valid DB transporter UUIDs
      const [resA, resB] = await Promise.all([
        fetch(`${BASE_URL}/api/transport/requests/${concurrentReqId}/accept`, {
          method: 'POST',
          headers: transporterAHeader,
          body: JSON.stringify({
            transporter_id: driverAUuid,
            vehicle_capacity_kg: 1000,
            quantity_kg: 100,
          }),
        }),
        fetch(`${BASE_URL}/api/transport/requests/${concurrentReqId}/accept`, {
          method: 'POST',
          headers: transporterBHeader,
          body: JSON.stringify({
            transporter_id: driverBUuid,
            vehicle_capacity_kg: 1000,
            quantity_kg: 100,
          }),
        }),
      ]);

      const jsonA = await resA.json();
      const jsonB = await resB.json();

      const statuses = [resA.status, resB.status];
      const has200 = statuses.includes(200);
      const has409 = statuses.includes(409);

      if (has200 && has409) {
        console.log(`✅ TEST 6 PASSED: Atomic double-claim prevention verified! Driver A: ${resA.status}, Driver B: ${resB.status}. Exactly one succeeded and one returned 409 Conflict.`);
        passed++;
      } else {
        console.error(`❌ TEST 6 FAILED: Expected one 200 and one 409, got Driver A: ${resA.status} (${JSON.stringify(jsonA)}), Driver B: ${resB.status} (${JSON.stringify(jsonB)})`);
      }
    } else {
      console.error('❌ TEST 6 FAILED: Could not create transport request for concurrent test');
    }
  } else {
    console.error('❌ TEST 6 FAILED: Could not create concurrent order');
  }

  // Cleanup test listing
  await supabaseAdmin.from('produce_listings').delete().eq('id', listingId);

  console.log(`\n🎉 Verification Summary: ${passed}/${total} Step 6 tests passed successfully!`);

  if (passed !== total) {
    process.exit(1);
  }
}

runStep6Tests().catch((err) => {
  console.error('Unhandled test failure:', err);
  process.exit(1);
});
