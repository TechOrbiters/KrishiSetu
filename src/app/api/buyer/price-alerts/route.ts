import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * GET /api/buyer/price-alerts
 * Returns price alerts set by the authenticated buyer.
 */
export async function GET(req: NextRequest) {
  const { user, errorResponse } = await authenticateRequest(req, ['BUYER', 'ADMIN']);
  if (errorResponse) return errorResponse;

  try {
    const { data: dbUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('firebase_uid', user!.uid)
      .maybeSingle();

    if (!dbUser) {
      return NextResponse.json({ success: true, alerts: [] });
    }

    const { data: alerts, error } = await supabaseAdmin
      .from('price_alerts')
      .select('*')
      .eq('buyer_id', dbUser.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ success: true, alerts: [] });
    }

    return NextResponse.json({ success: true, alerts: alerts || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * POST /api/buyer/price-alerts
 * Creates a new price threshold alert.
 */
export async function POST(req: NextRequest) {
  const { user, errorResponse } = await authenticateRequest(req, ['BUYER', 'ADMIN']);
  if (errorResponse) return errorResponse;

  try {
    const { data: dbUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('firebase_uid', user!.uid)
      .maybeSingle();

    if (!dbUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const { commodity, target_price, condition, district } = body;

    if (!commodity || !target_price) {
      return NextResponse.json({ success: false, error: 'commodity and target_price are required' }, { status: 400 });
    }

    const { data: alert, error } = await supabaseAdmin
      .from('price_alerts')
      .insert({
        buyer_id: dbUser.id,
        commodity,
        target_price: Number(target_price),
        condition: condition || 'BELOW',
        district: district || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, alert }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
