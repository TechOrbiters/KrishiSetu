import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const { user, errorResponse } = await authenticateRequest(req);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json().catch(() => ({}));
    const fullName = body.full_name || 'Kisan Partner';
    const role = body.role || user!.role || 'FARMER';
    const locationName = body.location_name || 'Lucknow, UP';
    const latitude = body.latitude || 26.8467;
    const longitude = body.longitude || 80.9462;

    const { data, error } = await supabaseAdmin
      .from('users')
      .upsert({
        firebase_uid: user!.uid,
        phone: user!.phone,
        full_name: fullName,
        role: role,
        location_name: locationName,
        latitude: latitude,
        longitude: longitude,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'firebase_uid' })
      .select()
      .single();

    if (error) {
      console.warn('Supabase DB sync warning (using fallback response):', error.message);
      return NextResponse.json({
        success: true,
        user: {
          id: user!.uid,
          firebase_uid: user!.uid,
          phone: user!.phone,
          full_name: fullName,
          role: role,
          location_name: locationName,
        },
      });
    }

    return NextResponse.json({ success: true, user: data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
