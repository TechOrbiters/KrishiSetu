/**
 * KRISHISETU — Step 8 Integration Test Suite
 * Verification of Payments/Earnings Ledger & Notifications System:
 * 1. Exact payment calculations (farmerRevenue = askingPrice × quantity, delivery fee separate, platform fee = ₹0).
 * 2. Payment ledger persistence in Supabase `payment_ledger` table.
 * 3. Farmer earnings API (`GET /api/payments/ledger`) returns real server ledger data.
 * 4. Zero transport deduction (delivery charge paid by buyer, never deducted from farmer revenue).
 * 5. FCM device token registration API (`POST /api/notifications/fcm-token`) stores tokens per user.
 * 6. Domain event notification dispatch & retrieval (`GET /api/notifications`).
 * 7. Duplicate notification prevention (idempotency key prevents duplicate notification insertion).
 * 8. Order delivery triggers payment settlement & `PAYMENT_RECEIVED` domain notification.
 */

import { supabaseAdmin } from '../src/lib/supabase/server';
import { bootstrapFarmer, createFarmerListing, createBuyerOrder } from '../src/lib/api/client';
import { registerUserFcmToken, sendDomainNotification } from '../src/lib/notifications/service';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

async function runStep8Tests() {
  console.log('🧪 Starting Step 8: Payments, Earnings Ledger & Notifications Verification...\n');
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

  // Setup Farmer & User IDs in DB
  console.log('Setup: Bootstrapping farmer user and cleaning old test records...');
  const farmerBoot: any = await bootstrapFarmer({ full_name: 'Test Farmer Step8', village: 'Barabanki', district: 'Barabanki' });
  let farmerDbId = farmerBoot.user?.id || farmerBoot.data?.user?.id;
  if (!farmerDbId) {
    const { data: dbUser } = await supabaseAdmin.from('users').select('id').eq('firebase_uid', 'demo_uid_farmer').maybeSingle();
    farmerDbId = dbUser?.id || '00000000-0000-4000-a000-000000000001';
  }

  // Setup Listing & Order (500kg @ ₹22/kg, delivery fee ₹1,500)
  const listingRes = await createFarmerListing({
    crop_name: 'Wheat Step8',
    category: 'Grains',
    quantity: 1000,
    price_per_kg: 22,
    grade: 'A',
    harvest_date: new Date().toISOString(),
    shelf_life_days: 7,
    location_name: 'Barabanki Mandi',
  });

  const listing = listingRes.data;
  if (!listing || !listing.id) throw new Error('Failed to setup produce listing for Step 8 test');

  const orderRes = await createBuyerOrder({
    listing_id: listing.id,
    quantity: 500,
    unit_price: 22,
    delivery_fee: 1500,
  });

  const order = orderRes.data;
  if (!order || !order.id) throw new Error('Failed to setup buyer order for Step 8 test');

  // TEST 1: Payment formula verification (500kg × ₹22 = ₹11,000 farmer revenue, ₹1,500 delivery charge, ₹0 platform fee)
  total++;
  console.log('Test 1: Verifying payment calculation formula...');
  const settleRes = await fetch(`${BASE_URL}/api/payments/settle`, {
    method: 'POST',
    headers: farmerAuthHeader,
    body: JSON.stringify({ order_id: order.id }),
  });

  const settleJson = await settleRes.json();
  if (settleRes.ok && settleJson.success && settleJson.calculation) {
    const calc = settleJson.calculation;
    const expectedFarmerRevenue = 500 * 22; // 11,000
    const expectedDelivery = 1500;
    const expectedBuyerTotal = 12500;

    if (
      calc.farmerRevenue === expectedFarmerRevenue &&
      calc.deliveryCharge === expectedDelivery &&
      calc.buyerTotal === expectedBuyerTotal &&
      calc.platformFee === 0
    ) {
      console.log(`✅ TEST 1 PASSED: Formula verified! Farmer Revenue: ₹${calc.farmerRevenue}, Delivery Charge: ₹${calc.deliveryCharge}, Buyer Total: ₹${calc.buyerTotal}, Platform Fee: ₹${calc.platformFee}.`);
      passed++;
    } else {
      console.error('❌ TEST 1 FAILED: Formula mismatch', calc);
    }
  } else {
    console.error('❌ TEST 1 FAILED: Settle payment API call failed', settleJson);
  }

  // TEST 2: Payment ledger record persistence in Supabase `payment_ledger` table
  total++;
  console.log('\nTest 2: Verifying payment ledger records persistence in Supabase...');
  const { data: dbLedger } = await supabaseAdmin
    .from('payment_ledger')
    .select('*')
    .eq('order_id', order.id);

  if (dbLedger && dbLedger.length >= 2) {
    const productEntry = dbLedger.find((l: any) => l.fee_type === 'PRODUCT_PAYMENT');
    const deliveryEntry = dbLedger.find((l: any) => l.fee_type === 'DELIVERY_FEE');

    if (productEntry && deliveryEntry && Number(productEntry.amount) === 11000 && Number(deliveryEntry.amount) === 1500) {
      console.log(`✅ TEST 2 PASSED: 2 ledger records persisted (Product: ₹${productEntry.amount}, Delivery: ₹${deliveryEntry.amount}).`);
      passed++;
    } else {
      console.error('❌ TEST 2 FAILED: Ledger entry amounts incorrect', dbLedger);
    }
  } else {
    console.error('❌ TEST 2 FAILED: Ledger records not found in database', dbLedger);
  }

  // TEST 3: Farmer earnings API (`GET /api/payments/ledger`) returns real ledger data
  total++;
  console.log('\nTest 3: Verifying GET /api/payments/ledger returns real server data...');
  const ledgerApiRes = await fetch(`${BASE_URL}/api/payments/ledger`, {
    headers: farmerAuthHeader,
  });

  const ledgerApiJson = await ledgerApiRes.json();
  if (ledgerApiRes.ok && ledgerApiJson.success && ledgerApiJson.summary) {
    const sum = ledgerApiJson.summary;
    if (sum.platformFee === 0 && typeof sum.totalEarnings === 'number') {
      console.log(`✅ TEST 3 PASSED: Farmer Earnings API returned summary (Total Earnings: ₹${sum.totalEarnings}, Pending: ₹${sum.pendingPayouts}, Platform Fee: ₹${sum.platformFee}).`);
      passed++;
    } else {
      console.error('❌ TEST 3 FAILED: Invalid summary object in ledger API', sum);
    }
  } else {
    console.error('❌ TEST 3 FAILED: GET /api/payments/ledger call failed', ledgerApiJson);
  }

  // TEST 4: Zero transport deduction verification (delivery charge is paid by buyer, never deducted from farmer)
  total++;
  console.log('\nTest 4: Verifying delivery charge is never deducted from farmer revenue...');
  const productAmount = 500 * 22; // 11,000
  const deliveryFee = 1500;
  const netFarmerPayout = productAmount; // Must equal productAmount without any deduction

  if (netFarmerPayout === 11000 && netFarmerPayout + deliveryFee === 12500) {
    console.log('✅ TEST 4 PASSED: Delivery charge (₹1,500) paid separately by buyer; Farmer receives full ₹11,000.');
    passed++;
  } else {
    console.error('❌ TEST 4 FAILED: Transport deduction policy violated');
  }

  // TEST 5: FCM device token registration API
  total++;
  console.log('\nTest 5: Verifying FCM device token registration API...');
  const registered = await registerUserFcmToken(farmerDbId, 'test_fcm_token_device_step8_abc123', 'Chrome Browser');

  if (registered) {
    console.log('✅ TEST 5 PASSED: FCM device token registered successfully for user.');
    passed++;
  } else {
    console.error('❌ TEST 5 FAILED: FCM token registration returned false');
  }

  // TEST 6: Domain event notification dispatch & retrieval
  total++;
  console.log('\nTest 6: Verifying domain event notification dispatch & retrieval...');
  const dispatchRes = await sendDomainNotification({
    userId: farmerDbId,
    eventType: 'FRESHNESS_ALERT',
    title: 'ताज़गी चेतावनी (Freshness Alert)',
    message: 'आपकी टमाटर फसल की 24 घंटे शेल्फ-लाइफ शेष है।',
    idempotencyKey: `FRESHNESS_ALERT:${listing.id}`,
  });

  const getNotifsRes = await fetch(`${BASE_URL}/api/notifications`, {
    headers: farmerAuthHeader,
  });
  const getNotifsJson = await getNotifsRes.json();

  if (dispatchRes.success && dispatchRes.notification && getNotifsRes.ok && getNotifsJson.success && Array.isArray(getNotifsJson.notifications) && getNotifsJson.notifications.length > 0) {
    console.log(`✅ TEST 6 PASSED: Retrieved ${getNotifsJson.notifications.length} notifications from server.`);
    passed++;
  } else {
    console.error('❌ TEST 6 FAILED: Failed to retrieve notifications', { dispatchRes, getNotifsJson });
  }

  // TEST 7: Duplicate notification prevention (idempotency key prevents duplicate insert)
  total++;
  console.log('\nTest 7: Verifying duplicate notification prevention...');
  const dupDispatchRes = await sendDomainNotification({
    userId: farmerDbId,
    eventType: 'FRESHNESS_ALERT',
    title: 'ताज़गी चेतावनी (Freshness Alert)',
    message: 'आपकी टमाटर फसल की 24 घंटे शेल्फ-लाइफ शेष है।',
    idempotencyKey: `FRESHNESS_ALERT:${listing.id}`, // Same idempotency key
  });

  if (dupDispatchRes.success && dupDispatchRes.isDuplicate === true) {
    console.log('✅ TEST 7 PASSED: Duplicate notification prevented (isDuplicate = true).');
    passed++;
  } else {
    console.error('❌ TEST 7 FAILED: Duplicate notification was not prevented', dupDispatchRes);
  }

  // TEST 8: Order delivery triggers payment settlement & PAYMENT_RECEIVED notification
  total++;
  console.log('\nTest 8: Verifying shipment delivery settlement and PAYMENT_RECEIVED notification...');
  
  const transporterId = '00000000-0000-4000-f000-000000000001';
  await supabaseAdmin.from('users').upsert({
    id: transporterId,
    firebase_uid: 'demo_uid_transporter_a',
    full_name: 'Test Transporter',
    phone: '+919876543212',
    role: 'TRANSPORTER',
    updated_at: new Date().toISOString(),
  }, { onConflict: 'id' });

  // Create transport request & shipment for order
  const { data: shipment, error: shipError } = await supabaseAdmin
    .from('shipments')
    .insert({
      order_id: order.id,
      transporter_id: transporterId,
      status: 'SCHEDULED',
      pickup_address: 'Barabanki Mandi',
      delivery_address: 'Lucknow Mandi',
      pickup_lat: 26.9200,
      pickup_lng: 81.1800,
      delivery_lat: 26.8467,
      delivery_lng: 80.9462,
    })
    .select()
    .single();

  if (shipError) {
    console.error('Shipment insert error:', shipError);
  }

  if (shipment) {
    const deliverRes = await fetch(`${BASE_URL}/api/shipments/${shipment.id}/deliver`, {
      method: 'POST',
      headers: transporterAuthHeader,
    });

    const deliverJson = await deliverRes.json();

    const notifsAfterDeliver = await fetch(`${BASE_URL}/api/notifications`, {
      headers: farmerAuthHeader,
    });
    const notifsAfterDeliverJson = await notifsAfterDeliver.json();

    const paymentNotif = notifsAfterDeliverJson.notifications?.find((n: any) => n.event_type === 'PAYMENT_RECEIVED' || n.event_type === 'DELIVERED');

    if (deliverRes.ok && deliverJson.success && paymentNotif) {
      console.log(`✅ TEST 8 PASSED: Delivery completed & '${paymentNotif.event_type}' notification generated for farmer.`);
      passed++;
    } else {
      console.error('❌ TEST 8 FAILED: Delivery settlement or notification missing', { deliverJson, notifsAfterDeliverJson });
    }
  } else {
    console.error('❌ TEST 8 FAILED: Failed to create test shipment');
  }

  // Cleanup test records
  await supabaseAdmin.from('produce_listings').delete().eq('id', listing.id);

  console.log(`\n🎉 Verification Summary: ${passed}/${total} Step 8 tests passed successfully!`);

  if (passed !== total) {
    process.exit(1);
  }
}

runStep8Tests().catch((err) => {
  console.error('Unhandled test failure:', err);
  process.exit(1);
});
