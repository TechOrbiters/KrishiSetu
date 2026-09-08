import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';
import { sendDomainNotification } from '@/lib/notifications/service';

export async function POST(req: NextRequest) {
  const { user, errorResponse } = await authenticateRequest(req);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { order_id } = body;

    if (!order_id) {
      return NextResponse.json({ success: false, error: 'order_id is required' }, { status: 400 });
    }

    // 1. Fetch order & listing details
    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .select('*, produce_listings(*), shipments(*)')
      .eq('id', order_id)
      .maybeSingle();

    if (orderErr || !order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    const askingPrice = Number(order.unit_price || order.produce_listings?.price_per_kg || 22);
    const quantity = Number(order.quantity || 100);
    const farmerRevenue = askingPrice * quantity; // e.g. 500kg * 22 = 11,000
    const deliveryCharge = Number(order.delivery_fee || 1500); // e.g. 1,500
    const buyerTotal = farmerRevenue + deliveryCharge; // e.g. 12,500
    const platformFee = 0; // MVP Rule: ₹0

    const farmerId = order.farmer_id || order.produce_listings?.farmer_id;
    const buyerId = order.buyer_id;
    const transporterId = order.shipments && order.shipments[0]?.transporter_id ? order.shipments[0].transporter_id : farmerId;

    // 2. Insert/upsert product payment ledger entry for Farmer
    const { data: farmerLedger } = await supabaseAdmin
      .from('payment_ledger')
      .insert({
        order_id,
        payer_id: buyerId,
        payee_id: farmerId,
        amount: farmerRevenue,
        fee_type: 'PRODUCT_PAYMENT',
        status: 'RELEASED',
        created_at: new Date().toISOString(),
      })
      .select()
      .maybeSingle();

    // 3. Insert/upsert delivery fee ledger entry for Transporter
    const { data: transporterLedger } = await supabaseAdmin
      .from('payment_ledger')
      .insert({
        order_id,
        payer_id: buyerId,
        payee_id: transporterId,
        amount: deliveryCharge,
        fee_type: 'DELIVERY_FEE',
        status: 'RELEASED',
        created_at: new Date().toISOString(),
      })
      .select()
      .maybeSingle();

    // 4. Update order payment status
    await supabaseAdmin
      .from('orders')
      .update({
        status: 'DELIVERED',
        payment_status: 'RELEASED',
        updated_at: new Date().toISOString(),
      })
      .eq('id', order_id);

    // 5. Trigger PAYMENT_RECEIVED notification to Farmer
    if (farmerId) {
      await sendDomainNotification({
        userId: farmerId,
        eventType: 'PAYMENT_RECEIVED',
        title: 'भुगतान प्राप्त हुआ (Payment Received)',
        message: `आपकी उपज का पूरा मूल्य ₹${farmerRevenue.toLocaleString('en-IN')} बैंक खाते में जमा हो गया है। ₹0 परिवहन कटौती की गई है।`,
        linkUrl: '/farmer/payments',
        idempotencyKey: `PAYMENT_RECEIVED:${order_id}`,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Payment settled successfully in ledger',
      calculation: {
        askingPrice,
        quantity,
        farmerRevenue,
        deliveryCharge,
        buyerTotal,
        platformFee,
      },
      ledger: {
        farmerEntry: farmerLedger,
        transporterEntry: transporterLedger,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
