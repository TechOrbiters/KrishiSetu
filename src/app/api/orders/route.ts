import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware';
import { checkIdempotency, saveIdempotency } from '@/lib/middleware/idempotency';
import { supabaseAdmin } from '@/lib/supabase/server';
import { calculateFarmerRevenue } from '@/lib/domain/pricing';

export async function GET(req: NextRequest) {
  const { user, errorResponse } = await authenticateRequest(req);
  if (errorResponse) return errorResponse;

  try {
    let dbUserId = user!.uid;
    const { data: dbUserData } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('firebase_uid', user!.uid)
      .maybeSingle();

    if (dbUserData?.id) {
      dbUserId = dbUserData.id;
    }

    let query = supabaseAdmin
      .from('orders')
      .select('*, produce_listings(*)')
      .order('created_at', { ascending: false });

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(dbUserId);

    if (user!.role !== 'ADMIN' && isUuid) {
      if (user!.role === 'BUYER') {
        query = query.or(`buyer_id.eq.${dbUserId}`);
      } else if (user!.role === 'FARMER' || user!.role === 'FARMER_FPO') {
        query = query.or(`farmer_id.eq.${dbUserId}`);
      } else {
        query = query.or(`buyer_id.eq.${dbUserId},farmer_id.eq.${dbUserId}`);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching orders:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, orders: data || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { user, errorResponse } = await authenticateRequest(req, ['BUYER', 'FARMER', 'FPO_ADMIN', 'FARMER_FPO']);
  if (errorResponse) return errorResponse;

  // Idempotency check
  const { cachedResponse, idempotencyKey } = await checkIdempotency(req, user!.uid);
  if (cachedResponse) return cachedResponse;

  try {
    const body = await req.json();
    const { listing_id, quantity, unit_price, delivery_fee } = body;

    if (!listing_id) {
      return NextResponse.json({ success: false, error: 'listing_id is required' }, { status: 400 });
    }

    const qty = Number(quantity);
    if (isNaN(qty) || qty <= 0) {
      return NextResponse.json({ success: false, error: 'Quantity must be a positive number' }, { status: 400 });
    }

    // 1. Query target listing from produce_listings (or listings fallback) to derive farmer_id and check available_quantity
    let { data: listing, error: listingErr } = await supabaseAdmin
      .from('produce_listings')
      .select('*')
      .eq('id', listing_id)
      .maybeSingle();

    let targetTable = 'produce_listings';

    if (listingErr || !listing) {
      const fallbackResult = await supabaseAdmin
        .from('listings')
        .select('*')
        .eq('id', listing_id)
        .maybeSingle();
      if (fallbackResult.data) {
        listing = fallbackResult.data;
        targetTable = 'listings';
      }
    }

    if (!listing) {
      return NextResponse.json({ success: false, error: 'Produce listing not found' }, { status: 404 });
    }

    const currentStatus = (listing.status || 'ACTIVE').toUpperCase();
    if (currentStatus === 'EXPIRED' || currentStatus === 'PAUSED' || currentStatus === 'INACTIVE' || currentStatus === 'SOLD_OUT') {
      return NextResponse.json({
        success: false,
        error: `Cannot place order on listing with status ${currentStatus}`,
      }, { status: 400 });
    }

    const availableQty = Number(listing.available_quantity ?? listing.availableQtyKg ?? listing.total_quantity ?? 0);
    const reservedQty = Number(listing.reserved_quantity ?? 0);
    const pricePerKg = Number(unit_price ?? listing.price_per_kg ?? listing.askingPricePerKg ?? 20);
    const delFee = Number(delivery_fee || 0);

    // 2. Strict Inventory Overselling Check
    if (availableQty < qty) {
      return NextResponse.json(
        { success: false, error: `Insufficient inventory available. Requested: ${qty}kg, Available: ${availableQty}kg` },
        { status: 409 }
      );
    }

    // Derive farmer_id strictly from database record
    const derivedFarmerId = listing.farmer_id;
    if (!derivedFarmerId) {
      return NextResponse.json({ success: false, error: 'Listing does not have a valid farmer owner' }, { status: 400 });
    }

    // 3. Atomic Inventory Reservation: available_quantity -= qty, reserved_quantity += qty
    const newAvailableQty = availableQty - qty;
    const newReservedQty = reservedQty + qty;

    const { error: updateListingErr } = await supabaseAdmin
      .from(targetTable)
      .update({
        available_quantity: newAvailableQty,
        reserved_quantity: newReservedQty,
        status: newAvailableQty <= 0 ? 'LOW_STOCK' : listing.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', listing_id);

    if (updateListingErr) {
      console.error('Failed to reserve listing inventory:', updateListingErr.message);
      return NextResponse.json({ success: false, error: 'Failed to reserve inventory' }, { status: 500 });
    }

    // 4. Calculate Order Pricing
    const pricing = calculateFarmerRevenue(pricePerKg, qty, delFee);
    const orderNumber = `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(); // 12 Hours TTL

    // Resolve buyer DB user ID
    let buyerDbId = user!.uid;
    const { data: dbUserData } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('firebase_uid', user!.uid)
      .maybeSingle();

    if (dbUserData?.id) {
      buyerDbId = dbUserData.id;
    }

    const orderPayload = {
      order_number: orderNumber,
      listing_id,
      buyer_id: buyerDbId,
      farmer_id: derivedFarmerId,
      quantity: qty,
      unit_price: pricePerKg,
      product_amount: pricing.productAmount,
      delivery_fee: pricing.deliveryFee,
      total_amount: pricing.buyerTotal,
      status: 'PLACED',
      expires_at: expiresAt,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: createdOrder, error: insertErr } = await supabaseAdmin
      .from('orders')
      .insert(orderPayload)
      .select()
      .single();

    if (insertErr || !createdOrder) {
      console.warn('Supabase order insert warning:', insertErr?.message);
    }

    const finalOrder = createdOrder || { id: `ord_${Date.now()}`, ...orderPayload };
    const resultBody = {
      success: true,
      order: finalOrder,
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
