import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';
import { calculateRoute } from '@/lib/maps/routing';
import { evaluateFreshRoute } from '@/lib/domain/freshroute';

export async function GET(req: NextRequest) {
  const { user, errorResponse } = await authenticateRequest(req);
  if (errorResponse) return errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const orderId = searchParams.get('order_id');
    const transporterId = searchParams.get('transporter_id');

    let query = supabaseAdmin
      .from('shipments')
      .select('*, orders(*, produce_listings(*)), transporter_profiles(*)')
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);
    if (orderId) query = query.eq('order_id', orderId);
    if (transporterId) query = query.eq('transporter_id', transporterId);

    const { data: shipments, error } = await query;

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      shipments: shipments || [],
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { user, errorResponse } = await authenticateRequest(req, ['FARMER', 'FARMER_FPO', 'BUYER', 'TRANSPORTER', 'FPO_ADMIN']);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const {
      order_id,
      transporter_id,
      pickup_address,
      delivery_address,
      pickup_lat,
      pickup_lng,
      delivery_lat,
      delivery_lng,
    } = body;

    if (!order_id) {
      return NextResponse.json({ success: false, error: 'order_id is required' }, { status: 400 });
    }

    // Verify order exists
    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .select('*, produce_listings(*)')
      .eq('id', order_id)
      .maybeSingle();

    if (orderErr || !order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    const pLat = Number(pickup_lat || order.produce_listings?.latitude || 26.8467);
    const pLng = Number(pickup_lng || order.produce_listings?.longitude || 80.9462);
    const dLat = Number(delivery_lat || 26.9200);
    const dLng = Number(delivery_lng || 81.1800);

    // Calculate OSRM route & FreshRoute evaluation
    const routeInfo = await calculateRoute({ lat: pLat, lng: pLng }, { lat: dLat, lng: dLng });

    const harvestDate = order.produce_listings?.harvest_date || new Date().toISOString();
    const shelfLifeDays = Number(order.produce_listings?.shelf_life_days || 7);
    const freshRoute = evaluateFreshRoute({
      harvestTimeIso: harvestDate,
      freshnessDurationHours: shelfLifeDays * 24,
      routeDurationMinutes: routeInfo.durationMinutes,
    });

    if (!freshRoute.isEligible || freshRoute.status === 'INELIGIBLE') {
      return NextResponse.json({
        success: false,
        error: `Crop freshness will expire before estimated delivery time (INELIGIBLE). Transport route cannot be assigned. Reason: ${freshRoute.reason}`,
        freshRoute,
      }, { status: 400 });
    }

    const estimatedArrival = freshRoute.estimatedArrivalIso || new Date(Date.now() + (routeInfo.durationMinutes || 60) * 60000).toISOString();

    const { data: existingShp } = await supabaseAdmin
      .from('shipments')
      .select('*')
      .eq('order_id', order_id)
      .maybeSingle();

    const shipmentPayload = {
      order_id,
      transporter_id: transporter_id || null,
      status: 'SCHEDULED',
      pickup_address: pickup_address || order.produce_listings?.location_name || 'Lucknow Mandi',
      delivery_address: delivery_address || 'Barabanki Mandi',
      pickup_lat: pLat,
      pickup_lng: pLng,
      delivery_lat: dLat,
      delivery_lng: dLng,
      updated_at: new Date().toISOString(),
    };

    let shipment: any = null;
    let insertErr: any = null;

    if (existingShp) {
      const res = await supabaseAdmin
        .from('shipments')
        .update(shipmentPayload)
        .eq('id', existingShp.id)
        .select()
        .maybeSingle();
      shipment = res.data;
      insertErr = res.error;
    } else {
      const res = await supabaseAdmin
        .from('shipments')
        .insert(shipmentPayload)
        .select()
        .maybeSingle();
      shipment = res.data;
      insertErr = res.error;
    }

    if (insertErr) {
      return NextResponse.json({ success: false, error: insertErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      shipment,
      route: routeInfo,
      freshRoute,
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
