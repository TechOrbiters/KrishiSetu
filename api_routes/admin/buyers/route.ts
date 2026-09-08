import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/buyers
 * ADMIN-only. Returns paginated buyer list with order statistics.
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

    let query = supabaseAdmin
      .from('users')
      .select('id, full_name, phone, role, location_name, created_at', { count: 'exact' })
      .eq('role', 'BUYER')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    const { data: buyers, error, count } = await query;

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const buyerIds = (buyers || []).map((b) => b.id);

    const orderStatsResult = buyerIds.length > 0
      ? await supabaseAdmin
          .from('orders')
          .select('buyer_id, total_amount, status')
          .in('buyer_id', buyerIds)
      : { data: [], error: null };

    const ordersByBuyer: Record<string, { total: number; orders: number; active: number }> = {};
    (orderStatsResult.data || []).forEach((o: any) => {
      if (!ordersByBuyer[o.buyer_id]) {
        ordersByBuyer[o.buyer_id] = { total: 0, orders: 0, active: 0 };
      }
      ordersByBuyer[o.buyer_id].total += Number(o.total_amount || 0);
      ordersByBuyer[o.buyer_id].orders += 1;
      if (['PLACED', 'ACCEPTED', 'PACKED', 'DISPATCHED', 'IN_TRANSIT'].includes(o.status)) {
        ordersByBuyer[o.buyer_id].active += 1;
      }
    });

    const enriched = (buyers || []).map((b) => ({
      id: b.id,
      fullName: b.full_name,
      full_name: b.full_name,
      phone: b.phone ? `XXXXXX${b.phone.toString().slice(-4)}` : 'N/A',
      role: b.role,
      locationName: b.location_name,
      location_name: b.location_name,
      createdAt: b.created_at,
      created_at: b.created_at,
      totalOrders: ordersByBuyer[b.id]?.orders || 0,
      orders_count: ordersByBuyer[b.id]?.orders || 0,
      totalPurchaseValue: ordersByBuyer[b.id]?.total || 0,
      total_spent: ordersByBuyer[b.id]?.total || 0,
      activeOrders: ordersByBuyer[b.id]?.active || 0,
    }));

    const activeBuyers = enriched.filter((b) => b.totalOrders > 0).length;
    const totalGmv = enriched.reduce((s, b) => s + b.totalPurchaseValue, 0);

    return NextResponse.json({
      success: true,
      data: {
        buyers: enriched,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
        summary: {
          total: count || 0,
          active: activeBuyers,
          totalGmv,
        },
      },
    });
  } catch (err: any) {
    console.error('[ADMIN_BUYERS_ERROR]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
