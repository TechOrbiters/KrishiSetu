import { supabaseAdmin } from '../src/lib/supabase/server';

async function testRpc() {
  const driverAUuid = '00000000-0000-4000-a000-000000000001';
  const orderId = '00000000-0000-4000-a000-000000000002';
  const listingId = '00000000-0000-4000-a000-000000000003';
  const reqId = '00000000-0000-4000-a000-000000000004';

  // Ensure driver user exists
  await supabaseAdmin.from('users').upsert({
    id: driverAUuid,
    firebase_uid: 'demo_uid_transporter_a',
    phone: '+919812345671',
    full_name: 'Driver A',
    role: 'TRANSPORTER',
  });

  await supabaseAdmin.from('produce_listings').upsert({
    id: listingId,
    farmer_id: driverAUuid,
    crop_name: 'Debug Wheat',
    category: 'Grains',
    total_quantity: 100,
    available_quantity: 100,
    price_per_kg: 20,
    harvest_date: new Date().toISOString().split('T')[0],
    shelf_life_days: 5,
    location_name: 'Lucknow',
    latitude: 26.8,
    longitude: 80.9,
  });

  const { error: orderErr } = await supabaseAdmin.from('orders').upsert({
    id: orderId,
    order_number: 'ORD-DEBUG-1',
    listing_id: listingId,
    buyer_id: driverAUuid,
    farmer_id: driverAUuid,
    quantity: 50,
    unit_price: 20,
    product_amount: 1000,
    delivery_fee: 100,
    total_amount: 1100,
    status: 'PLACED',
    expires_at: new Date(Date.now() + 12 * 3600 * 1000).toISOString(),
  });
  console.log('Order upsert error:', orderErr);

  const { data: insertedReq, error: upsertErr } = await supabaseAdmin.from('transport_requests').upsert({
    id: reqId,
    order_id: orderId,
    fare_amount: 100,
    distance_km: 10,
    status: 'REQUESTED',
  }).select().single();

  console.log('Inserted request:', insertedReq, 'Upsert error:', upsertErr);

  console.log('Testing RPC accept_transport_request...');
  const { data: rpcResult, error: rpcErr } = await supabaseAdmin.rpc('accept_transport_request', {
    p_request_id: reqId,
    p_transporter_id: driverAUuid,
  });

  console.log('RPC result:', rpcResult, 'RPC error:', rpcErr);

  // Cleanup
  await supabaseAdmin.from('transport_requests').delete().eq('id', reqId);
  await supabaseAdmin.from('orders').delete().eq('id', orderId);
  await supabaseAdmin.from('produce_listings').delete().eq('id', listingId);
}

testRpc().catch(console.error);
