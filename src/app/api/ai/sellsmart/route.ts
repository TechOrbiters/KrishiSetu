import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware';
import { SellSmartInputSchema, SellSmartOutputSchema } from '@/lib/domain/aiSchemas';
import { computeSellSmartReal } from '@/lib/domain/aiEngine';

export async function POST(req: NextRequest) {
  const { user, errorResponse } = await authenticateRequest(req);
  if (errorResponse) return errorResponse;

  try {
    const rawBody = await req.json().catch(() => ({}));
    const parseResult = SellSmartInputSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid SellSmart input parameters',
        details: parseResult.error.format(),
      }, { status: 400 });
    }

    const { crop, quantityKg, farmerAskingPrice, location } = parseResult.data;
    const result = await computeSellSmartReal(crop, quantityKg, farmerAskingPrice, location);

    const validOutput = SellSmartOutputSchema.parse(result);

    return NextResponse.json({
      success: true,
      ...validOutput,
    });
  } catch (err: any) {
    console.error('[API] SellSmart error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
