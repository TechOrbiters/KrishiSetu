import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * PATCH /api/buyer/cart/[id]
 * Updates quantity of a specific cart item after revalidating against live stock.
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
    const { quantity_kg } = body;

    const newQty = Number(quantity_kg);
    if (!newQty || newQty <= 0) {
      // If 0 or negative, delete item
      await supabaseAdmin
        .from('buyer_cart_items')
        .delete()
        .eq('id', params.id)
        .eq('buyer_id', dbUser.id);
      return NextResponse.json({ success: true, deleted: true });
    }

    // Get cart item and listing
    const { data: cartItem } = await supabaseAdmin
      .from('buyer_cart_items')
      .select('*, produce_listings(*)')
      .eq('id', params.id)
      .eq('buyer_id', dbUser.id)
      .single();

    if (!cartItem) {
      return NextResponse.json({ success: false, error: 'Cart item not found' }, { status: 404 });
    }

    const availableStock = Number(cartItem.produce_listings?.available_quantity || 0);
    if (newQty > availableStock) {
      return NextResponse.json(
        {
          success: false,
          error: `Requested quantity (${newQty} kg) exceeds available stock (${availableStock} kg)`,
        },
        { status: 409 }
      );
    }

    const { data: updated, error } = await supabaseAdmin
      .from('buyer_cart_items')
      .update({
        quantity_kg: newQty,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, item: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * DELETE /api/buyer/cart/[id]
 * Removes a specific item from the buyer's cart.
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
      .from('buyer_cart_items')
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
