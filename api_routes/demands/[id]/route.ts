import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const demandId = params.id;
    if (!demandId) {
      return NextResponse.json({ success: false, error: 'Demand ID is required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('buyer_demands')
      .select('*')
      .eq('id', demandId)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ success: false, error: 'Buyer demand not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, demand: data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
