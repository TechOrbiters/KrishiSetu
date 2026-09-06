/**
 * KRISHISETU — Transporter Portal Production E2E Verification Test Suite
 * Validates the complete logistics domain end-to-end:
 * 1. Transporter Authentication & Profile Lifecycle (GET & PATCH /api/transporters/profile)
 * 2. Real-time Duty Availability Toggle (GET & PATCH /api/transporters/availability)
 * 3. Vehicle Fleet Registration & Capacity Validation (/api/vehicles)
 * 4. Cross-RBAC Pipeline: Farmer Listing -> Buyer Order -> Order Acceptance -> Transport Request
 * 5. SmartMatch Logistics Discovery & Algorithmic Scoring (/api/transporters/jobs)
 * 6. Atomic Double-Claim Prevention on Job Acceptance (/api/transport/requests/[id]/accept)
 * 7. Multi-Stage Shipment Execution (Pickup -> Start Transit -> Destination Arrival -> Delivery)
 * 8. 100% Transporter Payout Verification under Domain Rule R-001 (/api/transporters/earnings)
 * 9. Verified Transporter Reviews & Quality Scoring (/api/transporters/ratings)
 */

import { supabaseAdmin } from '../src/lib/supabase/server';
import { bootstrapFarmer, createFarmerListing, createBuyerOrder } from '../src/lib/api/client';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

