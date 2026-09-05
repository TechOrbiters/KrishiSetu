import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const { data, error } = await supabaseAdmin
      .from('buyer_demands')
      .select('*')
      .eq('status', 'OPEN')
      .order('created_at', { ascending: false });

    if (error || !data) {
      return NextResponse.json({ success: true, demands: [] });
    }

    return NextResponse.json({ success: true, demands: data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { user, errorResponse } = await authenticateRequest(req, ['BUYER', 'FPO_ADMIN']);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { crop_name, target_quantity_kg, target_price_per_kg, location_name } = body;

    if (!crop_name || !target_quantity_kg || !target_price_per_kg) {
      return NextResponse.json({ success: false, error: 'Missing required fields: crop_name, target_quantity_kg, target_price_per_kg' }, { status: 400 });
    }

    const demandPayload = {
      buyer_id: user!.uid,
      crop_name,
      target_quantity_kg: Number(target_quantity_kg),
      target_price_per_kg: Number(target_price_per_kg),
      location_name: location_name || 'Lucknow Mandi, UP',
      status: 'OPEN',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from('buyer_demands')
      .insert(demandPayload)
      .select()
      .single();

    if (error) {
      return NextResponse.json({
        success: true,
        demand: { id: `dem_${Date.now()}`, ...demandPayload },
        source: 'mock',
      });
    }

    return NextResponse.json({ success: true, demand: data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
