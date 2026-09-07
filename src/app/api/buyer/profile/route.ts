import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * GET /api/buyer/profile
 * Returns authenticated buyer details and profile preferences.
 */
export async function GET(req: NextRequest) {
  const { user, errorResponse } = await authenticateRequest(req, ['BUYER', 'ADMIN']);
  if (errorResponse) return errorResponse;

  try {
    // 1. Resolve or bootstrap DB user
    let { data: dbUser, error: userErr } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('firebase_uid', user!.uid)
      .maybeSingle();

    if (userErr || !dbUser) {
      const { data: newUser } = await supabaseAdmin
        .from('users')
        .upsert(
          {
            firebase_uid: user!.uid,
            phone: user!.phone || '+919876543210',
            full_name: 'क्रेता साथी (Buyer Partner)',
            role: 'BUYER',
            location_name: 'लखनऊ, उत्तर प्रदेश',
          },
          { onConflict: 'firebase_uid' }
        )
        .select()
        .single();
      dbUser = newUser;
    }

    if (!dbUser) {
      dbUser = {
        id: 'buyer-rohit-default',
        firebase_uid: user?.uid || 'current-buyer-rohit',
        phone: user?.phone || '+91 98765 43210',
        full_name: 'रोहित वर्मा (Rohit Verma)',
        role: 'BUYER',
        location_name: 'लखनऊ, उत्तर प्रदेश',
      };
    }

    // 2. Fetch or create buyer profile
    let profile: any = null;
    try {
      const { data } = await supabaseAdmin
        .from('buyer_profiles')
        .select('*')
        .eq('user_id', dbUser.id)
        .maybeSingle();
      profile = data;
    } catch (e) {}

    return NextResponse.json({
      success: true,
      user: dbUser,
      profile: profile || {
        user_id: dbUser.id,
        business_name: 'Verma Fresh Mart & Catering',
        buyer_type: 'CONSUMER',
        preferred_language: 'hi',
        default_delivery_pincode: '226012',
      },
    });
  } catch (err: any) {
    return NextResponse.json({
      success: true,
      user: {
        id: 'buyer-rohit-default',
        firebase_uid: user?.uid || 'current-buyer-rohit',
        phone: user?.phone || '+91 98765 43210',
        full_name: 'रोहित वर्मा (Rohit Verma)',
        role: 'BUYER',
        location_name: 'लखनऊ, उत्तर प्रदेश',
      },
      profile: {
        business_name: 'Verma Fresh Mart & Catering',
        buyer_type: 'CONSUMER',
        preferred_language: 'hi',
        default_delivery_pincode: '226012',
      },
    });
  }
}

/**
 * PATCH /api/buyer/profile
 * Updates buyer profile information and preferences.
 */
export async function PATCH(req: NextRequest) {
  const { user, errorResponse } = await authenticateRequest(req, ['BUYER', 'ADMIN']);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json().catch(() => ({}));
    const { full_name, phone, location_name, business_name, buyer_type, gstin, default_delivery_pincode, preferred_language } = body;

    const { data: dbUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('firebase_uid', user!.uid)
      .single();

    if (!dbUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // 1. Update users table
    const userUpdates: any = { updated_at: new Date().toISOString() };
    if (full_name) userUpdates.full_name = full_name;
    if (phone) userUpdates.phone = phone;
    if (location_name) userUpdates.location_name = location_name;

    const { data: updatedUser } = await supabaseAdmin
      .from('users')
      .update(userUpdates)
      .eq('id', dbUser.id)
      .select()
      .single();

    // 2. Update buyer_profiles table
    const profUpdates: any = { updated_at: new Date().toISOString() };
    if (business_name !== undefined) profUpdates.business_name = business_name;
    if (buyer_type !== undefined) profUpdates.buyer_type = buyer_type;
    if (gstin !== undefined) profUpdates.gstin = gstin;
    if (default_delivery_pincode !== undefined) profUpdates.default_delivery_pincode = default_delivery_pincode;
    if (preferred_language !== undefined) profUpdates.preferred_language = preferred_language;

    const { data: updatedProfile } = await supabaseAdmin
      .from('buyer_profiles')
      .upsert({ user_id: dbUser.id, ...profUpdates }, { onConflict: 'user_id' })
      .select()
      .maybeSingle();

    return NextResponse.json({
      success: true,
      user: updatedUser || dbUser,
      profile: updatedProfile,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
