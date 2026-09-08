import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { tripId, etaHours = 2, freshnessWindowHours = 24 } = body;

    if (!tripId) {
      return NextResponse.json({ success: false, error: 'tripId is required' }, { status: 400 });
    }

    // FreshRoute compliance validation
    if (etaHours > freshnessWindowHours) {
      return NextResponse.json(
        {
          success: false,
          error: 'FreshRoute Violation: Trip ETA exceeds maximum crop freshness guarantee.',
          isEligible: false,
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      tripId,
      status: 'ACCEPTED',
      freshnessVerified: true,
      message: 'ट्रिप सफलतापूर्वक स्वीकार कर ली गई है।',
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
