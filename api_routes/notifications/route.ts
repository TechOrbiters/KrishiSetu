import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';
import { sendDomainNotification, resolveDbUserId } from '@/lib/notifications/service';

export async function GET(req: NextRequest) {
  const { user, errorResponse } = await authenticateRequest(req);
  if (errorResponse) return errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const isReadParam = searchParams.get('is_read');

    // Resolve DB User UUID
    const userId = await resolveDbUserId(user!.uid);
    if (!userId) {
      return NextResponse.json({ success: true, notifications: [] });
    }

    let query = supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (isReadParam !== null) {
      query = query.eq('is_read', isReadParam === 'true');
    }

    const { data: notifications, error } = await query;

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const mappedNotifs = (notifications || []).map((n: any) => {
      let eventType = n.event_type;
      if (!eventType && n.link_url) {
        const match = n.link_url.match(/evt=([A-Z_]+)/);
        if (match) eventType = match[1];
      }
      return {
        ...n,
        event_type: eventType || 'ORDER_CREATED',
      };
    });

    return NextResponse.json({
      success: true,
      notifications: mappedNotifs,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { user, errorResponse } = await authenticateRequest(req);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { userId, eventType, title, message, linkUrl, idempotencyKey } = body;

    const result = await sendDomainNotification({
      userId: userId || user!.uid,
      eventType: eventType || 'ORDER_CREATED',
      title: title || 'सूचना',
      message: message || 'आपकी सूचना प्राप्त हुई',
      linkUrl,
      idempotencyKey,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