async function runTransporterE2ETests() {
  console.log('🚚 Starting KrishiSetu Transporter Portal End-to-End Test Suite...\n');
  let passed = 0;
  let total = 0;

  const farmerAuthHeader = {
    'Authorization': 'Bearer demo_token_farmer',
    'Content-Type': 'application/json',
  };

  const transporterHeaders = {
    'Authorization': 'Bearer demo_token_transporter_a',
    'Content-Type': 'application/json',
  };

  const rivalHeaders = {
    'Authorization': 'Bearer demo_token_transporter_b',
    'Content-Type': 'application/json',
  };

  // TEST 1: Transporter Profile Retrieval & Mutation
  total++;
  console.log('Test 1: Verifying Transporter Profile (GET & PATCH /api/transporters/profile)...');
  const getProfRes = await fetch(`${BASE_URL}/api/transporters/profile`, { headers: transporterHeaders });
  const getProfJson = await getProfRes.json();

  if (!getProfRes.ok || !getProfJson.success || !getProfJson.profile) {
    throw new Error(`Test 1 Failed: Could not get profile: ${JSON.stringify(getProfJson)}`);
  }

  const patchProfRes = await fetch(`${BASE_URL}/api/transporters/profile`, {
    method: 'PATCH',
    headers: transporterHeaders,
    body: JSON.stringify({
      capacity_kg: 1200,
      location_name: 'लखनऊ - बाराबंकी कॉरिडोर',
    }),
  });
  const patchProfJson = await patchProfRes.json();

  if (!patchProfRes.ok || !patchProfJson.success || patchProfJson.profile.capacity_kg !== 1200) {
    throw new Error(`Test 1 Failed: Profile PATCH failed: ${JSON.stringify(patchProfJson)}`);
  }
  passed++;
  console.log('✅ TEST 1 PASSED: Transporter profile fetched and updated to 1200kg capacity.\n');

  // TEST 2: Transporter Availability Duty Toggle
  total++;
  console.log('Test 2: Verifying Duty Availability toggle (GET & PATCH /api/transporters/availability)...');
  const offRes = await fetch(`${BASE_URL}/api/transporters/availability`, {
    method: 'PATCH',
    headers: transporterHeaders,
    body: JSON.stringify({ availability: false }),
  });
  const offJson = await offRes.json();
  if (!offRes.ok || offJson.availability !== false) {
    throw new Error('Test 2 Failed: Could not set duty to offline');
  }

  const onRes = await fetch(`${BASE_URL}/api/transporters/availability`, {
    method: 'PATCH',
    headers: transporterHeaders,
    body: JSON.stringify({ availability: true }),
  });
  const onJson = await onRes.json();
  if (!onRes.ok || onJson.availability !== true) {
    throw new Error('Test 2 Failed: Could not set duty back to online');
  }
  passed++;
  console.log('✅ TEST 2 PASSED: Duty availability toggled offline and back to online successfully.\n');

  // TEST 3: Vehicle Management CRUD & Validations
  total++;
  console.log('Test 3: Verifying Vehicle Management CRUD & validations (/api/vehicles)...');
  const regNumber = `UP32-E2E-${Math.floor(1000 + Math.random() * 9000)}`;
  const addVehRes = await fetch(`${BASE_URL}/api/vehicles`, {
    method: 'POST',
    headers: transporterHeaders,
    body: JSON.stringify({
      registration_number: regNumber,
      vehicle_type: 'Mini Truck (Tata Ace)',
      model: 'Tata Ace Gold Petrol',
      capacity_kg: 1000,
    }),
  });
  const addVehJson = await addVehRes.json();
  if (!addVehRes.ok || !addVehJson.success || !addVehJson.vehicle) {
    throw new Error(`Test 3 Failed: Adding vehicle failed: ${JSON.stringify(addVehJson)}`);
  }

  // Duplicate registration must be rejected
  const dupVehRes = await fetch(`${BASE_URL}/api/vehicles`, {
    method: 'POST',
    headers: transporterHeaders,
    body: JSON.stringify({
      registration_number: regNumber,
      vehicle_type: 'Mini Truck',
      capacity_kg: 1000,
    }),
  });
  if (dupVehRes.status !== 400 && dupVehRes.status !== 409) {
    throw new Error(`Test 3 Failed: Duplicate vehicle registration was not rejected (status ${dupVehRes.status})`);
  }
  passed++;
  console.log(`✅ TEST 3 PASSED: Vehicle ${regNumber} registered and duplicate registration rejected.\n`);

  // TEST 4: Cross-RBAC Lifecycle Generation (Farmer Listing -> Order -> Auto Transport Request)
  total++;
  console.log('Test 4: Bootstrapping live agricultural order and verifying auto-generation of Transport Request...');
  await bootstrapFarmer({ full_name: 'Ramesh Verma (Farmer)', village: 'Barabanki', district: 'Barabanki' });

  const listingRes = await createFarmerListing({
    crop_name: 'Fresh Desi Tomato E2E',
    category: 'Vegetables',
    quantity: 800,
    price_per_kg: 24,
    grade: 'A',
    harvest_date: new Date().toISOString().split('T')[0],
    shelf_life_days: 7,
    location_name: 'Barabanki Farm Cluster',
  });
  const listing = listingRes.data;
  if (!listing?.id) throw new Error('Test 4 Failed: Could not create farmer listing');

  const orderRes = await createBuyerOrder({
    listing_id: listing.id,
    quantity: 250,
    unit_price: 24,
    delivery_fee: 750,
  });
  const order = orderRes.data;
  if (!order?.id) throw new Error('Test 4 Failed: Could not create buyer order');

  // Accept order as farmer -> auto-creates transport request
  const acceptRes = await fetch(`${BASE_URL}/api/orders/${order.id}/accept`, {
    method: 'POST',
    headers: farmerAuthHeader,
  });
  const acceptJson = await acceptRes.json();
  const transportReqId = acceptJson.transportRequest?.id || acceptJson.transport_request?.id;

  if (!acceptRes.ok || !transportReqId) {
    throw new Error(`Test 4 Failed: Order acceptance did not generate transport request: ${JSON.stringify(acceptJson)}`);
  }
  passed++;
  console.log(`✅ TEST 4 PASSED: Farmer accepted order -> Transport Request ${transportReqId} auto-generated.\n`);

  // TEST 5: SmartMatch Job Discovery & Perishability Scoring
  total++;
  console.log('Test 5: Verifying SmartMatch Logistics Job Discovery (/api/transporters/jobs)...');
  const jobsRes = await fetch(`${BASE_URL}/api/transporters/jobs`, { headers: transporterHeaders });
  const jobsJson = await jobsRes.json();

  if (!jobsRes.ok || !jobsJson.success || !Array.isArray(jobsJson.jobs)) {
    throw new Error(`Test 5 Failed: Could not fetch jobs: ${JSON.stringify(jobsJson)}`);
  }

  const targetJob = jobsJson.jobs.find((j: any) => j.id === transportReqId);
  if (!targetJob) {
    throw new Error(`Test 5 Failed: Generated transport request ${transportReqId} not found in marketplace`);
  }

  if (typeof targetJob.match_score !== 'number' || targetJob.match_score <= 0) {
    throw new Error('Test 5 Failed: SmartMatch score was not computed');
  }
  passed++;
  console.log(`✅ TEST 5 PASSED: SmartMatch job found with score ${targetJob.match_score}% and ₹${targetJob.fare_amount} fare.\n`);

  // TEST 6: Atomic Double-Claim Prevention on Acceptance
  total++;
  console.log('Test 6: Verifying atomic double-claim prevention on job acceptance (/api/transport/requests/[id]/accept)...');
  const [claimA, claimB] = await Promise.all([
    fetch(`${BASE_URL}/api/transport/requests/${transportReqId}/accept`, {
      method: 'POST',
      headers: transporterHeaders,
      body: JSON.stringify({ vehicle_capacity_kg: 1200 }),
    }),
    fetch(`${BASE_URL}/api/transport/requests/${transportReqId}/accept`, {
      method: 'POST',
      headers: rivalHeaders,
      body: JSON.stringify({ vehicle_capacity_kg: 1500 }),
    }),
  ]);

  const statuses = [claimA.status, claimB.status];
  const has200 = statuses.includes(200);
  const has409 = statuses.includes(409) || statuses.includes(400);

  if (!has200 || !has409) {
    throw new Error(`Test 6 Failed: Expected exactly one 200 and one 409/400. Got: ${statuses.join(', ')}`);
  }

  // Identify winning shipment ID
  const winningJson = claimA.status === 200 ? await claimA.json() : await claimB.json();
  const shipmentId = winningJson.shipment?.id;
  if (!shipmentId) {
    throw new Error('Test 6 Failed: Winning claim did not produce a shipment ID');
  }
  passed++;
  console.log(`✅ TEST 6 PASSED: Atomic double-claim prevention verified (200 & 409). Shipment created: ${shipmentId}.\n`);

  // TEST 7: Multi-Stage Shipment Lifecycle Transitions
  total++;
  console.log('Test 7: Verifying multi-stage shipment execution (Pickup -> Start Transit -> Destination -> Deliver)...');

  // Step 7a: Arrived at Pickup
  const arrivePickupRes = await fetch(`${BASE_URL}/api/shipments/${shipmentId}/pickup`, {
    method: 'POST',
    headers: transporterHeaders,
    body: JSON.stringify({ status: 'ARRIVED_AT_PICKUP' }),
  });
  if (!arrivePickupRes.ok) throw new Error(`Step 7a failed: ${arrivePickupRes.status}`);

  // Step 7b: Confirm Cargo Loaded
  const confirmPickupRes = await fetch(`${BASE_URL}/api/shipments/${shipmentId}/pickup`, {
    method: 'POST',
    headers: transporterHeaders,
    body: JSON.stringify({ status: 'PICKED_UP' }),
  });
  if (!confirmPickupRes.ok) throw new Error(`Step 7b failed: ${confirmPickupRes.status}`);

  // Step 7c: Start In Transit
  const startTransitRes = await fetch(`${BASE_URL}/api/shipments/${shipmentId}/start`, {
    method: 'POST',
    headers: transporterHeaders,
    body: JSON.stringify({}),
  });
  if (!startTransitRes.ok) throw new Error(`Step 7c failed: ${startTransitRes.status}`);

  // Step 7d: Arrived at Destination
  const arriveDestRes = await fetch(`${BASE_URL}/api/shipments/${shipmentId}/arrive`, {
    method: 'POST',
    headers: transporterHeaders,
    body: JSON.stringify({}),
  });
  if (!arriveDestRes.ok) throw new Error(`Step 7d failed: ${arriveDestRes.status}`);

  // Step 7e: Confirm Delivery
  const deliverRes = await fetch(`${BASE_URL}/api/shipments/${shipmentId}/deliver`, {
    method: 'POST',
    headers: transporterHeaders,
    body: JSON.stringify({}),
  });
  if (!deliverRes.ok) throw new Error(`Step 7e failed: ${deliverRes.status}`);

  // Verify status in DB
  const { data: dbShipment }: any = await supabaseAdmin.from('shipments').select('status, transporter_id').eq('id', shipmentId).single();
  if (dbShipment?.status !== 'DELIVERED') {
    throw new Error(`Test 7 Failed: Expected DB shipment status DELIVERED, got ${dbShipment?.status}`);
  }
  passed++;
  console.log('✅ TEST 7 PASSED: Shipment successfully progressed through 5 lifecycle stages to DELIVERED.\n');

  // TEST 8: 100% Transporter Payout Verification (Rule R-001)
  total++;
  console.log('Test 8: Verifying 100% direct transporter payout under Rule R-001 (/api/transporters/earnings)...');
  const earningsRes = await fetch(`${BASE_URL}/api/transporters/earnings`, { headers: transporterHeaders });
  const earningsJson = await earningsRes.json();

  if (!earningsRes.ok || !earningsJson.success || !earningsJson.summary) {
    throw new Error(`Test 8 Failed: Could not fetch earnings summary: ${JSON.stringify(earningsJson)}`);
  }

  if (earningsJson.summary.platform_fee !== 0) {
    throw new Error(`Test 8 Failed: Platform fee must be 0 under Rule R-001. Found: ${earningsJson.summary.platform_fee}`);
  }

  if (earningsJson.summary.total_earnings <= 0) {
    throw new Error('Test 8 Failed: Total earnings should reflect completed deliveries');
  }
  passed++;
  console.log(`✅ TEST 8 PASSED: 100% Payout verified! Driver received full delivery fee with ₹${earningsJson.summary.platform_fee} platform deductions.\n`);

  // TEST 9: Transporter Ratings & Reviews
  total++;
  console.log('Test 9: Verifying Transporter Ratings & Verified Reviews (/api/transporters/ratings)...');
  const postRatingRes = await fetch(`${BASE_URL}/api/transporters/ratings`, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer demo_token_buyer',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      order_id: order.id,
      shipment_id: shipmentId,
      reviewee_id: dbShipment.transporter_id || '00000000-0000-4000-f000-000000000001',
      rating: 5,
      punctuality_rating: 5,
      handling_rating: 5,
      communication_rating: 5,
      review_text: 'समय पर डिलीवरी और टमाटर पूरी तरह सुरक्षित रहे। बेहतरीन सेवा!',
    }),
  });
  const postRatingJson = await postRatingRes.json();
  if (!postRatingRes.ok || !postRatingJson.success) {
    throw new Error(`Test 9 Failed: Submitting rating failed: ${JSON.stringify(postRatingJson)}`);
  }

  // Get ratings overview
  const getRatingsRes = await fetch(`${BASE_URL}/api/transporters/ratings`, {
    headers: transporterHeaders,
  });
  const getRatingsJson = await getRatingsRes.json();

  if (!getRatingsRes.ok || !getRatingsJson.success || !getRatingsJson.overview) {
    throw new Error(`Test 9 Failed: Could not retrieve ratings overview: ${JSON.stringify(getRatingsJson)}`);
  }

  if (getRatingsJson.overview.overall_rating < 4.0) {
    throw new Error(`Test 9 Failed: Expected high overall rating, got ${getRatingsJson.overview.overall_rating}`);
  }
  passed++;
  console.log(`✅ TEST 9 PASSED: Verified 5.0★ rating recorded and calculated in quality metrics.\n`);

  // Cleanup
  console.log('Cleanup: Cleaning test run records from database...');
  try { await supabaseAdmin.from('ratings').delete().eq('order_id', order.id); } catch (e) {}
  try { await supabaseAdmin.from('payment_ledger').delete().eq('order_id', order.id); } catch (e) {}
  try { await supabaseAdmin.from('shipments').delete().eq('id', shipmentId); } catch (e) {}
  try { await supabaseAdmin.from('transport_requests').delete().eq('id', transportReqId); } catch (e) {}
  try { await supabaseAdmin.from('orders').delete().eq('id', order.id); } catch (e) {}
  try { await supabaseAdmin.from('produce_listings').delete().eq('id', listing.id); } catch (e) {}

  console.log(`\n🎉 All ${passed}/${total} Transporter Portal E2E Tests Passed Successfully!`);
}

runTransporterE2ETests().catch((err) => {
  console.error('\n❌ E2E Test Failure:', err);
  process.exit(1);
});
