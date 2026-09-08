import { NextRequest, NextResponse } from 'next/server';
import { createOrGetFirebaseUser, createFirebaseCustomToken } from '@/lib/firebase/admin';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      phone,
      otp,
      testToken,
      verificationToken,
      sessionInfo,
      fullName,
      role,
      village,
      district,
      state,
      aadhaarLast4,
    } = body;

    if (!phone) {
      return NextResponse.json(
        { success: false, error: 'मोबाइल नंबर आवश्यक है (Phone number is required)' },
        { status: 400 }
      );
    }

    const cleaned = phone.replace(/\D/g, '').slice(-10);
    if (cleaned.length !== 10) {
      return NextResponse.json(
        { success: false, error: 'कृपया 10 अंकों का वैध मोबाइल नंबर दर्ज करें' },
        { status: 400 }
      );
    }

    // OTP verification has been removed as per user instruction. Authentication is now direct.
    const finalName = fullName || 'किसान साथी';
    const finalRole = role || 'FARMER';
    const formattedPhone = `+91${cleaned}`;

    // 2. Create or retrieve real user in Firebase Auth
    const fbUser = await createOrGetFirebaseUser(formattedPhone, finalName);
    const firebaseUid = fbUser.uid;

    // 3. Generate signed Firebase custom token for client SDK sign-in
    const customToken = await createFirebaseCustomToken(firebaseUid, { role: finalRole });

    // 4. Upsert user into Supabase users table
    const locationName =
      village && district ? `${village}, ${district}` : `${district || 'बाराबंकी'}, उत्तर प्रदेश`;

    let dbUser: any = null;
    const { data: upsertedUser, error: userError } = await supabaseAdmin
      .from('users')
      .upsert(
        {
          firebase_uid: firebaseUid,
          phone: cleaned,
          full_name: finalName,
          role: finalRole,
          location_name: locationName,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'firebase_uid' }
      )
      .select()
      .maybeSingle();

    if (userError || !upsertedUser) {
      console.warn('[SUPABASE_USER_UPSERT_NOTE]', userError?.message);
      dbUser = {
        id: firebaseUid,
        firebase_uid: firebaseUid,
        phone: cleaned,
        full_name: finalName,
        role: finalRole,
        location_name: locationName,
      };
    } else {
      dbUser = upsertedUser;
    }

    // 5. Upsert farmer profile if farmer role
    let farmerProfile: any = null;
    if (finalRole === 'FARMER' || finalRole === 'FARMER_FPO') {
      const { data: prof, error: profErr } = await supabaseAdmin
        .from('farmer_profiles')
        .upsert(
          {
            user_id: dbUser.id,
            village: village || 'ग्राम बहरामघाट',
            district: district || 'बाराबंकी',
            state: state || 'उत्तर प्रदेश',
            verification_status: aadhaarLast4 ? 'VERIFIED' : 'PENDING',
          },
          { onConflict: 'user_id' }
        )
        .select()
        .maybeSingle();

      if (profErr) {
        console.warn('[SUPABASE_PROFILE_UPSERT_NOTE]', profErr.message);
      }
      farmerProfile = prof || {
        user_id: dbUser.id,
        village: village || 'ग्राम बहरामघाट',
        district: district || 'बाराबंकी',
        state: state || 'उत्तर प्रदेश',
        verification_status: aadhaarLast4 ? 'VERIFIED' : 'PENDING',
      };
    }

    console.log(
      `[FIREBASE_REGISTER_SUCCESS] User ${firebaseUid} authenticated via direct phone auth (Zero OTP)`
    );

    return NextResponse.json({
      success: true,
      customToken,
      firebaseUid,
      user: dbUser,
      profile: farmerProfile,
      verifiedVia: 'DIRECT_PHONE_AUTH',
      testTokenUsed: false,
    });
  } catch (err: any) {
    console.error('[FIREBASE_VERIFY_ERROR]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
