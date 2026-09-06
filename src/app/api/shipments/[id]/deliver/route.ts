import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(
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

    const { data: shipment, error: fetchErr } = await supabaseAdmin
      .from('shipments')
      .select('*')
      .eq('id', shipmentId)
      .maybeSingle();

    if (fetchErr || !shipment) {
      return NextResponse.json({ success: false, error: 'Shipment not found' }, { status: 404 });
    }

    const nowIso = new Date().toISOString();

    const { data: updatedShipment, error: updateErr } = await supabaseAdmin
      .from('shipments')
      .update({
        status: 'DELIVERED',
        updated_at: nowIso,
      })
      .eq('id', shipmentId)
      .select()
      .maybeSingle();

    if (updateErr || !updatedShipment) {
      return NextResponse.json({ success: false, error: updateErr?.message || 'Failed to complete delivery' }, { status: 500 });
    }

    if (shipment.order_id) {
      await supabaseAdmin
        .from('orders')
        .update({
          status: 'DELIVERED',
          updated_at: nowIso,
        })
        .eq('id', shipment.order_id);

      // Settle payment ledger & trigger notifications
      const { data: ord } = await supabaseAdmin
        .from('orders')
        .select('*, produce_listings(*)')
        .eq('id', shipment.order_id)
        .maybeSingle();

      if (ord) {
        const askingPrice = Number(ord.unit_price || ord.produce_listings?.price_per_kg || 22);
        const quantity = Number(ord.quantity || 100);
        const farmerRevenue = askingPrice * quantity;
        const deliveryCharge = Number(ord.delivery_fee || 1500);

        const farmerId = ord.farmer_id || ord.produce_listings?.farmer_id;
        const buyerId = ord.buyer_id;
        const transporterId = shipment.transporter_id || farmerId;

        // Upsert farmer product payment ledger record
        await supabaseAdmin.from('payment_ledger').insert({
          order_id: shipment.order_id,
          payer_id: buyerId,
          payee_id: farmerId,
          amount: farmerRevenue,
          fee_type: 'PRODUCT_PAYMENT',
          status: 'RELEASED',
          created_at: nowIso,
        });

        // Upsert delivery fee ledger record for transporter
        await supabaseAdmin.from('payment_ledger').insert({
          order_id: shipment.order_id,
          payer_id: buyerId,
          payee_id: transporterId,
          amount: deliveryCharge,
          fee_type: 'DELIVERY_FEE',
          status: 'RELEASED',
          created_at: nowIso,
        });

        const { sendDomainNotification } = await import('@/lib/notifications/service');
        if (farmerId) {
          await sendDomainNotification({
            userId: farmerId,
            eventType: 'DELIVERED',
            title: 'ऑर्डर डिलीवर हुआ (Order Delivered)',
            message: `आपका ऑर्डर सफलपूर्वक डिलीवर हो गया है। ₹${farmerRevenue.toLocaleString('en-IN')} आपके खाते में क्रेडिट हो गया है।`,
            linkUrl: '/farmer/payments',
            idempotencyKey: `DELIVERED:${shipment.order_id}`,
          });

          await sendDomainNotification({
            userId: farmerId,
            eventType: 'PAYMENT_RECEIVED',
            title: 'भुगतान प्राप्त हुआ (Payment Received)',
            message: `आपकी उपज का पूरा मूल्य ₹${farmerRevenue.toLocaleString('en-IN')} आपके खाते में जमा हो गया है। ₹0 प्लेटफॉर्म शुल्क।`,
            linkUrl: '/farmer/payments',
            idempotencyKey: `PAYMENT_RECEIVED:${shipment.order_id}`,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Shipment delivered successfully',
      shipment: updatedShipment,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
