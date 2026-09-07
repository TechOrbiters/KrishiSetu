import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const { user, errorResponse } = await authenticateRequest(req, ['FARMER', 'FARMER_FPO', 'FPO_ADMIN', 'BUYER', 'TRANSPORTER', 'ADMIN']);
  if (errorResponse) return errorResponse;

  try {
    // Query users table by verified firebase_uid
    const { data: dbUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('*, farmer_profiles(*)')
      .eq('firebase_uid', user!.uid)
      .single();

    if (userError || !dbUser) {
      // Auto-bootstrap user if record doesn't exist yet in Supabase
      const defaultName = 
        user!.role === 'BUYER' ? 'Buyer Partner' :
        user!.role === 'TRANSPORTER' ? 'Transporter Partner' :
        user!.role === 'ADMIN' ? 'Platform Administrator' :
        'Farmer Partner';

      const userRole = user!.role === 'FARMER_FPO' ? 'FARMER' : user!.role;

      const { data: newUser } = await supabaseAdmin
        .from('users')
        .upsert({
          firebase_uid: user!.uid,
          phone: user!.phone,
          full_name: defaultName,
          role: userRole,
          location_name: 'Barabanki, UP',
        }, { onConflict: 'firebase_uid' })
        .select()
        .single();

      let newProfile = null;
      if (user!.role === 'FARMER' || user!.role === 'FARMER_FPO') {
        const { data: prof } = await supabaseAdmin
          .from('farmer_profiles')
          .upsert({
            user_id: newUser ? newUser.id : user!.uid,
            village: 'Barabanki',
            district: 'Barabanki',
            state: 'Uttar Pradesh',
          }, { onConflict: 'user_id' })
          .select()
          .single();
        newProfile = prof;
      }

      return NextResponse.json({
        success: true,
        user: newUser || {
          id: user!.uid,
          firebase_uid: user!.uid,
          phone: user!.phone,
          full_name: defaultName,
          role: user!.role,
        },
        profile: newProfile || {
          village: 'Barabanki',
          district: 'Barabanki',
          state: 'Uttar Pradesh',
          verification_status: 'PENDING',
        },
        source: 'autobootstrap',
      });
    }

    const profile = Array.isArray(dbUser.farmer_profiles)
      ? dbUser.farmer_profiles[0]
      : dbUser.farmer_profiles;

    return NextResponse.json({
      success: true,
      user: dbUser,
      profile: profile || null,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const { user, errorResponse } = await authenticateRequest(req, ['FARMER', 'FARMER_FPO', 'FPO_ADMIN', 'BUYER', 'TRANSPORTER', 'ADMIN']);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json().catch(() => ({}));
    const { full_name, village, district, state, father_or_husband_name, post_office, pincode, land_hectares } = body;

    // Fetch existing user ID
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('firebase_uid', user!.uid)
      .single();

    const userUpdates: any = { updated_at: new Date().toISOString() };
    if (full_name) userUpdates.full_name = full_name;
    if (village || district) userUpdates.location_name = `${village || ''}, ${district || ''}`;

    // Update users table for verified user only
    const { data: updatedUser } = await supabaseAdmin
      .from('users')
      .update(userUpdates)
      .eq('firebase_uid', user!.uid)
      .select()
      .single();

    let updatedProfile = null;
    if (existingUser?.id && (user!.role === 'FARMER' || user!.role === 'FARMER_FPO')) {
      const profileUpdates: any = {};
      if (village) profileUpdates.village = village;
      if (district) profileUpdates.district = district;
      if (state) profileUpdates.state = state;
      if (father_or_husband_name) profileUpdates.father_or_husband_name = father_or_husband_name;
      if (post_office) profileUpdates.post_office = post_office;
      if (pincode) profileUpdates.pincode = pincode;
      if (land_hectares) profileUpdates.land_hectares = Number(land_hectares);

      const { data: prof } = await supabaseAdmin
        .from('farmer_profiles')
        .update(profileUpdates)
        .eq('user_id', existingUser.id)
        .select()
        .single();
      
      updatedProfile = prof;
    }

    return NextResponse.json({
      success: true,
      user: updatedUser || { firebase_uid: user!.uid, full_name },
      profile: updatedProfile || { village, district, state },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
