import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/farmers
 * ADMIN-only. Returns paginated farmer list with profiles and order stats.
 */
export async function GET(req: NextRequest) {
  const { user, errorResponse } = await authenticateRequest(req, ['ADMIN']);
  if (errorResponse) return errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, parseInt(searchParams.get('limit') || '20', 10));
    const offset = (page - 1) * limit;
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const district = searchParams.get('district') || '';

    // Base query: users who are farmers
    let query = supabaseAdmin
      .from('users')
      .select(`
        id,
        firebase_uid,
        full_name,
        phone,
        role,
        location_name,
        created_at,
        farmer_profiles (
          id,
          village,
          district,
          state,
          verification_status,
          land_hectares
        )
      `, { count: 'exact' })
      .in('role', ['FARMER', 'FPO_ADMIN'])
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    const { data: farmers, error, count } = await query;

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // For each farmer, get their listing count and order stats (batch query)
    const farmerIds = (farmers || []).map((f) => f.id);

    const [listingStatsResult, orderStatsResult] = await Promise.allSettled([
      farmerIds.length > 0
        ? supabaseAdmin
            .from('produce_listings')
            .select('farmer_id, status')
            .in('farmer_id', farmerIds)
        : Promise.resolve({ data: [], error: null }),
      farmerIds.length > 0
        ? supabaseAdmin
            .from('orders')
            .select('farmer_id, product_amount, status')
            .in('farmer_id', farmerIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    const listingStats = listingStatsResult.status === 'fulfilled' ? (listingStatsResult.value.data || []) : [];
    const orderStats = orderStatsResult.status === 'fulfilled' ? (orderStatsResult.value.data || []) : [];

    // Build lookup maps
    const listingsByFarmer: Record<string, number> = {};
    listingStats.forEach((l: any) => {
      if (l.status === 'ACTIVE' || l.status === 'LOW_STOCK') {
        listingsByFarmer[l.farmer_id] = (listingsByFarmer[l.farmer_id] || 0) + 1;
      }
    });

    const earningsByFarmer: Record<string, { total: number; orders: number }> = {};
    orderStats.forEach((o: any) => {
      if (!earningsByFarmer[o.farmer_id]) {
        earningsByFarmer[o.farmer_id] = { total: 0, orders: 0 };
      }
      earningsByFarmer[o.farmer_id].total += Number(o.product_amount || 0);
      earningsByFarmer[o.farmer_id].orders += 1;
    });

    // Apply district filter (post-fetch since it's in nested profile)
    let enriched = (farmers || []).map((f) => ({
      id: f.id,
      fullName: f.full_name,
      full_name: f.full_name,
      phone: f.phone ? `XXXXXX${f.phone.toString().slice(-4)}` : 'N/A', // mask PII
      role: f.role,
      locationName: f.location_name,
      location_name: f.location_name,
      createdAt: f.created_at,
      created_at: f.created_at,
      profile: Array.isArray(f.farmer_profiles) ? f.farmer_profiles[0] : f.farmer_profiles,
      farmer_profiles: Array.isArray(f.farmer_profiles) ? f.farmer_profiles : f.farmer_profiles ? [f.farmer_profiles] : [],
      activeListings: listingsByFarmer[f.id] || 0,
      totalOrders: earningsByFarmer[f.id]?.orders || 0,
      totalEarnings: earningsByFarmer[f.id]?.total || 0,
    }));

    if (district) {
      enriched = enriched.filter(
        (f) => f.profile?.district?.toLowerCase().includes(district.toLowerCase())
      );
    }
    if (status) {
      enriched = enriched.filter(
        (f) => f.profile?.verification_status === status
      );
    }

    // Summary KPIs
    const allProfiles = enriched.map((f) => f.profile);
    const verifiedCount = allProfiles.filter((p) => p?.verification_status === 'VERIFIED').length;
    const pendingCount = allProfiles.filter((p) => p?.verification_status === 'PENDING').length;

    return NextResponse.json({
      success: true,
      data: {
        farmers: enriched,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
        summary: {
          total: count || 0,
          verified: verifiedCount,
          pending: pendingCount,
        },
      },
    });
  } catch (err: any) {
    console.error('[ADMIN_FARMERS_ERROR]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
