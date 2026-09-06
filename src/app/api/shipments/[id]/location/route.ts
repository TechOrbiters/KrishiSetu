import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, errorResponse } = await authenticateRequest(req);
  if (errorResponse) return errorResponse;

  try {
    const shipmentId = params.id;
    if (!shipmentId) {
      return NextResponse.json({ success: false, error: 'Shipment ID is required' }, { status: 400 });
    }

    const body = await req.json();
    const { latitude, longitude, heading, speed_kmh } = body;

    const lat = Number(latitude);
    const lng = Number(longitude);

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return NextResponse.json({ success: false, error: 'Valid latitude and longitude are required' }, { status: 400 });
    }

    const { data: shipment, error: fetchErr } = await supabaseAdmin
      .from('shipments')
      .select('*')
      .eq('id', shipmentId)
      .maybeSingle();

    if (fetchErr || !shipment) {
      return NextResponse.json({ success: false, error: 'Shipment not found' }, { status: 404 });
    }

    const nowMs = Date.now();
    const telemetry = {
      latitude: lat,
      longitude: lng,
      heading: Number(heading || 0),
      speed_kmh: Number(speed_kmh || 0),
      updated_at: nowMs,
    };

    // Update transporter_profiles location if transporter assigned
    if (shipment.transporter_id) {
      await supabaseAdmin
        .from('transporter_profiles')
        .update({
          latitude: lat,
          longitude: lng,
          updated_at: new Date(nowMs).toISOString(),
        })
        .or(`user_id.eq.${shipment.transporter_id},id.eq.${shipment.transporter_id}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Shipment location telemetry updated successfully',
      telemetry,
      isStale: false,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
