import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/auth/otp/send
 * DEPRECATED: OTP system removed. Direct login is supported via /api/auth/login.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { phone } = body;

    const cleaned = phone ? String(phone).replace(/\D/g, '').slice(-10) : '';

    return NextResponse.json({
      success: true,
      message: 'OTP प्रणाली हटा दी गई है। आप सीधे मोबाइल नंबर से लॉगिन कर सकते हैं (OTP is not required, login directly).',
      phone: cleaned,
      directAuthAvailable: true,
    });
  } catch (err: any) {
    return NextResponse.json({ success: true, directAuthAvailable: true });
  }
}
