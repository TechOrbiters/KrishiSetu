import { NextRequest, NextResponse } from 'next/server';
import { verifyFirebaseToken } from './firebaseAdmin';

export type UserRole = 'FARMER' | 'BUYER' | 'TRANSPORTER' | 'FPO_ADMIN' | 'FARMER_FPO' | 'ADMIN';

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
    const role: UserRole = (decoded as any).role || 'FARMER_FPO';
    const user: AuthenticatedUser = {
      uid: decoded.uid,
      phone: decoded.phone_number || '+910000000000',
      role,
      isDemo: (decoded as any).isDemo,
    };

    if (allowedRoles && allowedRoles.length > 0) {
      const isAllowed = allowedRoles.includes(role) || 
        (allowedRoles.includes('FARMER') && (role === 'FARMER_FPO' || role === 'FARMER')) ||
        (allowedRoles.includes('FARMER_FPO') && (role === 'FARMER' || role === 'FARMER_FPO'));
        
      if (!isAllowed) {
        return {
          errorResponse: NextResponse.json(
            { success: false, error: `Forbidden: Role '${role}' is not authorized for this endpoint` },
            { status: 403 }
          ),
        };
      }
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
