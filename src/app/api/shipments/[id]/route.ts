import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';
import { calculateRoute } from '@/lib/maps/routing';
import { evaluateFreshRoute } from '@/lib/domain/freshroute';

export async function GET(
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

    // 1. Fetch shipment details (check by shipment id OR order id)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(shipmentId);
    let shipment: any = null;

    if (isUuid) {
      const { data: s } = await supabaseAdmin
        .from('shipments')
        .select('*')
        .or(`id.eq.${shipmentId},order_id.eq.${shipmentId}`)
        .maybeSingle();
      shipment = s;
    }

    // 2. Fetch associated order & listing
    let order: any = null;
    let listing: any = null;
    let transporter: any = null;

    if (shipment?.order_id) {
      const { data: ord } = await supabaseAdmin
        .from('orders')
        .select('*, produce_listings(*)')
        .eq('id', shipment.order_id)
        .maybeSingle();
      order = ord;
      if (ord?.produce_listings) {
        listing = ord.produce_listings;
      }
    } else if (isUuid) {
      const { data: ord } = await supabaseAdmin
        .from('orders')
        .select('*, produce_listings(*)')
        .eq('id', shipmentId)
        .maybeSingle();
      if (ord) {
        order = ord;
        listing = ord.produce_listings;
        shipment = {
          id: 'shp_' + ord.id,
          order_id: ord.id,
          status: ord.status === 'DELIVERED' ? 'DELIVERED' : ord.status === 'IN_TRANSIT' ? 'OUT_FOR_DELIVERY' : 'SCHEDULED',
          pickup_address: listing?.location_name || 'फार्म / मंडी',
          delivery_address: ord.delivery_address || 'खरीदार गंतव्य',
          pickup_lat: Number(listing?.latitude || 26.8467),
          pickup_lng: Number(listing?.longitude || 80.9462),
          delivery_lat: Number(ord.delivery_lat || 26.9200),
          delivery_lng: Number(ord.delivery_lng || 81.1800),
        };
      }
    }

    if (!shipment) {
      return NextResponse.json({ success: false, error: 'Shipment not found' }, { status: 404 });
    }

    if (shipment.transporter_id) {
      const { data: tp } = await supabaseAdmin
        .from('transporter_profiles')
        .select('*')
        .or(`user_id.eq.${shipment.transporter_id},id.eq.${shipment.transporter_id}`)
        .maybeSingle();
      transporter = tp;
    }

    // 3. Authorization Check
    const { data: dbCaller } = await supabaseAdmin
      .from('users')
      .select('id, role, firebase_uid')
      .eq('firebase_uid', user!.uid)
      .maybeSingle();

    const callerId = dbCaller?.id;
    const isFarmerOwner = (listing?.farmer_id && (listing.farmer_id === callerId || listing.farmer_id === user!.uid)) ||
                          (order?.farmer_id && (order.farmer_id === callerId || order.farmer_id === user!.uid));
    const isBuyerOwner = order?.buyer_id && (order.buyer_id === callerId || order.buyer_id === user!.uid);
    const isAssignedTransporter = shipment.transporter_id && (shipment.transporter_id === callerId || shipment.transporter_id === user!.uid);
    const isAdmin = dbCaller?.role === 'FPO_ADMIN' || user!.role === 'FPO_ADMIN' || dbCaller?.role === 'ADMIN' || user!.role === 'ADMIN';
    const isTransporterRole = user!.role === 'TRANSPORTER' || dbCaller?.role === 'TRANSPORTER';

    if (!isFarmerOwner && !isBuyerOwner && !isAssignedTransporter && !isAdmin && !isTransporterRole) {
      return NextResponse.json({
        success: false,
        error: 'Forbidden: Unauthorized access to shipment tracking details',
      }, { status: 403 });
    }

    // 4. Compute OSRM Route
    const pickupLat = Number(shipment.pickup_lat || listing?.latitude || 26.8467);
    const pickupLng = Number(shipment.pickup_lng || listing?.longitude || 80.9462);
    const deliveryLat = Number(shipment.delivery_lat || 26.9200);
    const deliveryLng = Number(shipment.delivery_lng || 81.1800);

    const routeInfo = await calculateRoute(
      { lat: pickupLat, lng: pickupLng },
      { lat: deliveryLat, lng: deliveryLng }
    );

    // 5. Evaluate FreshRoute
    const harvestTimeIso = listing?.harvest_date || new Date().toISOString();
    const shelfLifeDays = Number(listing?.shelf_life_days || 7);
    const freshRoute = evaluateFreshRoute({
      harvestTimeIso,
      freshnessDurationHours: shelfLifeDays * 24,
      routeDurationMinutes: routeInfo.durationMinutes,
    });

    // 6. Live Telemetry & Stale Location Check (5 mins threshold = 300,000 ms)
    const telemetry = {
      latitude: Number(transporter?.latitude || pickupLat + 0.05),
      longitude: Number(transporter?.longitude || pickupLng + 0.05),
      updated_at: transporter?.updated_at ? new Date(transporter.updated_at).getTime() : Date.now() - 10 * 60 * 1000,
    };

    const isStale = Date.now() - telemetry.updated_at > 5 * 60 * 1000;

    return NextResponse.json({
      success: true,
      shipment,
      order,
      listing,
      transporter,
      route: routeInfo,
      freshRoute,
      telemetry,
      isStale,
      staleWarning: isStale ? 'लोकेशन ट्रैकिंग पुरानी है (Last updated > 5 mins ago)' : null,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(
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
    const { status } = body;

    const validStatuses = ['SCHEDULED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED', 'CANCELLED'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      }, { status: 400 });
    }

    const updates: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    const { data: updatedShipment, error: updateErr } = await supabaseAdmin
      .from('shipments')
      .update(updates)
      .eq('id', shipmentId)
      .select()
      .maybeSingle();

    if (updateErr || !updatedShipment) {
      return NextResponse.json({ success: false, error: updateErr?.message || 'Shipment update failed' }, { status: 500 });
    }

    // If DELIVERED, update associated order status
    if (status === 'DELIVERED' && updatedShipment.order_id) {
      await supabaseAdmin
        .from('orders')
        .update({
          status: 'DELIVERED',
          updated_at: new Date().toISOString(),
        })
        .eq('id', updatedShipment.order_id);
    }

    return NextResponse.json({
      success: true,
      message: `Shipment status updated to ${status}`,
      shipment: updatedShipment,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
