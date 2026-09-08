import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { origin = 'Barabanki', destination = 'Lucknow Mandi', weightKg = 500 } = body;

    return NextResponse.json({
      success: true,
      recommendation: {
        suggestedVehicle: weightKg > 2000 ? 'LARGE_TRUCK' : weightKg > 750 ? 'PICKUP_VAN' : 'MINI_TRUCK',
        estimatedCost: Math.round(350 + (weightKg / 100) * 45),
        freshnessSafe: true,
        loadPoolingEligible: weightKg < 1000,
        poolingBonus: weightKg < 1000 ? '₹350 अतिरिक्त बचत' : null,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
