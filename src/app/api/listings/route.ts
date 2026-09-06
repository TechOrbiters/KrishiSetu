import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const farmerId = searchParams.get('farmerId');
    const statusParam = searchParams.get('status');

    let query = supabaseAdmin
      .from('produce_listings')
      .select('*')
      .order('created_at', { ascending: false });

    if (farmerId) {
      query = query.eq('farmer_id', farmerId);
    }
    if (statusParam) {
      query = query.eq('status', statusParam);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, listings: data || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { user, errorResponse } = await authenticateRequest(req, ['FARMER', 'FARMER_FPO', 'FPO_ADMIN', 'ADMIN']);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const {
      crop_name,
      category,
      quantity,
      total_quantity,
      price_per_kg,
      askingPricePerKg,
      grade,
      harvest_date,
      shelf_life_days,
      location_name,
      latitude,
      longitude,
      images,
    } = body;

    // Strict input validation
    if (!crop_name || typeof crop_name !== 'string' || crop_name.trim() === '') {
      return NextResponse.json({ success: false, error: 'Valid crop_name is required' }, { status: 400 });
    }

    const numQuantity = Number(quantity ?? total_quantity);
    if (isNaN(numQuantity) || numQuantity <= 0) {
      return NextResponse.json({ success: false, error: 'Quantity must be a positive number greater than 0' }, { status: 400 });
    }

    const numPrice = Number(price_per_kg ?? askingPricePerKg);
    if (isNaN(numPrice) || numPrice <= 0) {
      return NextResponse.json({ success: false, error: 'Price per kg must be a positive number greater than 0' }, { status: 400 });
    }

    const shelfLifeVal = Number(shelf_life_days || 7);
    if (isNaN(shelfLifeVal) || shelfLifeVal <= 0) {
      return NextResponse.json({ success: false, error: 'Shelf life days must be a positive number' }, { status: 400 });
    }

    // Resolve caller UUID from Supabase `users` table matching Firebase UID
    let { data: dbUserData } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('firebase_uid', user!.uid)
      .maybeSingle();

    if (!dbUserData) {
      const { data: newUser, error: createErr } = await supabaseAdmin
        .from('users')
        .insert({
          firebase_uid: user!.uid,
          phone: user!.phone || '+919876543210',
          full_name: 'किसान साथी',
          role: user!.role || 'FARMER',
          location_name: location_name || 'बाराबंकी, उत्तर प्रदेश',
          latitude: Number(latitude || 26.8467),
          longitude: Number(longitude || 80.9462),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('id, role')
        .single();

      if (createErr || !newUser) {
        return NextResponse.json({
          success: false,
          error: 'Failed to provision user record for authenticated farmer: ' + createErr?.message,
        }, { status: 500 });
      }
      dbUserData = newUser;
    }

    const dbUserId = dbUserData.id;
    const harvestDateVal = harvest_date || new Date().toISOString().split('T')[0];
    const harvestTimeMs = new Date(harvestDateVal).getTime();
    const freshnessDeadline = new Date(harvestTimeMs + shelfLifeVal * 24 * 3600 * 1000).toISOString();

    const listingPayload = {
      farmer_id: dbUserId,
      crop_name: crop_name.trim(),
      category: category || 'Vegetables',
      total_quantity: numQuantity,
      available_quantity: numQuantity,
      reserved_quantity: 0,
      sold_quantity: 0,
      price_per_kg: numPrice,
      grade: grade || 'A',
      harvest_date: harvestDateVal,
      shelf_life_days: shelfLifeVal,
      status: 'ACTIVE',
      location_name: location_name || 'Lucknow Mandi, UP',
      latitude: Number(latitude || 26.8467),
      longitude: Number(longitude || 80.9462),
      images: images || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Insert directly into canonical table `produce_listings`
    const { data, error } = await supabaseAdmin
      .from('produce_listings')
      .insert(listingPayload)
      .select()
      .single();

    if (error || !data) {
      console.error('Supabase produce_listings insert failed:', error?.message);
      return NextResponse.json({
        success: false,
        error: 'LISTING_CREATION_FAILED',
        details: error?.message || 'Database insert failed for produce listing',
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data,
      listing: {
        ...data,
        freshness_deadline: freshnessDeadline,
      },
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
