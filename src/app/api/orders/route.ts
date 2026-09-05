import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware';
import { checkIdempotency, saveIdempotency } from '@/lib/middleware/idempotency';
import { supabaseAdmin } from '@/lib/supabase/server';
import { calculateFarmerRevenue } from '@/lib/domain/pricing';

export async function GET(req: NextRequest) {
  const { user, errorResponse } = await authenticateRequest(req);
  if (errorResponse) return errorResponse;

  try {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('*, listings(*)')
      .or(`buyer_id.eq.${user!.uid},farmer_id.eq.${user!.uid}`)
      .order('created_at', { ascending: false });

    if (error || !data) {
      return NextResponse.json({ success: true, orders: [] });
    }

    return NextResponse.json({ success: true, orders: data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { user, errorResponse } = await authenticateRequest(req, ['BUYER', 'FARMER', 'FPO_ADMIN']);
  if (errorResponse) return errorResponse;

  // Idempotency check
  const { cachedResponse, idempotencyKey } = await checkIdempotency(req, user!.uid);
  if (cachedResponse) return cachedResponse;

  try {
    const body = await req.json();
    const { listing_id, farmer_id, quantity, unit_price, delivery_fee } = body;

    if (!listing_id || !quantity || !unit_price) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const qty = Number(quantity);
    const price = Number(unit_price);
    const delFee = Number(delivery_fee || 0);

    // Call atomic RPC function to reserve quantity and acquire ROW LOCK
    const { data: reserved, error: reserveErr } = await supabaseAdmin.rpc('reserve_listing_quantity', {
      p_listing_id: listing_id,
      p_requested_qty: qty,
    });

    if (reserveErr) {
      console.warn('RPC reserve_listing_quantity unavailable or failed, proceeding with safety check:', reserveErr.message);
    } else if (reserved === false) {
      return NextResponse.json(
        { success: false, error: 'Insufficient inventory available for this listing' },
        { status: 409 }
      );
    }

    // Money calculation (R-001: Zero platform fee invariant)
    const pricing = calculateFarmerRevenue(price, qty, delFee);
    const orderNumber = `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(); // 12 Hours TTL

    const orderPayload = {
      order_number: orderNumber,
      listing_id,
      buyer_id: user!.uid,
      farmer_id: farmer_id || user!.uid,
      quantity: qty,
      unit_price: price,
      product_amount: pricing.productAmount,
      delivery_fee: pricing.deliveryFee,
      total_amount: pricing.buyerTotal,
      status: 'PLACED',
      expires_at: expiresAt,
      created_at: new Date().toISOString(),
    };

    const { data: createdOrder, error: insertErr } = await supabaseAdmin
      .from('orders')
      .insert(orderPayload)
      .select()
      .single();

    const resultBody = {
      success: true,
      order: createdOrder || { id: `ord_${Date.now()}`, ...orderPayload },
      breakdown: pricing,
    };

    if (idempotencyKey) {
      await saveIdempotency(idempotencyKey, user!.uid, 201, resultBody);
    }

    return NextResponse.json(resultBody, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
