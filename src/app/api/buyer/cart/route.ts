import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * GET /api/buyer/cart
 * Returns the persistent shopping cart items for the buyer, validated against active stock.
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
      return NextResponse.json({ success: true, items: [] });
    }

    const { data: cartRows, error } = await supabaseAdmin
      .from('buyer_cart_items')
      .select('id, listing_id, quantity_kg, updated_at, produce_listings(*)')
      .eq('buyer_id', dbUser.id)
      .order('updated_at', { ascending: false });

    if (error) {
      return NextResponse.json({ success: true, items: [] });
    }

    const items = (cartRows || []).map((row: any) => {
      const listing = row.produce_listings;
      const availableKg = listing ? Number(listing.available_quantity || 0) : 0;
      const isStockSufficient = availableKg >= Number(row.quantity_kg);
      return {
        id: row.id,
        listingId: row.listing_id,
        quantityKg: Number(row.quantity_kg),
        availableStockKg: availableKg,
        isStockSufficient,
        listing,
      };
    });

    return NextResponse.json({ success: true, items });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * POST /api/buyer/cart
 * Upserts an item into the buyer's persistent cart after validating stock.
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
    const { listing_id, quantity_kg } = body;

    if (!listing_id || !quantity_kg || Number(quantity_kg) <= 0) {
      return NextResponse.json({ success: false, error: 'Valid listing_id and positive quantity_kg required' }, { status: 400 });
    }

    // Validate listing existence and available stock
    const { data: listing, error: listingErr } = await supabaseAdmin
      .from('produce_listings')
      .select('id, available_quantity, min_order_quantity, status')
      .eq('id', listing_id)
      .single();

    if (listingErr || !listing) {
      return NextResponse.json({ success: false, error: 'Listing not found' }, { status: 404 });
    }

    if (listing.status !== 'ACTIVE') {
      return NextResponse.json({ success: false, error: `Listing is not active (${listing.status})` }, { status: 400 });
    }

    const requestedQty = Number(quantity_kg);
    if (requestedQty > Number(listing.available_quantity)) {
      return NextResponse.json(
        {
          success: false,
          error: `Requested quantity (${requestedQty} kg) exceeds available stock (${listing.available_quantity} kg)`,
        },
        { status: 409 }
      );
    }

    const { data: cartItem, error } = await supabaseAdmin
      .from('buyer_cart_items')
      .upsert(
        {
          buyer_id: dbUser.id,
          listing_id,
          quantity_kg: requestedQty,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'buyer_id,listing_id' }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, item: cartItem });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * DELETE /api/buyer/cart
 * Clears all items in the buyer's persistent cart.
 */
export async function DELETE(req: NextRequest) {
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

    await supabaseAdmin
      .from('buyer_cart_items')
      .delete()
      .eq('buyer_id', dbUser.id);

    return NextResponse.json({ success: true, message: 'Cart cleared' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
