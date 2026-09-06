import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const buyerId = searchParams.get('buyerId');
    const cropName = searchParams.get('cropName');
    const statusParam = searchParams.get('status') || 'OPEN';

    let query = supabaseAdmin
      .from('buyer_demands')
      .select('*')
      .order('created_at', { ascending: false });

    if (statusParam && statusParam !== 'ALL') {
      query = query.eq('status', statusParam);
    }
    if (buyerId) {
      query = query.eq('buyer_id', buyerId);
    }
    if (cropName) {
      query = query.ilike('crop_name', `%${cropName}%`);
    }

    const { data, error } = await query;

    if (error || !data) {
      return NextResponse.json({ success: true, demands: [] });
    }

    return NextResponse.json({ success: true, demands: data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { user, errorResponse } = await authenticateRequest(req, ['BUYER', 'FPO_ADMIN', 'FARMER', 'FARMER_FPO']);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { crop_name, target_quantity_kg, target_price_per_kg, location_name, latitude, longitude, quality_grade } = body;

    if (!crop_name || typeof crop_name !== 'string' || crop_name.trim() === '') {
      return NextResponse.json({ success: false, error: 'Valid crop_name is required' }, { status: 400 });
    }

    const numQuantity = Number(target_quantity_kg);
    if (isNaN(numQuantity) || numQuantity <= 0) {
      return NextResponse.json({ success: false, error: 'Target quantity must be a positive number' }, { status: 400 });
    }

    const numPrice = Number(target_price_per_kg);
    if (isNaN(numPrice) || numPrice <= 0) {
      return NextResponse.json({ success: false, error: 'Target price per kg must be a positive number' }, { status: 400 });
    }

    let dbUserId = user!.uid;
    const { data: dbUserData } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('firebase_uid', user!.uid)
      .maybeSingle();

    if (dbUserData?.id) {
      dbUserId = dbUserData.id;
    }

    const demandPayload = {
      buyer_id: dbUserId,
      crop_name: crop_name.trim(),
      target_quantity_kg: numQuantity,
      target_price_per_kg: numPrice,
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

    if (error || !data) {
      console.error('Supabase buyer demand insert error:', error?.message);
      return NextResponse.json({
        success: false,
        error: error?.message || 'Database insert failed for buyer demand',
      }, { status: 500 });
    }

    return NextResponse.json({ success: true, demand: data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
