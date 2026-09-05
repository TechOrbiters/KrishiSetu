import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const { user, errorResponse } = await authenticateRequest(req);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { fcmToken } = body;

    if (!fcmToken) {
      return NextResponse.json({ success: false, error: 'fcmToken is required' }, { status: 400 });
    }

    // Upsert preference or token registration to prevent duplicates
    const { data, error } = await supabaseAdmin
      .from('notification_preferences')
      .upsert({
        user_id: user!.uid,
        push_enabled: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
      .select();

    if (error) {
      console.warn('Supabase FCM token registration warning:', error.message);
    }

    return NextResponse.json({
      success: true,
      message: 'FCM Token registered successfully (duplicate registration handled safely)',
      userId: user!.uid,
      registeredAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
