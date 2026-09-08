import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const nowISO = new Date().toISOString();

    // Query unaccepted placed orders past their 12h expiration window
    const { data: expiredOrders, error } = await supabaseAdmin
      .from('orders')
      .select('id, listing_id, quantity')
      .eq('status', 'PLACED')
      .lt('expires_at', nowISO);

    if (error || !expiredOrders || expiredOrders.length === 0) {
      return NextResponse.json({ success: true, processedCount: 0, message: 'No expired orders found' });
    }

    let processedCount = 0;
    for (const order of expiredOrders) {
      // Mark as EXPIRED
      await supabaseAdmin
        .from('orders')
        .update({ status: 'EXPIRED', updated_at: nowISO })
        .eq('id', order.id);

      // Revert reserved stock to listing
      await supabaseAdmin.rpc('restore_listing_quantity', {
        p_listing_id: order.listing_id,
        p_restored_qty: order.quantity,
      });

      processedCount++;
    }

    return NextResponse.json({
      success: true,
      processedCount,
      timestamp: nowISO,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export const POST = GET;
