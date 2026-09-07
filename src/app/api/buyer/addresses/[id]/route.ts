import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * PATCH /api/buyer/addresses/[id]
 * Updates an address owned by the authenticated buyer.
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
    const { full_name, phone, address_line1, address_line2, landmark, city, district, state, pincode, is_default } = body;

    // Verify ownership
    const { data: existing } = await supabaseAdmin
      .from('buyer_addresses')
      .select('*')
      .eq('id', params.id)
      .eq('buyer_id', dbUser.id)
      .maybeSingle();

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Address not found or unauthorized' }, { status: 404 });
    }

    if (is_default) {
      await supabaseAdmin
        .from('buyer_addresses')
        .update({ is_default: false })
        .eq('buyer_id', dbUser.id);
    }

    const updates: any = {};
    if (full_name !== undefined) updates.full_name = full_name;
    if (phone !== undefined) updates.phone = phone;
    if (address_line1 !== undefined) updates.address_line1 = address_line1;
    if (address_line2 !== undefined) updates.address_line2 = address_line2;
    if (landmark !== undefined) updates.landmark = landmark;
    if (city !== undefined) updates.city = city;
    if (district !== undefined) updates.district = district;
    if (state !== undefined) updates.state = state;
    if (pincode !== undefined) updates.pincode = pincode;
    if (is_default !== undefined) updates.is_default = is_default;

    const { data: updated, error } = await supabaseAdmin
      .from('buyer_addresses')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, address: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * DELETE /api/buyer/addresses/[id]
 * Deletes an address owned by the authenticated buyer.
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
      .from('buyer_addresses')
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
