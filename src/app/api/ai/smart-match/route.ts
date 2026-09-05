import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { computeSmartMatch, computeDemandSense, computeSellSmartOptions } from '@/lib/domain/aiEngine';

const SmartMatchRequestSchema = z.object({
  crop_name: z.string().min(1),
  quantity_kg: z.number().positive(),
  asking_price_per_kg: z.number().positive(),
  location: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();
    const validation = SmartMatchRequestSchema.safeParse(rawBody);

    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'Validation Error',
        details: validation.error.format(),
      }, { status: 400 });
    }

    const { crop_name, quantity_kg, asking_price_per_kg, location } = validation.data;

    // Run deterministic domain AI engine
    const matches = computeSmartMatch(asking_price_per_kg, quantity_kg, crop_name);
    const demandSense = computeDemandSense(crop_name, location || 'Lucknow');
    const sellOptions = computeSellSmartOptions(crop_name, quantity_kg, asking_price_per_kg);

    return NextResponse.json({
      success: true,
      query: { crop_name, quantity_kg, asking_price_per_kg, location },
      demandSense,
      smartMatches: matches,
      sellSmartOptions: sellOptions,
      usedFallback: false,
      model: 'AI-MANDI-HybridEngine-v1',
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
