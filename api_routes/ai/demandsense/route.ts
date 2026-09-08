import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware';
import { DemandSenseInputSchema, DemandSenseOutputSchema } from '@/lib/domain/aiSchemas';
import { computeDemandSenseReal } from '@/lib/domain/aiEngine';

export async function POST(req: NextRequest) {
  const { user, errorResponse } = await authenticateRequest(req);
  if (errorResponse) return errorResponse;

  try {
    const rawBody = await req.json().catch(() => ({}));
    const parseResult = DemandSenseInputSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid DemandSense input parameters',
        details: parseResult.error.format(),
      }, { status: 400 });
    }

    const { crop, location } = parseResult.data;
    const result = await computeDemandSenseReal(crop, location);

    const validOutput = DemandSenseOutputSchema.parse(result);

    return NextResponse.json({
      success: true,
      ...validOutput,
    });
  } catch (err: any) {
    console.error('[API] DemandSense error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
