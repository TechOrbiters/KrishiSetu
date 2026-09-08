import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * GET /api/transporters/availability
 * Fetch current online/offline status.
 */
export async function GET(req: NextRequest) {
  const { user, errorResponse } = await authenticateRequest(req, ['TRANSPORTER', 'ADMIN']);
  if (errorResponse) return errorResponse;

  try {
    const { data: dbUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('firebase_uid', user!.uid)
      .maybeSingle();

    if (!dbUser) {
      return NextResponse.json({ success: true, availability: true });
    }

    const { data: prof } = await supabaseAdmin
      .from('transporter_profiles')
      .select('availability')
      .eq('user_id', dbUser.id)
      .maybeSingle();

    return NextResponse.json({
      success: true,
      availability: prof?.availability !== false,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * PATCH /api/transporters/availability
 * Toggle online / offline duty status.
 */
export async function PATCH(req: NextRequest) {
  const { user, errorResponse } = await authenticateRequest(req, ['TRANSPORTER', 'ADMIN']);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json().catch(() => ({}));
    const isOnline = Boolean(body.availability ?? body.isOnline ?? true);

    const { data: dbUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('firebase_uid', user!.uid)
      .maybeSingle();

    if (dbUser) {
      await supabaseAdmin
        .from('transporter_profiles')
        .update({
          availability: isOnline,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', dbUser.id);
    }

    return NextResponse.json({
      success: true,
      availability: isOnline,
      message: isOnline ? 'ड्यूटी ऑन (Online: Accepting Jobs)' : 'ड्यूटी ऑफ (Offline: Paused)',
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
