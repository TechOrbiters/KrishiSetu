import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';
import { INITIAL_PRODUCE } from '@/lib/seedData';

export async function GET(req: NextRequest) {
  try {
    const { data, error } = await supabaseAdmin
      .from('listings')
      .select('*')
      .in('status', ['ACTIVE', 'LOW_STOCK'])
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      // Return seed data fallback if database table is empty or unavailable
      return NextResponse.json({ success: true, listings: INITIAL_PRODUCE, source: 'seed_fallback' });
    }

    return NextResponse.json({ success: true, listings: data });
  } catch (err: any) {
    return NextResponse.json({ success: true, listings: INITIAL_PRODUCE, source: 'seed_fallback' });
  }
}

export async function POST(req: NextRequest) {
  const { user, errorResponse } = await authenticateRequest(req, ['FARMER', 'FPO_ADMIN']);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { crop_name, category, quantity, price_per_kg, grade, harvest_date, shelf_life_days, location_name, latitude, longitude, images } = body;

    if (!crop_name || !quantity || !price_per_kg) {
      return NextResponse.json({ success: false, error: 'Missing required fields: crop_name, quantity, price_per_kg' }, { status: 400 });
    }

    const listingPayload = {
      farmer_id: user!.uid,
      crop_name,
      category: category || 'Vegetables',
      total_quantity: Number(quantity),
      available_quantity: Number(quantity),
      reserved_quantity: 0,
      price_per_kg: Number(price_per_kg),
      grade: grade || 'A',
      harvest_date: harvest_date || new Date().toISOString().split('T')[0],
      shelf_life_days: Number(shelf_life_days || 7),
      status: 'ACTIVE',
      location_name: location_name || 'Lucknow Mandi, UP',
      latitude: Number(latitude || 26.8467),
      longitude: Number(longitude || 80.9462),
      images: images || [],
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from('listings')
      .insert(listingPayload)
      .select()
      .single();

    if (error) {
      console.warn('Supabase listing insert warning (using mock response):', error.message);
      return NextResponse.json({
        success: true,
        listing: { id: `lst_${Date.now()}`, ...listingPayload },
        source: 'mock',
      });
    }

    return NextResponse.json({ success: true, listing: data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
