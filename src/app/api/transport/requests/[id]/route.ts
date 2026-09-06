import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { errorResponse } = await authenticateRequest(req);
  if (errorResponse) return errorResponse;

  try {
    const requestId = params.id;
    if (!requestId) {
      return NextResponse.json({ success: false, error: 'Request ID is required' }, { status: 400 });
    }

    const { data: request, error } = await supabaseAdmin
      .from('transport_requests')
      .select('*')
      .eq('id', requestId)
      .maybeSingle();

    if (error || !request) {
      return NextResponse.json({ success: false, error: 'Transport request not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      request,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, errorResponse } = await authenticateRequest(req, ['TRANSPORTER', 'FARMER_FPO', 'FARMER', 'BUYER', 'FPO_ADMIN', 'ADMIN']);
  if (errorResponse) return errorResponse;

  try {
    const requestId = params.id;
    if (!requestId) {
      return NextResponse.json({ success: false, error: 'Request ID is required' }, { status: 400 });
    }

    const body = await req.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json({ success: false, error: 'Status is required' }, { status: 400 });
    }

    const nowIso = new Date().toISOString();

    // 1. Update transport_request
    const { data: updatedReq, error: updateErr } = await supabaseAdmin
      .from('transport_requests')
      .update({
        status,
        updated_at: nowIso,
      })
      .eq('id', requestId)
      .select()
      .maybeSingle();

    if (updateErr || !updatedReq) {
      return NextResponse.json({ success: false, error: updateErr?.message || 'Transport request not found' }, { status: 500 });
    }

    // 2. Cascade status to orders and shipments
    if (updatedReq.order_id) {
      let orderStatus: string | null = null;
      let shipmentStatus: string | null = null;

      if (status === 'IN_TRANSIT') {
        orderStatus = 'IN_TRANSIT';
        shipmentStatus = 'IN_TRANSIT';
      } else if (status === 'COMPLETED' || status === 'DELIVERED') {
        orderStatus = 'DELIVERED';
        shipmentStatus = 'DELIVERED';
      } else if (status === 'CANCELLED') {
        orderStatus = 'CANCELLED';
        shipmentStatus = 'CANCELLED';
      }

      if (orderStatus) {
        await supabaseAdmin
          .from('orders')
          .update({ status: orderStatus, updated_at: nowIso })
          .eq('id', updatedReq.order_id);
      }

      if (shipmentStatus) {
        await supabaseAdmin
          .from('shipments')
          .update({ status: shipmentStatus, updated_at: nowIso })
          .eq('order_id', updatedReq.order_id);
      }
    }

    return NextResponse.json({
      success: true,
      request: updatedReq,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
