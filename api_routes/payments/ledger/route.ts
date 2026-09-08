import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const { user, errorResponse } = await authenticateRequest(req);
  if (errorResponse) return errorResponse;

  try {
    // 1. Resolve DB User ID
    const { data: dbUser } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('firebase_uid', user!.uid)
      .maybeSingle();

    const userId = dbUser?.id || user!.uid;

    // 2. Fetch orders associated with farmer
    const { data: orders } = await supabaseAdmin
      .from('orders')
      .select('*, produce_listings(*), users!orders_buyer_id_fkey(full_name, phone)')
      .or(`farmer_id.eq.${userId},buyer_id.eq.${userId}`);

    const farmerOrders = orders || [];

    // 3. Fetch payment_ledger entries
    const { data: ledgerEntries, error: ledgerErr } = await supabaseAdmin
      .from('payment_ledger')
      .select('*, orders(*, produce_listings(*))')
      .or(`payee_id.eq.${userId},payer_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    // Calculate Financial Metrics based on domain formula: farmerRevenue = price * quantity
    let totalEarnings = 0;
    let pendingPayouts = 0;

    if (ledgerEntries && ledgerEntries.length > 0) {
      ledgerEntries.forEach((entry: any) => {
        if (entry.fee_type === 'PRODUCT_PAYMENT' && entry.payee_id === userId) {
          if (entry.status === 'RELEASED' || entry.status === 'SETTLED') {
            totalEarnings += Number(entry.amount || 0);
          } else if (entry.status === 'HELD_IN_ESCROW' || entry.status === 'PENDING') {
            pendingPayouts += Number(entry.amount || 0);
          }
        }
      });
    } else {
      // Fallback compute from farmer orders if ledger entries not yet generated
      farmerOrders.forEach((ord: any) => {
        const farmerRevenue = Number(ord.product_amount || (ord.quantity * ord.unit_price) || 0);
        if (ord.status === 'DELIVERED') {
          totalEarnings += farmerRevenue;
        } else if (['ACCEPTED', 'IN_TRANSIT', 'PLACED'].includes(ord.status)) {
          pendingPayouts += farmerRevenue;
        }
      });
    }

    return NextResponse.json({
      success: true,
      summary: {
        totalEarnings,
        pendingPayouts,
        totalTransactions: farmerOrders.length,
        platformFee: 0, // MVP Rule: ₹0 platform fee
        currency: 'INR',
      },
      orders: farmerOrders,
      ledgerEntries: ledgerEntries || [],
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
