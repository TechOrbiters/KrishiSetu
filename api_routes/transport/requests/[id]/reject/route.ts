import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, errorResponse } = await authenticateRequest(req);
  if (errorResponse) return errorResponse;

  try {
    const requestId = params.id;
    if (!requestId) {
      return NextResponse.json({ success: false, error: 'Transport request ID is required' }, { status: 400 });
    }

    const { data: updatedReq, error } = await supabaseAdmin
      .from('transport_requests')
      .update({
        status: 'REJECTED',
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId)
      .select()
      .maybeSingle();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Transport request rejected successfully',
      request: updatedReq,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
