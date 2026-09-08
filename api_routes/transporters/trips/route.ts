import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * GET /api/transporters/trips
 * Fetches trips assigned to the logged-in transporter.
 * Query param: status = 'all' | 'active' | 'completed' | 'cancelled'
 */
export async function GET(req: NextRequest) {
  const { user, errorResponse } = await authenticateRequest(req, ['TRANSPORTER', 'ADMIN']);
  if (errorResponse) return errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('status') || 'all';

    // 1. Resolve DB Transporter ID
    const { data: dbUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('firebase_uid', user!.uid)
      .maybeSingle();

    const transporterId = dbUser?.id || user!.uid;

    // 2. Query transport_requests where transporter_id = transporterId
    let query = supabaseAdmin
      .from('transport_requests')
      .select('*, orders(*, produce_listings(*), users!orders_buyer_id_fkey(full_name, phone))')
      .eq('transporter_id', transporterId)
      .order('updated_at', { ascending: false });

    const { data: requests, error: reqErr } = await query;
    if (reqErr) {
      return NextResponse.json({ success: false, error: reqErr.message }, { status: 500 });
    }

    // 3. Query shipments corresponding to these orders
    const orderIds = (requests || []).map((r) => r.order_id).filter(Boolean);
    let shipmentsMap: Record<string, any> = {};
    if (orderIds.length > 0) {
      const { data: shps } = await supabaseAdmin
        .from('shipments')
        .select('*')
        .in('order_id', orderIds);

      (shps || []).forEach((s) => {
        shipmentsMap[s.order_id] = s;
      });
    }

    // 4. Transform into structured TransporterTrip objects with complete timeline
    const trips = (requests || []).map((r: any) => {
      const order = r.orders || {};
      const listing = order.produce_listings || {};
      const shipment = shipmentsMap[r.order_id] || {};

      // Determine comprehensive workflow state
      let tripStatus = r.status;
      if (shipment.status === 'DELIVERED' || r.status === 'DELIVERED') {
        tripStatus = 'DELIVERED';
      } else if (shipment.status === 'OUT_FOR_DELIVERY') {
        tripStatus = 'NEAR_DESTINATION';
      } else if (shipment.status === 'PICKED_UP' || r.status === 'IN_TRANSIT') {
        tripStatus = 'IN_TRANSIT';
      } else if (r.status === 'ACCEPTED') {
        tripStatus = 'ACCEPTED';
      }

      // Build 6-stage lifecycle timeline
      const timeline = [
        {
          step: 'ACCEPTED',
          label: 'ट्रिप स्वीकृत (Job Accepted)',
          timestamp: r.created_at,
          completed: ['ACCEPTED', 'HEADING_TO_PICKUP', 'ARRIVED_AT_PICKUP', 'PICKED_UP', 'IN_TRANSIT', 'NEAR_DESTINATION', 'ARRIVED_AT_DESTINATION', 'DELIVERED'].includes(tripStatus),
          current: tripStatus === 'ACCEPTED',
        },
        {
          step: 'ARRIVED_AT_PICKUP',
          label: 'पिक-अप स्थान पहुंचे (Arrived at Farm/Mandi)',
          timestamp: shipment.pickup_arrived_at,
          completed: ['ARRIVED_AT_PICKUP', 'PICKED_UP', 'IN_TRANSIT', 'NEAR_DESTINATION', 'ARRIVED_AT_DESTINATION', 'DELIVERED'].includes(tripStatus),
          current: tripStatus === 'ARRIVED_AT_PICKUP',
        },
        {
          step: 'PICKED_UP',
          label: 'उपज लोड की गई (Cargo Loaded & Confirmed)',
          timestamp: shipment.picked_up_at,
          completed: ['PICKED_UP', 'IN_TRANSIT', 'NEAR_DESTINATION', 'ARRIVED_AT_DESTINATION', 'DELIVERED'].includes(tripStatus),
          current: tripStatus === 'PICKED_UP',
        },
        {
          step: 'IN_TRANSIT',
          label: 'रास्ते में (In Transit - Live Route)',
          timestamp: shipment.in_transit_at,
          completed: ['IN_TRANSIT', 'NEAR_DESTINATION', 'ARRIVED_AT_DESTINATION', 'DELIVERED'].includes(tripStatus),
          current: tripStatus === 'IN_TRANSIT',
        },
        {
          step: 'ARRIVED_AT_DESTINATION',
          label: 'गंतव्य पहुंचे (Arrived at Buyer)',
          timestamp: shipment.arrived_dest_at,
          completed: ['ARRIVED_AT_DESTINATION', 'DELIVERED'].includes(tripStatus),
          current: tripStatus === 'ARRIVED_AT_DESTINATION',
        },
        {
          step: 'DELIVERED',
          label: 'डिलीवरी पूर्ण & भुगतान जारी (Delivered)',
          timestamp: shipment.actual_arrival || shipment.updated_at,
          completed: tripStatus === 'DELIVERED',
          current: tripStatus === 'DELIVERED',
        },
      ];

      return {
        id: r.id,
        shipment_id: shipment.id || null,
        order_id: r.order_id,
        order_number: order.order_number || `ORD-${r.id.slice(-6).toUpperCase()}`,
        crop_name: listing.crop_name || order.crop_name || 'उपज लॉट',
        weight_kg: Number(order.quantity || 250),
        fare_amount: Number(r.fare_amount || order.delivery_fee || 500),
        distance_km: Number(r.distance_km || 15),
        status: tripStatus,
        pickup_address: shipment.pickup_address || listing.location_name || 'फार्म / मंडी',
        delivery_address: shipment.delivery_address || order.delivery_address || 'खरीदार गंतव्य',
        pickup_lat: Number(shipment.pickup_lat || listing.latitude || 26.8467),
        pickup_lng: Number(shipment.pickup_lng || listing.longitude || 80.9462),
        delivery_lat: Number(shipment.delivery_lat || order.delivery_lat || 26.9200),
        delivery_lng: Number(shipment.delivery_lng || order.delivery_lng || 81.1800),
        farmer_name: listing.farmer_name || 'किसान साथी',
        farmer_phone: listing.farmer_phone || '+91 98765 43210',
        buyer_name: order.users?.full_name || 'खरीदार',
        buyer_phone: order.users?.phone || '+91 98123 45678',
        created_at: r.created_at,
        updated_at: r.updated_at,
        timeline,
      };
    });

    // 5. Apply tab filters
    let filteredTrips = trips;
    if (filter === 'active') {
      filteredTrips = trips.filter((t) =>
        ['ACCEPTED', 'HEADING_TO_PICKUP', 'ARRIVED_AT_PICKUP', 'PICKED_UP', 'IN_TRANSIT', 'NEAR_DESTINATION', 'ARRIVED_AT_DESTINATION'].includes(t.status)
      );
    } else if (filter === 'completed') {
      filteredTrips = trips.filter((t) => t.status === 'DELIVERED');
    } else if (filter === 'cancelled') {
      filteredTrips = trips.filter((t) => t.status === 'CANCELLED' || t.status === 'REJECTED');
    }

    return NextResponse.json({
      success: true,
      trips: filteredTrips,
      counts: {
        all: trips.length,
        active: trips.filter((t) => !['DELIVERED', 'CANCELLED', 'REJECTED'].includes(t.status)).length,
        completed: trips.filter((t) => t.status === 'DELIVERED').length,
        cancelled: trips.filter((t) => ['CANCELLED', 'REJECTED'].includes(t.status)).length,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
