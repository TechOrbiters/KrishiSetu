/**
 * KRISHISETU — Step 7 Integration Test Suite
 * Verification of complete Delivery Workflow:
 * 1. Transporter assignment auto-creates real shipment record in DB.
 * 2. Pickup marker & destination coordinates stored & retrieved.
 * 3. Live transporter location telemetry update and retrieval.
 * 4. OSRM routing engine integration (distance, duration, geometry / Haversine fallback).
 * 5. FreshRoute state evaluation (SAFE, AT_RISK, INELIGIBLE).
 * 6. INELIGIBLE transport route cannot be accepted (returns HTTP 400 Bad Request).
 * 7. Stale location detection (timestamp > 5 mins -> isStale: true).
 * 8. Delivery completion (DELIVERED status updates shipment and order).
 * 9. Unauthorized user tracking access rejected (returns HTTP 403 Forbidden).
 */

import { supabaseAdmin } from '../src/lib/supabase/server';
import { bootstrapFarmer, createFarmerListing, createBuyerOrder, acceptTransportRequest } from '../src/lib/api/client';
import { calculateRoute } from '../src/lib/maps/routing';
import { evaluateFreshRoute } from '../src/lib/domain/freshroute';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

async function runStep7Tests() {
  console.log('🧪 Starting Step 7: Complete Delivery Workflow Integration Verification...\n');
  let passed = 0;
  let total = 0;

  const farmerAuthHeader = {
    'Authorization': 'Bearer demo_token_farmer',
    'Content-Type': 'application/json',
  };

  const buyerAuthHeader = {
    'Authorization': 'Bearer demo_token_buyer',
    'Content-Type': 'application/json',
  };

  const transporterAuthHeader = {
    'Authorization': 'Bearer demo_token_transporter_a',
    'Content-Type': 'application/json',
  };

  const unauthorizedAuthHeader = {
    'Authorization': 'Bearer demo_token_unknown',
    'Content-Type': 'application/json',
  };

  // Setup DB Users & Transporter
  console.log('Setup: Bootstrapping farmer, buyer, and transporter in database...');
  const farmerBoot: any = await bootstrapFarmer({ full_name: 'Farmer Step7', village: 'Barabanki', district: 'Barabanki' });
  const farmerId = farmerBoot.user?.id || farmerBoot.data?.user?.id || '00000000-0000-4000-a000-000000000001';

  const driverUuid = '00000000-0000-4000-f000-000000000001';
  await supabaseAdmin.from('users').delete().in('firebase_uid', ['demo_uid_transporter_a']);
  await supabaseAdmin.from('users').delete().in('phone', ['+919812345671']);
  await supabaseAdmin.from('users').upsert([{
    id: driverUuid,
    firebase_uid: 'demo_uid_transporter_a',
    phone: '+919812345671',
    full_name: 'Rajesh Transport (Driver Step7)',
    role: 'TRANSPORTER',
  }]);

  await supabaseAdmin.from('transporter_profiles').upsert([{
    user_id: driverUuid,
    full_name: 'Rajesh Transport (Driver Step7)',
    phone: '+919812345671',
    vehicle_type: 'Mini Truck',
    vehicle_number: 'UP32 AB 7777',
    capacity_kg: 2000,
    availability: true,
    rating: 4.9,
  }], { onConflict: 'user_id' });

  // Create Listing & Order
  const listingRes = await createFarmerListing({
    crop_name: 'Tomato Step7',
    category: 'Vegetables',
    quantity: 1000,
    price_per_kg: 20,
    grade: 'A',
    harvest_date: new Date().toISOString(),
    shelf_life_days: 5,
    location_name: 'Lucknow Mandi',
  });

  const listing = listingRes.data;
  if (!listing || !listing.id) throw new Error('Failed to setup produce listing for Step 7');

  const orderRes = await createBuyerOrder({
    listing_id: listing.id,
    quantity: 200,
    unit_price: 20,
    delivery_fee: 500,
  });

  const order = orderRes.data;
  if (!order || !order.id) throw new Error('Failed to setup order for Step 7');

  // Accept order as farmer -> auto-creates transport request
  const acceptOrderRes = await fetch(`${BASE_URL}/api/orders/${order.id}/accept`, {
    method: 'POST',
    headers: farmerAuthHeader,
  });
  const acceptOrderJson = await acceptOrderRes.json();
  const transportRequestId = acceptOrderJson.transportRequest?.id;

  if (!transportRequestId) throw new Error('Failed to create transport request for Step 7');

  // TEST 1: Transporter assignment creates a real shipment record in DB
  total++;
  console.log('Test 1: Verifying transporter assignment creates shipment record...');
  const acceptTransportRes = await fetch(`${BASE_URL}/api/transport/requests/${transportRequestId}/accept`, {
    method: 'POST',
    headers: transporterAuthHeader,
    body: JSON.stringify({ transporter_id: driverUuid, vehicle_capacity_kg: 2000, quantity_kg: 200 }),
  });

  const acceptTransportJson = await acceptTransportRes.json();
  let shipmentId = acceptTransportJson.shipment?.id;

  if (!shipmentId) {
    const { data: dbShipment } = await supabaseAdmin
      .from('shipments')
      .select('id')
      .eq('order_id', order.id)
      .maybeSingle();
    shipmentId = dbShipment?.id;
  }

  if (acceptTransportRes.ok && acceptTransportJson.success && shipmentId) {
    console.log(`✅ TEST 1 PASSED: Shipment record created in DB: ${shipmentId}`);
    passed++;
  } else {
    console.error('❌ TEST 1 FAILED: Transport acceptance did not return valid shipment', acceptTransportJson);
  }

  // TEST 2: Pickup marker & destination coordinates present in shipment
  total++;
  console.log('\nTest 2: Verifying pickup and destination coordinates in shipment...');
  const shipmentRes = await fetch(`${BASE_URL}/api/shipments/${shipmentId}`, {
    headers: farmerAuthHeader,
  });
  const shipmentJson = await shipmentRes.json();

  if (shipmentRes.ok && shipmentJson.success && shipmentJson.shipment) {
    const shp = shipmentJson.shipment;
    if (shp.pickup_lat && shp.pickup_lng && shp.delivery_lat && shp.delivery_lng) {
      console.log(`✅ TEST 2 PASSED: Pickup (${shp.pickup_lat}, ${shp.pickup_lng}) and Destination (${shp.delivery_lat}, ${shp.delivery_lng}) coordinates present.`);
      passed++;
    } else {
      console.error('❌ TEST 2 FAILED: Missing coordinates in shipment', shp);
    }
  } else {
    console.error('❌ TEST 2 FAILED: Could not fetch shipment details', shipmentJson);
  }

  // TEST 3: Live transporter location telemetry update and retrieval
  total++;
  console.log('\nTest 3: Verifying live transporter location telemetry updates...');
  const locUpdateRes = await fetch(`${BASE_URL}/api/shipments/${shipmentId}/location`, {
    method: 'POST',
    headers: transporterAuthHeader,
    body: JSON.stringify({ latitude: 26.8850, longitude: 80.9800, heading: 90, speed_kmh: 40 }),
  });

  const locUpdateJson = await locUpdateRes.json();
  if (locUpdateRes.ok && locUpdateJson.success && locUpdateJson.telemetry) {
    console.log(`✅ TEST 3 PASSED: Telemetry updated to lat: ${locUpdateJson.telemetry.latitude}, lng: ${locUpdateJson.telemetry.longitude}.`);
    passed++;
  } else {
    console.error('❌ TEST 3 FAILED: Location telemetry update failed', locUpdateJson);
  }

  // TEST 4: OSRM Routing Engine integration
  total++;
  console.log('\nTest 4: Verifying OSRM routing engine integration...');
  const routeResult = await calculateRoute(
    { lat: 26.8467, lng: 80.9462 },
    { lat: 26.9200, lng: 81.1800 }
  );

  if (routeResult.success && (routeResult.provider === 'osrm' || routeResult.provider === 'haversine')) {
    console.log(`✅ TEST 4 PASSED: Route calculated using provider '${routeResult.provider}': ${routeResult.distanceKm} km, duration: ${routeResult.durationMinutes ?? 'null (approx)'} mins.`);
    passed++;
  } else {
    console.error('❌ TEST 4 FAILED: Route calculation failed', routeResult);
  }

  // TEST 5: FreshRoute state evaluation (SAFE, AT_RISK, INELIGIBLE)
  total++;
  console.log('\nTest 5: Verifying FreshRoute state evaluation logic...');
  const safeResult = evaluateFreshRoute({
    harvestTimeIso: new Date().toISOString(),
    freshnessDurationHours: 120, // 5 days
    routeDurationMinutes: 60, // 1 hour
  });

  const ineligibleResult = evaluateFreshRoute({
    harvestTimeIso: new Date(Date.now() - 48 * 3600 * 1000).toISOString(), // 48h ago
    freshnessDurationHours: 2, // 2h shelf life -> expired 46h ago
    routeDurationMinutes: 120,
  });

  if (safeResult.status === 'SAFE' && ineligibleResult.status === 'INELIGIBLE') {
    console.log(`✅ TEST 5 PASSED: FreshRoute evaluated correctly (SAFE status: ${safeResult.status}, INELIGIBLE status: ${ineligibleResult.status}).`);
    passed++;
  } else {
    console.error('❌ TEST 5 FAILED: FreshRoute evaluation mismatch', { safeResult, ineligibleResult });
  }

  // TEST 6: INELIGIBLE transport route cannot be accepted
  total++;
  console.log('\nTest 6: Verifying INELIGIBLE transport route cannot be accepted...');
  // Create order with expired shelf life listing
  const expListingRes = await createFarmerListing({
    crop_name: 'Expired Crop Step7',
    category: 'Vegetables',
    quantity: 500,
    price_per_kg: 15,
    grade: 'C',
    harvest_date: new Date(Date.now() - 100 * 3600 * 1000).toISOString(), // 100 hours ago
    shelf_life_days: 1, // 24h shelf life -> expired
    location_name: 'Lucknow Mandi',
  });
  const expListing = expListingRes.data;

  const expOrderRes = await createBuyerOrder({
    listing_id: expListing.id,
    quantity: 50,
    unit_price: 15,
    delivery_fee: 300,
  });
  const expOrder = expOrderRes.data;

  const expAcceptOrderRes = await fetch(`${BASE_URL}/api/orders/${expOrder.id}/accept`, {
    method: 'POST',
    headers: farmerAuthHeader,
  });
  const expAcceptOrderJson = await expAcceptOrderRes.json();
  const expTrId = expAcceptOrderJson.transportRequest?.id;

  if (expTrId) {
    const ineligibleAcceptRes = await fetch(`${BASE_URL}/api/transport/requests/${expTrId}/accept`, {
      method: 'POST',
      headers: transporterAuthHeader,
      body: JSON.stringify({ transporter_id: driverUuid, vehicle_capacity_kg: 2000, quantity_kg: 50 }),
    });

    const ineligibleAcceptJson = await ineligibleAcceptRes.json();
    if (ineligibleAcceptRes.status === 400 && ineligibleAcceptJson.success === false) {
      console.log('✅ TEST 6 PASSED: INELIGIBLE transport request rejected with HTTP 400:', ineligibleAcceptJson.error);
      passed++;
    } else {
      console.error('❌ TEST 6 FAILED: Expected HTTP 400 for INELIGIBLE route, got', ineligibleAcceptRes.status, ineligibleAcceptJson);
    }
  } else {
    console.error('❌ TEST 6 FAILED: Failed to setup transport request for INELIGIBLE test');
  }

  // TEST 7: Stale location detection (> 5 mins old -> isStale: true)
  total++;
  console.log('\nTest 7: Verifying stale location detection...');
  // Manually update transporter_profiles updated_at to 10 minutes ago
  await supabaseAdmin
    .from('transporter_profiles')
    .update({ updated_at: new Date(Date.now() - 10 * 60 * 1000).toISOString() })
    .eq('user_id', driverUuid);

  const staleShipmentRes = await fetch(`${BASE_URL}/api/shipments/${shipmentId}`, {
    headers: farmerAuthHeader,
  });
  const staleShipmentJson = await staleShipmentRes.json();

  if (staleShipmentRes.ok && staleShipmentJson.success && staleShipmentJson.isStale === true) {
    console.log('✅ TEST 7 PASSED: Stale tracking correctly detected (isStale = true). Warning:', staleShipmentJson.staleWarning);
    passed++;
  } else {
    console.error('❌ TEST 7 FAILED: Expected isStale = true for 10-min old location, got:', staleShipmentJson.isStale);
  }

  // TEST 8: Delivery completion (DELIVERED status updates shipment and order)
  total++;
  console.log('\nTest 8: Verifying delivery completion endpoint...');
  const deliverRes = await fetch(`${BASE_URL}/api/shipments/${shipmentId}/deliver`, {
    method: 'POST',
    headers: transporterAuthHeader,
  });

  const deliverJson = await deliverRes.json();
  if (deliverRes.ok && deliverJson.success && deliverJson.shipment?.status === 'DELIVERED') {
    const { data: dbOrder } = await supabaseAdmin
      .from('orders')
      .select('status')
      .eq('id', order.id)
      .maybeSingle();

    if (dbOrder?.status === 'DELIVERED') {
      console.log(`✅ TEST 8 PASSED: Shipment ${shipmentId} & Order ${order.id} marked as DELIVERED.`);
      passed++;
    } else {
      console.error('❌ TEST 8 FAILED: Order status was not updated to DELIVERED', dbOrder);
    }
  } else {
    console.error('❌ TEST 8 FAILED: Delivery completion failed', deliverJson);
  }

  // TEST 9: Unauthorized user tracking access rejected (HTTP 403 Forbidden)
  total++;
  console.log('\nTest 9: Verifying unauthorized tracking access rejection...');
  const unauthRes = await fetch(`${BASE_URL}/api/shipments/${shipmentId}`, {
    headers: unauthorizedAuthHeader,
  });

  const unauthJson = await unauthRes.json();
  if (unauthRes.status === 403 && unauthJson.success === false) {
    console.log('✅ TEST 9 PASSED: Unauthorized user access rejected with HTTP 403 Forbidden:', unauthJson.error);
    passed++;
  } else {
    console.error('❌ TEST 9 FAILED: Expected HTTP 403 for unauthorized tracking access, got', unauthRes.status, unauthJson);
  }

  // Cleanup test listing
  await supabaseAdmin.from('produce_listings').delete().in('id', [listing.id, expListing?.id].filter(Boolean));

  console.log(`\n🎉 Verification Summary: ${passed}/${total} Step 7 tests passed successfully!`);

  if (passed !== total) {
    process.exit(1);
  }
}

runStep7Tests().catch((err) => {
  console.error('Unhandled test failure:', err);
  process.exit(1);
});
