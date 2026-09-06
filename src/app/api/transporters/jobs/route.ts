import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';
import { calculateRoute } from '@/lib/maps/routing';
import { evaluateFreshRoute } from '@/lib/domain/freshroute';

/**
 * GET /api/transporters/jobs
 * Discovers available transport requests with server-side SmartMatch scoring:
 * - Distance Weight: 30%
 * - Capacity Weight: 25%
 * - Fare Weight: 20%
 * - Availability Weight: 15%
 * - Rating Weight: 10%
 * Supports filter/sort params: sort='best_match' | 'nearest' | 'highest_fare' | 'urgent'
 */
export async function GET(req: NextRequest) {
  const { user, errorResponse } = await authenticateRequest(req, ['TRANSPORTER', 'ADMIN']);
  if (errorResponse) return errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const sortBy = searchParams.get('sort') || 'best_match';

    // 1. Resolve Transporter Profile (location & vehicle capacity)
    const { data: dbUser } = await supabaseAdmin
      .from('users')
      .select('id, latitude, longitude')
      .eq('firebase_uid', user!.uid)
      .maybeSingle();

    const userId = dbUser?.id || user!.uid;

    const { data: profile } = await supabaseAdmin
      .from('transporter_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    const driverLat = Number(profile?.latitude || dbUser?.latitude || 26.8467);
    const driverLng = Number(profile?.longitude || dbUser?.longitude || 80.9462);
    const driverCapacityKg = Number(profile?.capacity_kg || 1000);
    const driverRating = Number(profile?.rating || 4.8);
    const isDriverOnline = profile?.availability !== false;

    // 2. Fetch all OPEN transport requests (status = 'REQUESTED' or 'BROADCAST')
    const { data: requests, error: fetchErr } = await supabaseAdmin
      .from('transport_requests')
      .select('*, orders(*, produce_listings(*), users!orders_buyer_id_fkey(full_name, phone))')
      .in('status', ['REQUESTED', 'BROADCAST'])
      .order('created_at', { ascending: false });

    if (fetchErr) {
      return NextResponse.json({ success: false, error: fetchErr.message }, { status: 500 });
    }

    const rawRequests = requests || [];

    // 3. Process & score each request using the 5-component SmartMatch formula
    const scoredJobs = await Promise.all(
      rawRequests.map(async (reqItem: any) => {
        const order = reqItem.orders || {};
        const listing = order.produce_listings || {};

        const pickupLat = Number(listing.latitude || 26.8467);
        const pickupLng = Number(listing.longitude || 80.9462);
        const deliveryLat = Number(order.delivery_lat || 26.9200);
        const deliveryLng = Number(order.delivery_lng || 81.1800);

        // Compute route distance & duration
        const route = await calculateRoute(
          { lat: pickupLat, lng: pickupLng },
          { lat: deliveryLat, lng: deliveryLng }
        );

        // FreshRoute evaluation
        const harvestDate = listing.harvest_date || new Date().toISOString();
        const shelfLifeDays = Number(listing.shelf_life_days || 7);
        const freshRoute = evaluateFreshRoute({
          harvestTimeIso: harvestDate,
          freshnessDurationHours: shelfLifeDays * 24,
          routeDurationMinutes: route.durationMinutes,
        });

        // ----------------------------------------------------
        // SmartMatch Scoring:
        // Distance (30%), Capacity (25%), Fare (20%), Availability (15%), Rating (10%)
        // ----------------------------------------------------
        const distanceToPickupKm = Math.sqrt(
          Math.pow((pickupLat - driverLat) * 111, 2) +
          Math.pow((pickupLng - driverLng) * 111 * Math.cos(driverLat * Math.PI / 180), 2)
        );

        // Component 1: Distance (Max 30 pts) - closer is higher
        const distanceScore = Math.max(0, Math.min(30, 30 - (distanceToPickupKm / 50) * 30));

        // Component 2: Capacity Fit (Max 25 pts) - how well vehicle capacity fits the cargo weight
        const cargoWeightKg = Number(order.quantity || 250);
        let capacityScore = 0;
        if (driverCapacityKg >= cargoWeightKg) {
          const ratio = cargoWeightKg / driverCapacityKg;
          // ideal capacity utilization is 50% - 95%
          capacityScore = ratio >= 0.5 ? 25 : Math.max(10, Math.round(25 * (ratio / 0.5)));
        } else {
          capacityScore = 0; // cannot fit!
        }

        // Component 3: Fare / Value (Max 20 pts)
        const fare = Number(reqItem.fare_amount || order.delivery_fee || 500);
        const farePerKm = route.distanceKm > 0 ? fare / route.distanceKm : 20;
        const fareScore = Math.min(20, Math.max(5, Math.round((farePerKm / 40) * 20)));

        // Component 4: Availability (Max 15 pts)
        const availabilityScore = isDriverOnline ? 15 : 0;

        // Component 5: Rating (Max 10 pts)
        const ratingScore = Math.round((driverRating / 5.0) * 10);

        const totalScore = Math.min(99, Math.max(45, Math.round(
          distanceScore + capacityScore + fareScore + availabilityScore + ratingScore
        )));

        // Match Reasons
        const reasons: string[] = [];
        if (distanceToPickupKm < 15) reasons.push(`पिक-अप मात्र ${Math.round(distanceToPickupKm)} किमी दूर (Nearby)`);
        if (driverCapacityKg >= cargoWeightKg) reasons.push(`क्षमता अनुकूल (${cargoWeightKg}kg / ${driverCapacityKg}kg)`);
        if (fare >= 800) reasons.push(`आकर्षक भाड़ा (₹${fare})`);
        if (freshRoute.status === 'SAFE') reasons.push('फसल फ्रेशनेस विंडो सुरक्षित');
        if (driverRating >= 4.7) reasons.push(`उच्च रेटिंग ड्राइवर (${driverRating}★)`);

        return {
          id: reqItem.id,
          order_id: reqItem.order_id,
          order_number: order.order_number || `ORD-${reqItem.id.slice(-6).toUpperCase()}`,
          crop_name: listing.crop_name || order.crop_name || 'ताज़ा उपज',
          category: listing.category || 'सब्जियां',
          weight_kg: cargoWeightKg,
          pickup_address: listing.location_name || 'फार्म / मंडी',
          delivery_address: order.delivery_address || 'खरीदार गंतव्य',
          pickup_lat: pickupLat,
          pickup_lng: pickupLng,
          delivery_lat: deliveryLat,
          delivery_lng: deliveryLng,
          distance_km: route.distanceKm || Math.round(reqItem.distance_km || 15),
          estimated_duration_mins: route.durationMinutes || 45,
          fare_amount: fare,
          match_score: totalScore,
          match_reasons: reasons,
          freshroute_status: freshRoute.status,
          deadline_hours: 6,
          created_at: reqItem.created_at,
          farmer_name: listing.farmer_name || 'किसान साथी',
          buyer_name: order.users?.full_name || 'खरीदार',
        };
      })
    );

    // 4. Sort results
    if (sortBy === 'nearest') {
      scoredJobs.sort((a, b) => a.distance_km - b.distance_km);
    } else if (sortBy === 'highest_fare') {
      scoredJobs.sort((a, b) => b.fare_amount - a.fare_amount);
    } else if (sortBy === 'urgent') {
      scoredJobs.sort((a, b) => a.deadline_hours - b.deadline_hours);
    } else {
      // Default: Best Match
      scoredJobs.sort((a, b) => b.match_score - a.match_score);
    }

    return NextResponse.json({
      success: true,
      jobs: scoredJobs,
      totalCount: scoredJobs.length,
      driverCapacityKg,
      isOnline: isDriverOnline,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
