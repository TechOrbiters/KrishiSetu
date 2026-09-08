import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, errorResponse } = await authenticateRequest(req);
  if (errorResponse) return errorResponse;

  try {
    const notificationId = params.id;
    if (!notificationId) {
      return NextResponse.json({ success: false, error: 'Notification ID is required' }, { status: 400 });
    }

    const { data: updated, error } = await supabaseAdmin
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .select()
      .maybeSingle();

    if (error || !updated) {
      return NextResponse.json({ success: false, error: error?.message || 'Notification not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      notification: updated,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
