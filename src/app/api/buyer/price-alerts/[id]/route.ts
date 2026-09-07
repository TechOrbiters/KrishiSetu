import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * PATCH /api/buyer/price-alerts/[id]
 * Toggles or updates a price alert.
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
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
    const { is_active, target_price, condition } = body;

    const updates: any = {};
    if (is_active !== undefined) updates.is_active = is_active;
    if (target_price !== undefined) updates.target_price = Number(target_price);
    if (condition !== undefined) updates.condition = condition;

    const { data: alert, error } = await supabaseAdmin
      .from('price_alerts')
      .update(updates)
      .eq('id', params.id)
      .eq('buyer_id', dbUser.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, alert });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * DELETE /api/buyer/price-alerts/[id]
 * Deletes a price alert.
 */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
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

    const { error } = await supabaseAdmin
      .from('price_alerts')
      .delete()
      .eq('id', params.id)
      .eq('buyer_id', dbUser.id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
