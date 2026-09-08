import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware';

/**
 * POST /api/transport/requests/[id]/decline
 * Allows a transporter to decline or skip an available job offer.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, errorResponse } = await authenticateRequest(req, ['TRANSPORTER', 'ADMIN']);
  if (errorResponse) return errorResponse;

  try {
    const requestId = params.id;
    return NextResponse.json({
      success: true,
      message: 'डिलीवरी अनुरोध अस्वीकार किया गया (Job declined)',
      requestId,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
