import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * GET /api/buyer/addresses
 * Returns saved addresses for the authenticated buyer.
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
      return NextResponse.json({ success: true, addresses: [] });
    }

    const { data: addresses, error } = await supabaseAdmin
      .from('buyer_addresses')
      .select('*')
      .eq('buyer_id', dbUser.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ success: true, addresses: [] });
    }

    return NextResponse.json({ success: true, addresses: addresses || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * POST /api/buyer/addresses
 * Adds a new delivery address for the authenticated buyer.
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
    const { full_name, phone, address_line1, address_line2, landmark, city, district, state, pincode, is_default } = body;

    if (!full_name || !phone || !address_line1 || !district || !pincode) {
      return NextResponse.json(
        { success: false, error: 'Missing required address fields (full_name, phone, address_line1, district, pincode)' },
        { status: 400 }
      );
    }

    // If setting as default, unset previous defaults
    if (is_default) {
      await supabaseAdmin
        .from('buyer_addresses')
        .update({ is_default: false })
        .eq('buyer_id', dbUser.id);
    }

    const { data: address, error } = await supabaseAdmin
      .from('buyer_addresses')
      .insert({
        buyer_id: dbUser.id,
        full_name,
        phone,
        address_line1,
        address_line2: address_line2 || '',
        landmark: landmark || '',
        city: city || district,
        district,
        state: state || 'Uttar Pradesh',
        pincode,
        is_default: !!is_default,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, address }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
