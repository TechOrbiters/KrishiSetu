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
        error: 'Forbidden: You are not authorized to reject this order',
      }, { status: 403 });
    }

    // Status transition check: Must be in PLACED status
    if (order.status !== 'PLACED') {
      return NextResponse.json({
        success: false,
        error: `Cannot reject order in '${order.status}' status. Only 'PLACED' orders can be rejected.`,
      }, { status: 400 });
    }

    // Release inventory atomically: reserved_quantity -= qty, available_quantity += qty
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
      const currentAvailable = Number(listing.available_quantity ?? listing.availableQtyKg ?? 0);
      const currentReserved = Number(listing.reserved_quantity || 0);
      const newReserved = Math.max(0, currentReserved - orderQty);
      const newAvailable = currentAvailable + orderQty;

      await supabaseAdmin
        .from(targetTable)
        .update({
          available_quantity: newAvailable,
          reserved_quantity: newReserved,
          status: 'ACTIVE',
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.listing_id);
    }

    // Update order status to CANCELLED / REJECTED
    const { data: updatedOrder, error: updateErr } = await supabaseAdmin
      .from('orders')
      .update({
        status: 'CANCELLED',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json({ success: false, error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Order rejected successfully and inventory released',
      order: updatedOrder || { ...order, status: 'CANCELLED' },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
