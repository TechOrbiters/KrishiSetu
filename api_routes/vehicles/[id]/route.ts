import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * PATCH /api/vehicles/[id]
 * Updates vehicle details or toggles active status.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, errorResponse } = await authenticateRequest(req, ['TRANSPORTER', 'ADMIN']);
  if (errorResponse) return errorResponse;

  try {
    const vehicleId = params.id;
    const body = await req.json();

    const { data: dbUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('firebase_uid', user!.uid)
      .maybeSingle();

    const transporterId = dbUser?.id || user!.uid;

    const updates: any = { updated_at: new Date().toISOString() };
    if (body.vehicle_type) updates.vehicle_type = body.vehicle_type;
    if (body.model) updates.model = body.model;
    if (body.capacity_kg !== undefined) updates.capacity_kg = Number(body.capacity_kg);
    if (body.is_active !== undefined) updates.is_active = Boolean(body.is_active);

    const { data: updated, error: updateErr } = await supabaseAdmin
      .from('vehicles')
      .update(updates)
      .eq('id', vehicleId)
      .eq('transporter_id', transporterId)
      .select()
      .maybeSingle();

    if (updateErr) {
      return NextResponse.json({ success: false, error: updateErr.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'वाहन विवरण अपडेट किया गया (Vehicle updated successfully)',
      vehicle: updated,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * DELETE /api/vehicles/[id]
 * Deactivates vehicle (soft delete).
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, errorResponse } = await authenticateRequest(req, ['TRANSPORTER', 'ADMIN']);
  if (errorResponse) return errorResponse;

  try {
    const vehicleId = params.id;

    const { data: dbUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('firebase_uid', user!.uid)
      .maybeSingle();

    const transporterId = dbUser?.id || user!.uid;

    await supabaseAdmin
      .from('vehicles')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', vehicleId)
      .eq('transporter_id', transporterId);

    return NextResponse.json({
      success: true,
      message: 'वाहन सफलतापूर्वक हटाया गया (Vehicle deactivated)',
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
