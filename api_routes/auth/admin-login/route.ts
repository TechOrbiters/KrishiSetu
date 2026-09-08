import { NextRequest, NextResponse } from 'next/server';
import { createFirebaseCustomToken } from '@/lib/firebase/admin';

/**
 * POST /api/auth/admin-login
 *
 * Admin-specific authentication endpoint.
 * Accepts a phone number and verifies it against the ADMIN_PHONE env variable.
 * Issues a Firebase custom token with role: 'ADMIN' claim on success.
 *
 * Security:
 * - Never auto-creates admin accounts.
 * - If no ADMIN_PHONE is configured, the demo identity is used for hackathon mode.
 * - Role is embedded in the Firebase JWT claim (server-side), not the request body.
 * - Non-admin callers receive 403.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { phone, identifier } = body;

    // Normalise the identifier: strip non-digits, take last 10
    const raw = String(phone || identifier || '').replace(/\D/g, '').slice(-10);

    if (!raw || raw.length !== 10) {
      return NextResponse.json(
        { success: false, error: 'Valid 10-digit phone number is required.' },
        { status: 400 }
      );
    }

    // -----------------------------------------------------------------------
    // Determine the authorised admin phone(s).
    // ADMIN_PHONE env var can be a comma-separated list of 10-digit numbers.
    // If not configured, fall back to the demo admin phone for hackathon mode.
    // -----------------------------------------------------------------------
    const adminPhonesEnv = process.env.ADMIN_PHONE || '';
    const demoAdminPhone = '9999999999'; // demo fallback only

    const adminPhones: string[] = adminPhonesEnv
      ? adminPhonesEnv.split(',').map((p) => p.trim().replace(/\D/g, '').slice(-10))
      : [demoAdminPhone];

    const isAuthorised = adminPhones.includes(raw);

    if (!isAuthorised) {
      // Do NOT reveal which phones are authorised.
      return NextResponse.json(
        {
          success: false,
          error: 'Admin access is not authorised for this identity. Contact the platform administrator.',
        },
        { status: 403 }
      );
    }

    // -----------------------------------------------------------------------
    // Issue a Firebase custom token with ADMIN role claim.
    // createFirebaseCustomToken() uses Firebase Admin SDK when configured,
    // or returns demo_token_admin when running without Firebase credentials.
    // -----------------------------------------------------------------------
    const adminUid = `admin_${raw}`;
    const customToken = await createFirebaseCustomToken(adminUid, { role: 'ADMIN' });

    const isDemo = customToken.startsWith('demo_token_');

    console.log(
      `[ADMIN_AUTH] Admin authenticated: uid=${adminUid} demo=${isDemo}`
    );

    return NextResponse.json({
      success: true,
      customToken,
      isDemo,
      message: 'Admin authenticated successfully.',
      adminUid,
    });
  } catch (err: any) {
    console.error('[ADMIN_AUTH_ERROR]', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Authentication failed.' },
      { status: 500 }
    );
  }
}
