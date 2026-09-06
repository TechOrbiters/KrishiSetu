import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { calculateSmartMatchScore } from '@/lib/domain/aiEngine';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const demandId = params.id;
    if (!demandId) {
      return NextResponse.json({ success: false, error: 'Demand ID is required' }, { status: 400 });
    }

    // Fetch buyer demand by ID
    const { data: demand, error: demandErr } = await supabaseAdmin
      .from('buyer_demands')
      .select('*')
      .eq('id', demandId)
      .maybeSingle();

    if (demandErr || !demand) {
      return NextResponse.json({ success: false, error: 'Buyer demand not found' }, { status: 404 });
    }

    // Query active produce listings from database
    let { data: listings, error: listingsErr } = await supabaseAdmin
      .from('produce_listings')
      .select('*')
      .in('status', ['ACTIVE', 'LOW_STOCK'])
      .gt('available_quantity', 0)
      .order('created_at', { ascending: false });

    if (listingsErr || !listings) {
      // Fallback try 'listings' table
      const fallbackResult = await supabaseAdmin
        .from('listings')
        .select('*')
        .in('status', ['ACTIVE', 'LOW_STOCK'])
        .gt('available_quantity', 0);
      if (fallbackResult.data) {
        listings = fallbackResult.data;
      }
    }

    const availableListings = listings || [];

    // Filter and score listings using deterministic SmartMatch engine
    const matches = availableListings
      .map((listing) => {
        const matchResult = calculateSmartMatchScore(listing, demand);
        return {
          listing,
          score: matchResult.score,
          eligibility: matchResult.isEligible,
          reasons: matchResult.reasons,
          breakdown: matchResult.breakdown,
          data_timestamp: matchResult.data_timestamp,
        };
      })
      .sort((a, b) => b.score - a.score);

    return NextResponse.json({
      success: true,
      demand,
      total_matches: matches.length,
      eligible_matches: matches.filter((m) => m.eligibility).length,
      matches,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
