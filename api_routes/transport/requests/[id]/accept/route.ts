import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, errorResponse } = await authenticateRequest(req, ['TRANSPORTER', 'FARMER_FPO', 'FARMER', 'BUYER', 'FPO_ADMIN']);
  if (errorResponse) return errorResponse;

  try {
    const requestId = params.id;
    if (!requestId) {
      return NextResponse.json({ success: false, error: 'Transport request ID is required' }, { status: 400 });
    }

    let body: any = {};
    try {
      body = await req.json();
    } catch (e) {
      body = {};
    }

    // 1. Fetch transport request & order details
    const { data: transportReq, error: fetchErr } = await supabaseAdmin
      .from('transport_requests')
      .select('*')
      .eq('id', requestId)
      .maybeSingle();

    if (fetchErr || !transportReq) {
      return NextResponse.json({ success: false, error: 'Transport request not found' }, { status: 404 });
    }

    let orderData: any = null;
    if (transportReq.order_id) {
      const { data: ord } = await supabaseAdmin
        .from('orders')
        .select('*')
        .eq('id', transportReq.order_id)
        .maybeSingle();
      orderData = ord;
    }

    // Check if request is already claimed/accepted
    if (transportReq.status !== 'REQUESTED' && transportReq.status !== 'BROADCAST') {
      return NextResponse.json({
        success: false,
        error: `Transport request has already been ${transportReq.status.toLowerCase()} and is no longer available`,
      }, { status: 409 });
    }

    // 2. Resolve transporter identity & vehicle capacity
    const isUuid = (val: any) => typeof val === 'string' && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(val);

    let transporterId = isUuid(body.transporter_id) ? body.transporter_id : null;

    if (!transporterId) {
      const { data: dbUserData } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('firebase_uid', user!.uid)
        .maybeSingle();

      if (dbUserData?.id && isUuid(dbUserData.id)) {
        transporterId = dbUserData.id;
      } else {
        transporterId = '00000000-0000-4000-f000-000000000001';
      }
    }

    let transporterCapacityKg = Number(body.vehicle_capacity_kg || 0);

    // Check transporter_profiles for capacity if not provided in body
    if (!transporterCapacityKg || transporterCapacityKg <= 0) {
      const { data: profile } = await supabaseAdmin
        .from('transporter_profiles')
        .select('capacity_kg')
        .or(`user_id.eq.${user!.uid},user_id.eq.${transporterId}`)
        .maybeSingle();

      if (profile && profile.capacity_kg) {
        transporterCapacityKg = Number(profile.capacity_kg);
      } else {
        // Default capacity assumption if no profile found (e.g. 1000kg Mini Truck)
        transporterCapacityKg = 1000;
      }
    }

    // 3. Enforce Vehicle Capacity Rule
    const orderQuantityKg = Number(orderData?.quantity || transportReq.orders?.quantity || body.quantity_kg || 0);

    if (orderQuantityKg > 0 && transporterCapacityKg < orderQuantityKg) {
      return NextResponse.json({
        success: false,
        error: `Vehicle capacity (${transporterCapacityKg} kg) is insufficient for required shipment weight (${orderQuantityKg} kg)`,
      }, { status: 400 });
    }

    // 4. Enforce FreshRoute Transport Eligibility
    let listingData: any = null;
    if (orderData?.listing_id) {
      const { data: lst } = await supabaseAdmin
        .from('produce_listings')
        .select('*')
        .eq('id', orderData.listing_id)
        .maybeSingle();
      listingData = lst;
    }

    const { calculateRoute } = await import('@/lib/maps/routing');
    const { evaluateFreshRoute } = await import('@/lib/domain/freshroute');

    const pickupLat = Number(listingData?.latitude || 26.8467);
    const pickupLng = Number(listingData?.longitude || 80.9462);
    const deliveryLat = Number(orderData?.delivery_lat || 26.9200);
    const deliveryLng = Number(orderData?.delivery_lng || 81.1800);

    const routeInfo = await calculateRoute({ lat: pickupLat, lng: pickupLng }, { lat: deliveryLat, lng: deliveryLng });

    const harvestDate = listingData?.harvest_date || body.harvest_date || new Date().toISOString();
    const shelfLifeDays = Number(listingData?.shelf_life_days || body.shelf_life_days || 7);

    const freshRoute = evaluateFreshRoute({
      harvestTimeIso: harvestDate,
      freshnessDurationHours: shelfLifeDays * 24,
      routeDurationMinutes: routeInfo.durationMinutes,
    });

    if (!freshRoute.isEligible || freshRoute.status === 'INELIGIBLE') {
      return NextResponse.json({
        success: false,
        error: `Crop freshness will expire before estimated delivery time (INELIGIBLE). Transport request cannot be accepted. Reason: ${freshRoute.reason}`,
        freshRoute,
      }, { status: 400 });
    }

    // 5. Atomic Assignment & Double-Claim Prevention using RPC or atomic UPDATE
    let assignmentSuccess = false;

    // First try RPC for database row locking (FOR UPDATE)
    const { data: rpcSuccess, error: rpcErr } = await supabaseAdmin.rpc('accept_transport_request', {
      p_request_id: requestId,
      p_transporter_id: transporterId,
    });

    if (!rpcErr && rpcSuccess === true) {
      assignmentSuccess = true;
    } else {
      // Fallback atomic UPDATE with strict status condition
      const { data: updatedReqs, error: updateErr } = await supabaseAdmin
        .from('transport_requests')
        .update({
          transporter_id: transporterId,
          status: 'ACCEPTED',
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId)
        .eq('status', 'REQUESTED')
        .select();

      if (!updateErr && updatedReqs && updatedReqs.length > 0) {
        assignmentSuccess = true;
      }
    }

    if (!assignmentSuccess) {
      return NextResponse.json({
        success: false,
        error: 'Transport request has already been accepted by another driver or is no longer available',
      }, { status: 409 });
    }

    // 6. Update associated order status to IN_TRANSIT & create Shipment record
    const nowIso = new Date().toISOString();
    const estimatedArrivalIso = freshRoute.estimatedArrivalIso || new Date(Date.now() + (routeInfo.durationMinutes || 60) * 60000).toISOString();

    let createdShipment: any = null;
    if (transportReq.order_id) {
      await supabaseAdmin
        .from('orders')
        .update({
          status: 'IN_TRANSIT',
          updated_at: nowIso,
        })
        .eq('id', transportReq.order_id);

      const { data: existingShp } = await supabaseAdmin
        .from('shipments')
        .select('*')
        .eq('order_id', transportReq.order_id)
        .maybeSingle();

      const shipmentPayload = {
        order_id: transportReq.order_id,
        transporter_id: transporterId,
        status: 'SCHEDULED',
        pickup_address: listingData?.location_name || 'Lucknow Mandi',
        delivery_address: orderData?.delivery_address || 'Barabanki Mandi',
        pickup_lat: pickupLat,
        pickup_lng: pickupLng,
        delivery_lat: deliveryLat,
        delivery_lng: deliveryLng,
        updated_at: nowIso,
      };

      if (existingShp) {
        const { data: shp, error: shpErr } = await supabaseAdmin
          .from('shipments')
          .update(shipmentPayload)
          .eq('id', existingShp.id)
          .select()
          .maybeSingle();
        console.log('[SHIPMENT_DEBUG] update result:', shp, 'error:', shpErr?.message);
        createdShipment = shp;
      } else {
        const { data: shp, error: shpErr } = await supabaseAdmin
          .from('shipments')
          .insert(shipmentPayload)
          .select()
          .maybeSingle();
        console.log('[SHIPMENT_DEBUG] insert result:', shp, 'error:', shpErr?.message);
        createdShipment = shp;
      }
    }

    // Return updated transport request & shipment
    const { data: finalReq } = await supabaseAdmin
      .from('transport_requests')
      .select('*')
      .eq('id', requestId)
      .maybeSingle();

    return NextResponse.json({
      success: true,
      message: 'Transport request accepted successfully',
      request: finalReq || { ...transportReq, status: 'ACCEPTED', transporter_id: transporterId },
      shipment: createdShipment,
      freshRoute,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
