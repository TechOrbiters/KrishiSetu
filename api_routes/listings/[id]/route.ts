import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const listingId = params.id;
    if (!listingId) {
      return NextResponse.json({ success: false, error: 'Listing ID is required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('produce_listings')
      .select('*')
      .eq('id', listingId)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ success: false, error: 'Listing not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, listing: data, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, errorResponse } = await authenticateRequest(req, ['FARMER', 'FARMER_FPO', 'FPO_ADMIN', 'ADMIN']);
  if (errorResponse) return errorResponse;

  try {
    const listingId = params.id;
    if (!listingId) {
      return NextResponse.json({ success: false, error: 'Listing ID is required' }, { status: 400 });
    }

    // Resolve user UUID from Supabase `users` table matching Firebase UID
    let dbUserId = user!.uid;
    const { data: dbUserData } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('firebase_uid', user!.uid)
      .maybeSingle();

    if (dbUserData?.id) {
      dbUserId = dbUserData.id;
    }

    // Check existing listing from canonical `produce_listings` table
    const { data: existing, error: fetchErr } = await supabaseAdmin
      .from('produce_listings')
      .select('*')
      .eq('id', listingId)
      .maybeSingle();

    if (fetchErr || !existing) {
      return NextResponse.json({ success: false, error: 'Listing not found' }, { status: 404 });
    }

    // Ownership check: must match farmer_id or be ADMIN
    const isOwner = existing.farmer_id === user!.uid || existing.farmer_id === dbUserId;
    const isAdmin = user!.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return NextResponse.json({
        success: false,
        error: 'Forbidden: You do not own this produce listing',
      }, { status: 403 });
    }

    const body = await req.json();
    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (body.crop_name !== undefined) updatePayload.crop_name = String(body.crop_name).trim();
    if (body.category !== undefined) updatePayload.category = body.category;
    if (body.grade !== undefined) updatePayload.grade = body.grade;
    if (body.status !== undefined) {
      let st = String(body.status).toUpperCase();
      if (st === 'PAUSED') st = 'INACTIVE';
      updatePayload.status = st;
    }
    if (body.location_name !== undefined) updatePayload.location_name = body.location_name;
    if (body.harvest_date !== undefined) updatePayload.harvest_date = body.harvest_date;
    if (body.shelf_life_days !== undefined) {
      const s = Number(body.shelf_life_days);
      if (!isNaN(s) && s > 0) updatePayload.shelf_life_days = s;
    }
    if (body.images !== undefined) {
      updatePayload.images = Array.isArray(body.images) ? body.images : [body.images];
    }

    if (body.quantity !== undefined || body.total_quantity !== undefined || body.quantityKg !== undefined) {
      const q = Number(body.quantity ?? body.total_quantity ?? body.quantityKg);
      if (isNaN(q) || q <= 0) {
        return NextResponse.json({ success: false, error: 'Quantity must be a positive number greater than 0' }, { status: 400 });
      }
      updatePayload.total_quantity = q;
      updatePayload.available_quantity = q;
    }

    if (body.price_per_kg !== undefined || body.askingPricePerKg !== undefined) {
      const p = Number(body.price_per_kg ?? body.askingPricePerKg);
      if (isNaN(p) || p <= 0) {
        return NextResponse.json({ success: false, error: 'Price per kg must be a positive number greater than 0' }, { status: 400 });
      }
      updatePayload.price_per_kg = p;
    }

    const { data: updated, error: updateErr } = await supabaseAdmin
      .from('produce_listings')
      .update(updatePayload)
      .eq('id', listingId)
      .select()
      .single();

    if (updateErr || !updated) {
      return NextResponse.json({
        success: false,
        error: updateErr?.message || 'Failed to update produce listing',
      }, { status: 500 });
    }

    return NextResponse.json({ success: true, listing: updated, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, errorResponse } = await authenticateRequest(req, ['FARMER', 'FARMER_FPO', 'FPO_ADMIN', 'ADMIN']);
  if (errorResponse) return errorResponse;

  try {
    const listingId = params.id;
    if (!listingId) {
      return NextResponse.json({ success: false, error: 'Listing ID is required' }, { status: 400 });
    }

    let dbUserId = user!.uid;
    const { data: dbUserData } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('firebase_uid', user!.uid)
      .maybeSingle();

    if (dbUserData?.id) {
      dbUserId = dbUserData.id;
    }

    // Check existing listing from canonical `produce_listings` table
    const { data: existing, error: fetchErr } = await supabaseAdmin
      .from('produce_listings')
      .select('*')
      .eq('id', listingId)
      .maybeSingle();

    if (fetchErr || !existing) {
      return NextResponse.json({ success: false, error: 'Listing not found' }, { status: 404 });
    }

    // Ownership check: must match farmer_id or be ADMIN
    const isOwner = existing.farmer_id === user!.uid || existing.farmer_id === dbUserId;
    const isAdmin = user!.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return NextResponse.json({
        success: false,
        error: 'Forbidden: You do not own this produce listing',
      }, { status: 403 });
    }

    const { error: deleteErr } = await supabaseAdmin
      .from('produce_listings')
      .delete()
      .eq('id', listingId);

    if (deleteErr) {
      return NextResponse.json({
        success: false,
        error: deleteErr.message || 'Failed to delete produce listing',
      }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Produce listing deleted successfully' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
