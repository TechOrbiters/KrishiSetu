import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware';
import { MarketPilotInputSchema, MarketPilotOutputSchema } from '@/lib/domain/aiSchemas';
import { computeMarketPilotReal } from '@/lib/domain/aiEngine';

export async function POST(req: NextRequest) {
  const { user, errorResponse } = await authenticateRequest(req);
  if (errorResponse) return errorResponse;

  try {
    const rawBody = await req.json().catch(() => ({}));
    const parseResult = MarketPilotInputSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid MarketPilot input parameters',
        details: parseResult.error.format(),
      }, { status: 400 });
    }

    const { crop, freshnessRemainingHours, quantityKg, location } = parseResult.data;
    const result = await computeMarketPilotReal(crop, freshnessRemainingHours, quantityKg, location);

    const validOutput = MarketPilotOutputSchema.parse(result);

    return NextResponse.json({
      success: true,
      ...validOutput,
    });
  } catch (err: any) {
    console.error('[API] MarketPilot error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
