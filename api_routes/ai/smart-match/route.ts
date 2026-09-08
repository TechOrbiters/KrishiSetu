import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { computeDemandSense, computeSellSmartOptions, calculateSmartMatchScore } from '@/lib/domain/aiEngine';
import { supabaseAdmin } from '@/lib/supabase/server';

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

    // Query real buyer demands from Supabase
    const { data: realDemands } = await supabaseAdmin
      .from('buyer_demands')
      .select('*')
      .eq('status', 'OPEN')
      .order('created_at', { ascending: false });

    const listingObj = {
      crop_name,
      askingPricePerKg: asking_price_per_kg,
      price_per_kg: asking_price_per_kg,
      quantityKg: quantity_kg,
      available_quantity: quantity_kg,
      location_name: location || 'Lucknow Mandi, UP',
      status: 'ACTIVE',
      harvest_date: new Date().toISOString().split('T')[0],
      shelf_life_days: 7,
    };

    let matches: any[] = [];

    if (realDemands && realDemands.length > 0) {
      matches = realDemands
        .map((dem) => {
          const matchResult = calculateSmartMatchScore(listingObj, dem);
          return {
            buyerId: dem.buyer_id || dem.id,
            buyerName: dem.buyer_name || 'लखनऊ थोक मंडी खरीदार',
            buyerType: 'WHOLESALER',
            matchScore: matchResult.score,
            offeredPricePerKg: dem.target_price_per_kg,
            quantityNeededKg: dem.target_quantity_kg,
            distanceKm: matchResult.breakdown.distanceScore > 80 ? 15 : 35,
            reliabilityRating: 4.8,
            isEligible: matchResult.isEligible,
            breakdown: matchResult.breakdown,
            reasons: matchResult.reasons,
            data_timestamp: matchResult.data_timestamp,
          };
        })
        .filter((m) => m.isEligible);
    }

    // Run domain AI engines for DemandSense and SellSmart
    const demandSense = computeDemandSense(crop_name, location || 'Lucknow');
    const sellOptions = computeSellSmartOptions(crop_name, quantity_kg, asking_price_per_kg);

    return NextResponse.json({
      success: true,
      query: { crop_name, quantity_kg, asking_price_per_kg, location },
      demandSense,
      smartMatches: matches,
      total_matches: matches.length,
      sellSmartOptions: sellOptions,
      usedFallback: matches.length === 0,
      model: 'AI-MANDI-HybridEngine-v1',
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
