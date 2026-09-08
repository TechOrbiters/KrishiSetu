import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, errorResponse } = await authenticateRequest(req, ['FARMER', 'FPO_ADMIN', 'FARMER_FPO']);
  if (errorResponse) return errorResponse;

  try {
    const orderId = params.id;
    if (!orderId) {
      return NextResponse.json({ success: false, error: 'Order ID is required' }, { status: 400 });
    }

    // Resolve caller DB user ID
    let dbUserId = user!.uid;
    const { data: dbUserData } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('firebase_uid', user!.uid)
      .maybeSingle();

    if (dbUserData?.id) {
      dbUserId = dbUserData.id;
    }

    // Fetch order to verify ownership and current status
    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .maybeSingle();

    if (orderErr || !order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    // Ownership check: must be farmer associated with the order
    if (order.farmer_id !== user!.uid && order.farmer_id !== dbUserId) {
      return NextResponse.json({
        success: false,
        error: 'Forbidden: You are not authorized to accept this order',
      }, { status: 403 });
    }

    // Status transition check: Must be in PLACED status
    if (order.status !== 'PLACED') {
      return NextResponse.json({
        success: false,
        error: `Cannot accept order in '${order.status}' status. Only 'PLACED' orders can be accepted.`,
      }, { status: 400 });
    }

    // 12-Hour Acceptance Deadline Check (Server-authoritative)
    const now = Date.now();
    const expiresAtMs = order.expires_at ? new Date(order.expires_at).getTime() : (new Date(order.created_at).getTime() + 12 * 3600 * 1000);

    if (now > expiresAtMs) {
      // Mark as EXPIRED and revert reserved inventory
      const orderQty = Number(order.quantity || 0);

      await supabaseAdmin
        .from('orders')
        .update({ status: 'EXPIRED', updated_at: new Date().toISOString() })
        .eq('id', orderId);

      // Revert stock
      let { data: listing } = await supabaseAdmin
        .from('produce_listings')
        .select('*')
        .eq('id', order.listing_id)
        .maybeSingle();

      let targetTable = 'produce_listings';
      if (!listing) {
        const fallback = await supabaseAdmin.from('listings').select('*').eq('id', order.listing_id).maybeSingle();
        if (fallback.data) {
          listing = fallback.data;
          targetTable = 'listings';
        }
      }

      if (listing) {
        const availableQty = Number(listing.available_quantity || 0);
        const reservedQty = Number(listing.reserved_quantity || 0);
        await supabaseAdmin
          .from(targetTable)
          .update({
            available_quantity: availableQty + orderQty,
            reserved_quantity: Math.max(0, reservedQty - orderQty),
            updated_at: new Date().toISOString(),
          })
          .eq('id', order.listing_id);
      }

      return NextResponse.json({
        success: false,
        error: 'Order has expired (12-hour acceptance window passed) and cannot be accepted.',
      }, { status: 400 });
    }

    // Commit inventory atomically: reserved_quantity -= qty, sold_quantity += qty
    const orderQty = Number(order.quantity || 0);

    let { data: listing } = await supabaseAdmin
      .from('produce_listings')
      .select('*')
      .eq('id', order.listing_id)
      .maybeSingle();

    let targetTable = 'produce_listings';

    if (!listing) {
      const fallback = await supabaseAdmin
        .from('listings')
        .select('*')
        .eq('id', order.listing_id)
        .maybeSingle();
      if (fallback.data) {
        listing = fallback.data;
        targetTable = 'listings';
      }
    }

    if (listing) {
      const currentReserved = Number(listing.reserved_quantity || 0);
      const currentSold = Number(listing.sold_quantity || 0);
      const newReserved = Math.max(0, currentReserved - orderQty);
      const newSold = currentSold + orderQty;

      await supabaseAdmin
        .from(targetTable)
        .update({
          reserved_quantity: newReserved,
          sold_quantity: newSold,
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.listing_id);
    }

    // Update order status to ACCEPTED
    const { data: updatedOrder, error: updateErr } = await supabaseAdmin
      .from('orders')
      .update({
        status: 'ACCEPTED',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json({ success: false, error: updateErr.message }, { status: 500 });
    }

    // Rule R-012: Auto-create Transport Request on Farmer Order Acceptance
    const fareAmount = Number(order.delivery_fee || 500);
    const distanceKm = Number(order.distance_km || 15);

    const { data: transportReq, error: transportErr } = await supabaseAdmin
      .from('transport_requests')
      .insert({
        order_id: orderId,
        fare_amount: fareAmount,
        distance_km: distanceKm,
        status: 'REQUESTED',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .maybeSingle();

    if (transportErr) {
      console.warn('Transport request insert note:', transportErr.message);
    }

    return NextResponse.json({
      success: true,
      message: 'Order accepted successfully',
      order: updatedOrder || { ...order, status: 'ACCEPTED' },
      transportRequest: transportReq || { order_id: orderId, fare_amount: fareAmount, distance_km: distanceKm, status: 'REQUESTED' },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

