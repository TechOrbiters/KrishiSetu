import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * GET /api/buyer/saved
 * Returns saved produce listings for the authenticated buyer.
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
      return NextResponse.json({ success: true, saved: [] });
    }

    const { data: savedItems, error } = await supabaseAdmin
      .from('saved_listings')
      .select('id, listing_id, created_at, produce_listings(*)')
      .eq('buyer_id', dbUser.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ success: true, saved: [] });
    }

    return NextResponse.json({ success: true, saved: savedItems || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * POST /api/buyer/saved
 * Bookmarks a produce listing for the authenticated buyer.
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
    const { listing_id } = body;

    if (!listing_id) {
      return NextResponse.json({ success: false, error: 'listing_id is required' }, { status: 400 });
    }

    const { data: saved, error } = await supabaseAdmin
      .from('saved_listings')
      .upsert(
        {
          buyer_id: dbUser.id,
          listing_id,
        },
        { onConflict: 'buyer_id,listing_id' }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, saved });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
