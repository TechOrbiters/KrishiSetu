import { NextRequest, NextResponse } from 'next/server';
import { verifyFirebaseToken } from './firebaseAdmin';

export type UserRole = 'FARMER' | 'BUYER' | 'TRANSPORTER' | 'FPO_ADMIN';

export interface AuthenticatedUser {
  uid: string;
  phone: string;
  role: UserRole;
  isDemo?: boolean;
}

export async function authenticateRequest(req: NextRequest, allowedRoles?: UserRole[]): Promise<{ user?: AuthenticatedUser; errorResponse?: NextResponse }> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      errorResponse: NextResponse.json(
        { success: false, error: 'Unauthorized: Missing or malformed Bearer token' },
        { status: 401 }
      ),
    };
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decoded = await verifyFirebaseToken(token);
    const user: AuthenticatedUser = {
      uid: decoded.uid,
      phone: decoded.phone_number || '+910000000000',
      role: (decoded as any).role || 'FARMER',
      isDemo: (decoded as any).isDemo,
    };

    if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      return {
        errorResponse: NextResponse.json(
          { success: false, error: `Forbidden: Role '${user.role}' is not authorized for this endpoint` },
          { status: 403 }
        ),
      };
    }

    return { user };
  } catch (error: any) {
    return {
      errorResponse: NextResponse.json(
        { success: false, error: error.message || 'Unauthorized' },
        { status: 401 }
      ),
    };
  }
}
