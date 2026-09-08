import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * POST /api/shipments/[id]/pickup
 * Marks shipment as arrived at pickup, or confirms pickup and advances state to PICKED_UP.
 * Updates transport_request and associated order.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, errorResponse } = await authenticateRequest(req, ['TRANSPORTER', 'ADMIN']);
  if (errorResponse) return errorResponse;

  try {
    const shipmentId = params.id;
    const body = await req.json().catch(() => ({}));
    const action = body.action || 'CONFIRM_PICKUP'; // 'ARRIVED' or 'CONFIRM_PICKUP'

    const { data: dbUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('firebase_uid', user!.uid)
      .maybeSingle();

    const transporterId = dbUser?.id || user!.uid;

    // Fetch shipment
    const { data: shipment, error: fetchErr } = await supabaseAdmin
      .from('shipments')
      .select('*')
      .or(`id.eq.${shipmentId},order_id.eq.${shipmentId}`)
      .maybeSingle();

    if (fetchErr || !shipment) {
      return NextResponse.json({ success: false, error: 'Shipment not found' }, { status: 404 });
    }

    const nowIso = new Date().toISOString();
    const newStatus = action === 'ARRIVED' ? 'PICKUP_PENDING' : 'PICKED_UP';

    const { data: updatedShipment, error: updateErr } = await supabaseAdmin
      .from('shipments')
      .update({
        status: newStatus === 'PICKED_UP' ? 'PICKED_UP' : 'SCHEDULED',
        updated_at: nowIso,
      })
      .eq('id', shipment.id)
      .select()
      .maybeSingle();

    if (updateErr) {
      return NextResponse.json({ success: false, error: updateErr.message }, { status: 500 });
    }

    // Update transport_request status
    if (shipment.order_id) {
      await supabaseAdmin
        .from('transport_requests')
        .update({
          status: newStatus === 'PICKED_UP' ? 'PICKED_UP' : 'ACCEPTED',
          updated_at: nowIso,
        })
        .eq('order_id', shipment.order_id);

      if (newStatus === 'PICKED_UP') {
        await supabaseAdmin
          .from('orders')
          .update({
            status: 'IN_TRANSIT',
            updated_at: nowIso,
          })
          .eq('id', shipment.order_id);
      }
    }

    return NextResponse.json({
      success: true,
      message: action === 'ARRIVED' ? 'पिक-अप स्थान पर पहुंच दर्ज (Arrived at Pickup)' : 'लोड उठा लिया गया (Pickup Confirmed)',
      shipment: updatedShipment,
      nextState: newStatus === 'PICKED_UP' ? 'IN_TRANSIT' : 'PICKED_UP',
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
