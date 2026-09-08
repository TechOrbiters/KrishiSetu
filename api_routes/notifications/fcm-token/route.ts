import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';
import { registerUserFcmToken } from '@/lib/notifications/service';

export async function POST(req: NextRequest) {
  const { user, errorResponse } = await authenticateRequest(req);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { fcm_token, device_info } = body;

    if (!fcm_token) {
      return NextResponse.json({ success: false, error: 'fcm_token is required' }, { status: 400 });
    }

    const { data: dbUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('firebase_uid', user!.uid)
      .maybeSingle();

    const userId = dbUser?.id || user!.uid;

    const registered = await registerUserFcmToken(userId, fcm_token, device_info || 'Web Browser');

    if (!registered) {
      return NextResponse.json({ success: false, error: 'Failed to register FCM token' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'FCM device token registered successfully',
      userId,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
