import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * POST /api/shipments/[id]/arrive
 * Marks shipment as arrived at destination.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, errorResponse } = await authenticateRequest(req, ['TRANSPORTER', 'ADMIN', 'FARMER_FPO', 'BUYER']);
  if (errorResponse) return errorResponse;

  try {
    const shipmentId = params.id;
    const nowIso = new Date().toISOString();

    let shipment: any = null;
    const { data: directShipment } = await supabaseAdmin
      .from('shipments')
      .select('*')
      .or(`id.eq.${shipmentId},order_id.eq.${shipmentId}`)
      .maybeSingle();

    if (directShipment) {
      shipment = directShipment;
    } else {
      const { data: tr } = await supabaseAdmin
        .from('transport_requests')
        .select('order_id')
        .eq('id', shipmentId)
        .maybeSingle();
      if (tr?.order_id) {
        const { data: trShipment } = await supabaseAdmin
          .from('shipments')
          .select('*')
          .eq('order_id', tr.order_id)
          .maybeSingle();
        if (trShipment) shipment = trShipment;
      }
    }

    if (!shipment) {
      return NextResponse.json({ success: false, error: 'Shipment not found' }, { status: 404 });
    }

    const { data: updatedShipment, error: updateErr } = await supabaseAdmin
      .from('shipments')
      .update({
        status: 'OUT_FOR_DELIVERY',
        updated_at: nowIso,
      })
      .eq('id', shipment.id)
      .select()
      .maybeSingle();

    if (updateErr) {
      return NextResponse.json({ success: false, error: updateErr.message }, { status: 500 });
    }

    if (shipment.order_id) {
      await supabaseAdmin
        .from('transport_requests')
        .update({
          status: 'IN_TRANSIT',
          updated_at: nowIso,
        })
        .eq('order_id', shipment.order_id);
    }

    return NextResponse.json({
      success: true,
      message: 'गंतव्य पर पहुंच दर्ज (Arrived at Destination)',
      shipment: updatedShipment,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
