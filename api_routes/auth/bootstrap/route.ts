import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const { user, errorResponse } = await authenticateRequest(req, ['FARMER', 'FARMER_FPO', 'FPO_ADMIN']);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json().catch(() => ({}));
    const fullName = body.full_name || 'Farmer Partner';
    const village = body.village || 'Barabanki';
    const district = body.district || 'Barabanki';
    const state = body.state || 'Uttar Pradesh';
    const locationName = body.location_name || `${village}, ${district}`;

    // 1. Upsert into users table using verified firebase_uid
    const { data: dbUser, error: userError } = await supabaseAdmin
      .from('users')
      .upsert(
        {
          firebase_uid: user!.uid,
          phone: user!.phone,
          full_name: fullName,
          role: 'FARMER',
          location_name: locationName,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'firebase_uid' }
      )
      .select()
      .single();

    if (userError || !dbUser) {
      console.warn('Supabase users upsert warning (using fallback object):', userError?.message);
      const fallbackUser = {
        id: user!.uid,
        firebase_uid: user!.uid,
        phone: user!.phone,
        full_name: fullName,
        role: 'FARMER_FPO',
        location_name: locationName,
      };

      return NextResponse.json({
        success: true,
        user: fallbackUser,
        profile: {
          user_id: fallbackUser.id,
          village,
          district,
          state,
          verification_status: 'PENDING',
        },
        source: 'fallback',
      });
    }

    // 2. Upsert into farmer_profiles table using user_id foreign key
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('farmer_profiles')
      .upsert(
        {
          user_id: dbUser.id,
          father_or_husband_name: body.father_or_husband_name || null,
          village,
          post_office: body.post_office || null,
          district,
          state,
          pincode: body.pincode || null,
          land_hectares: Number(body.land_hectares || 0.5),
          verification_status: body.verification_status || 'PENDING',
        },
        { onConflict: 'user_id' }
      )
      .select()
      .single();

    if (profileError) {
      console.warn('Supabase farmer_profiles upsert note:', profileError.message);
    }

    return NextResponse.json({
      success: true,
      user: dbUser,
      profile: profile || {
        user_id: dbUser.id,
        village,
        district,
        state,
        verification_status: 'PENDING',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
