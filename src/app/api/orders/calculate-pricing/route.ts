import { NextRequest, NextResponse } from 'next/server';
import { calculateFarmerRevenue } from '@/lib/domain/pricing';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { items = [], deliveryMethod = 'DELIVERY_PARTNER', distanceKm = 15, vehicleType = 'MINI_TRUCK' } = body;

    let totalProductAmount = 0;
    let totalQuantityKg = 0;

    for (const item of items) {
      const price = Number(item.pricePerKg || 0);
      const qty = Number(item.quantityKg || 0);
      totalProductAmount += price * qty;
      totalQuantityKg += qty;
    }

    // Dynamic delivery fee calculation: ₹35 base + ₹12/km
    let deliveryFee = 0;
    if (deliveryMethod === 'DELIVERY_PARTNER') {
      const baseFee = vehicleType === 'LARGE_TRUCK' ? 800 : vehicleType === 'PICKUP_VAN' ? 500 : 350;
      const perKmRate = vehicleType === 'LARGE_TRUCK' ? 22 : 14;
      deliveryFee = Math.round(baseFee + Math.max(0, distanceKm) * perKmRate);
    }

    const pricePerKg = totalQuantityKg > 0 ? totalProductAmount / totalQuantityKg : 0;
    const breakdown = calculateFarmerRevenue(pricePerKg, totalQuantityKg, deliveryFee);

    return NextResponse.json({
      success: true,
      pricing: breakdown,
      rulesEnforced: ['R-001 (Farmer full payout with zero transport deduction)', 'R-004 (Itemized separation)'],
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
