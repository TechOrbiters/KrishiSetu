import { NextRequest, NextResponse } from 'next/server';
import { verifyStoredOtp, FIREBASE_TEST_TOKEN } from '@/lib/auth/otpStore';
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

    const effectiveToken = testToken || verificationToken;
    const inputOtp = otp || (effectiveToken === FIREBASE_TEST_TOKEN ? '123456' : '');

    // 1. Verify OTP or test token against store
    const { valid, entry, isFirebaseTestToken } = verifyStoredOtp(cleaned, inputOtp, {
      testToken: effectiveToken,
      sessionInfo,
    });

    if (!valid) {
      return NextResponse.json(
        {
          success: false,
          error: 'अमान्य या समाप्त OTP दर्ज किया गया है (Invalid or expired OTP / verification token)',
        },
        { status: 400 }
      );
    }

    const finalName = fullName || entry?.fullName || 'किसान साथी';
    const finalRole = role || entry?.role || 'FARMER';
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
      `[FIREBASE_REGISTER_SUCCESS] User ${firebaseUid} verified & authenticated via Firebase (${isFirebaseTestToken ? 'Test Token' : 'OTP'})`
    );

    return NextResponse.json({
      success: true,
      customToken,
      firebaseUid,
      user: dbUser,
      profile: farmerProfile,
      verifiedVia: isFirebaseTestToken ? 'FIREBASE_TEST_TOKEN' : 'OTP_VERIFIED',
      testTokenUsed: Boolean(isFirebaseTestToken || effectiveToken === FIREBASE_TEST_TOKEN),
    });
  } catch (err: any) {
    console.error('[FIREBASE_VERIFY_ERROR]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
