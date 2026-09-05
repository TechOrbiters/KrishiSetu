import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';

const VALID_TRANSITIONS: Record<string, string[]> = {
  PLACED: ['ACCEPTED', 'CANCELLED', 'EXPIRED'],
  ACCEPTED: ['PACKED', 'CANCELLED'],
  PACKED: ['DISPATCHED', 'CANCELLED'],
  DISPATCHED: ['IN_TRANSIT', 'CANCELLED'],
  IN_TRANSIT: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
  EXPIRED: [],
};

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { user, errorResponse } = await authenticateRequest(req);
  if (errorResponse) return errorResponse;

  const orderId = params.id;
  try {
    const body = await req.json();
    const { status: newStatus } = body;

    if (!newStatus) {
      return NextResponse.json({ success: false, error: 'Status is required' }, { status: 400 });
    }

    // Fetch existing order
    const { data: order, error: fetchErr } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    const currentStatus = order ? order.status : 'PLACED';
    const allowed = VALID_TRANSITIONS[currentStatus] || [];

    if (!allowed.includes(newStatus)) {
      return NextResponse.json({
        success: false,
        error: `Invalid state transition: Cannot change order from '${currentStatus}' to '${newStatus}'. Allowed: [${allowed.join(', ')}]`,
      }, { status: 400 });
    }

    // Update order status
    if (order) {
      await supabaseAdmin
        .from('orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId);
    }

    // If order is CANCELLED or EXPIRED, restore inventory back to listing
    if ((newStatus === 'CANCELLED' || newStatus === 'EXPIRED') && order) {
      await supabaseAdmin.rpc('restore_listing_quantity', {
        p_listing_id: order.listing_id,
        p_restored_qty: order.quantity,
      });
    }

    return NextResponse.json({
      success: true,
      orderId,
      previousStatus: currentStatus,
      newStatus,
      updatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
