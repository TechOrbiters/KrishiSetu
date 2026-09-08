import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * GET /api/transporters/earnings
 * Calculates driver earnings from real payment_ledger entries & completed shipments.
 * Enforces Domain Rule R-001: 100% of delivery fee goes directly to the transporter (₹0 platform fee).
 */
export async function GET(req: NextRequest) {
  const { user, errorResponse } = await authenticateRequest(req, ['TRANSPORTER', 'ADMIN']);
  if (errorResponse) return errorResponse;

  try {
    // 1. Resolve Transporter DB User ID
    const { data: dbUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('firebase_uid', user!.uid)
      .maybeSingle();

    const transporterId = dbUser?.id || user!.uid;

    // 2. Fetch payment_ledger entries where fee_type = 'DELIVERY_FEE' and payee_id = transporterId
    const { data: ledgerEntries, error: ledgerErr } = await supabaseAdmin
      .from('payment_ledger')
      .select('*, orders(*, produce_listings(*))')
      .eq('fee_type', 'DELIVERY_FEE')
      .eq('payee_id', transporterId)
      .order('created_at', { ascending: false });

    // 3. Also fetch completed transport_requests to ensure all trips are captured
    const { data: transportRequests } = await supabaseAdmin
      .from('transport_requests')
      .select('*, orders(*, produce_listings(*))')
      .eq('transporter_id', transporterId);

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).getTime();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    let todayEarnings = 0;
    let weekEarnings = 0;
    let monthEarnings = 0;
    let totalEarnings = 0;
    let pendingPayouts = 0;
    let completedCount = 0;

    const transactions: any[] = [];

    if (ledgerEntries && ledgerEntries.length > 0) {
      ledgerEntries.forEach((entry: any) => {
        const amount = Number(entry.amount || 0);
        const entryTime = new Date(entry.created_at).getTime();
        const order = entry.orders || {};
        const listing = order.produce_listings || {};

        if (entry.status === 'RELEASED' || entry.status === 'SETTLED') {
          totalEarnings += amount;
          completedCount++;
          if (entryTime >= startOfToday) todayEarnings += amount;
          if (entryTime >= startOfWeek) weekEarnings += amount;
          if (entryTime >= startOfMonth) monthEarnings += amount;
        } else {
          pendingPayouts += amount;
        }

        transactions.push({
          id: entry.id,
          order_id: entry.order_id,
          order_number: order.order_number || `ORD-${entry.id.slice(-6).toUpperCase()}`,
          date: entry.created_at,
          crop_name: listing.crop_name || order.crop_name || 'उपज लॉट',
          distance_km: Number(order.distance_km || 15),
          weight_kg: Number(order.quantity || 250),
          gross_amount: amount,
          platform_deduction: 0, // ₹0 Commission (Rule R-001)
          net_earnings: amount,
          status: entry.status,
        });
      });
    } else if (transportRequests && transportRequests.length > 0) {
      // Fallback from transport requests if ledger records not yet written
      transportRequests.forEach((tr: any) => {
        const fare = Number(tr.fare_amount || tr.orders?.delivery_fee || 500);
        const trTime = new Date(tr.updated_at || tr.created_at).getTime();
        const order = tr.orders || {};
        const listing = order.produce_listings || {};

        if (tr.status === 'DELIVERED') {
          totalEarnings += fare;
          completedCount++;
          if (trTime >= startOfToday) todayEarnings += fare;
          if (trTime >= startOfWeek) weekEarnings += fare;
          if (trTime >= startOfMonth) monthEarnings += fare;
        } else if (['ACCEPTED', 'IN_TRANSIT'].includes(tr.status)) {
          pendingPayouts += fare;
        }

        transactions.push({
          id: tr.id,
          order_id: tr.order_id,
          order_number: order.order_number || `ORD-${tr.id.slice(-6).toUpperCase()}`,
          date: tr.created_at,
          crop_name: listing.crop_name || order.crop_name || 'उपज लॉट',
          distance_km: Number(tr.distance_km || 15),
          weight_kg: Number(order.quantity || 250),
          gross_amount: fare,
          platform_deduction: 0,
          net_earnings: fare,
          status: tr.status === 'DELIVERED' ? 'RELEASED' : 'PENDING',
        });
      });
    }

    return NextResponse.json({
      success: true,
      summary: {
        today_earnings: todayEarnings,
        week_earnings: weekEarnings,
        month_earnings: monthEarnings,
        total_earnings: totalEarnings,
        pending_payouts: pendingPayouts,
        completed_trips_count: completedCount,
        platform_fee: 0,
        currency: 'INR',
      },
      transactions,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
