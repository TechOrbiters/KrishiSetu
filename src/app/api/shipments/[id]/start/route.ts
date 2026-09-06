import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * POST /api/shipments/[id]/start
 * Marks shipment as IN_TRANSIT / OUT_FOR_DELIVERY.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, errorResponse } = await authenticateRequest(req, ['TRANSPORTER', 'ADMIN']);
  if (errorResponse) return errorResponse;

  try {
    const shipmentId = params.id;
    const nowIso = new Date().toISOString();

    const { data: shipment, error: fetchErr } = await supabaseAdmin
      .from('shipments')
      .select('*')
      .or(`id.eq.${shipmentId},order_id.eq.${shipmentId}`)
      .maybeSingle();

    if (fetchErr || !shipment) {
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

      await supabaseAdmin
        .from('orders')
        .update({
          status: 'IN_TRANSIT',
          updated_at: nowIso,
        })
        .eq('id', shipment.order_id);
    }

    return NextResponse.json({
      success: true,
      message: 'ट्रिप शुरू: रास्ते में (Trip started - In Transit)',
      shipment: updatedShipment,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
