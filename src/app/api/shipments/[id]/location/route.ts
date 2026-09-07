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

    const body = await req.json().catch(() => ({}));
    const rawLat = body.latitude ?? body.lat;
    const rawLng = body.longitude ?? body.lng;
    const rawSpeed = body.speed_kmh ?? body.speed ?? body.speedKmh ?? 0;
    const rawHeading = body.heading ?? 0;

    const lat = Number(rawLat);
    const lng = Number(rawLng);

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return NextResponse.json({ success: false, error: 'Valid latitude and longitude are required' }, { status: 400 });
    }

    // Lookup shipment by ID, order_id, or transport_requests fallback
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

    const nowIso = new Date().toISOString();
    const nowMs = Date.now();
    const telemetry = {
      latitude: lat,
      longitude: lng,
      heading: Number(rawHeading),
      speed_kmh: Number(rawSpeed),
      updated_at: nowMs,
    };

    // 1. Update shipments record with live telemetry
    await supabaseAdmin
      .from('shipments')
      .update({
        current_lat: lat,
        current_lng: lng,
        speed_kmh: Number(rawSpeed),
        last_location_update: nowIso,
        updated_at: nowIso,
      })
      .eq('id', shipment.id);

    // 2. Update transporter_profiles location if transporter assigned
    if (shipment.transporter_id) {
      await supabaseAdmin
        .from('transporter_profiles')
        .update({
          latitude: lat,
          longitude: lng,
          updated_at: nowIso,
        })
        .or(`user_id.eq.${shipment.transporter_id},id.eq.${shipment.transporter_id}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Shipment location telemetry updated successfully',
      shipmentId: shipment.id,
      orderId: shipment.order_id,
      telemetry,
      isStale: false,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
