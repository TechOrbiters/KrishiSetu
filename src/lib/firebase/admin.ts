import { getApps, initializeApp, cert, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getDatabase } from 'firebase-admin/database';
import { getMessaging } from 'firebase-admin/messaging';

let adminApp: App | undefined;

const projectId = process.env.FIREBASE_PROJECT_ID || 'kisaan-setu-7d74b';
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
function parsePrivateKey(key?: string): string | undefined {
  if (!key) return undefined;
  let cleaned = key.trim();
  if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
    cleaned = cleaned.slice(1, -1);
  }
  return cleaned.replace(/\\n/g, '\n');
}

const privateKey = parsePrivateKey(process.env.FIREBASE_PRIVATE_KEY);
const databaseURL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || `https://${projectId}-default-rtdb.firebaseio.com`;

if (getApps().length === 0) {
  if (privateKey && clientEmail && projectId) {
    try {
      adminApp = initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
        databaseURL,
      });
      console.log('Firebase Admin SDK initialized successfully with project:', projectId);
    } catch (error: any) {
      console.warn('Firebase Admin SDK initialization skipped:', error.message);
    }
  } else {
    console.warn('Firebase Admin credentials incomplete in env. Running in fallback/demo mode.');
  }
} else {
  adminApp = getApps()[0];
}

export const adminAuth = adminApp ? getAuth(adminApp) : null;
export const adminRtdb = adminApp ? getDatabase(adminApp) : null;
export const adminMessaging = adminApp ? getMessaging(adminApp) : null;

export function formatE164Phone(phoneNumber: string): string {
  const digits = phoneNumber.replace(/\D/g, '');
  if (digits.length === 10) {
    return `+91${digits}`;
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+${digits}`;
  }
  return `+${digits}`;
}

export async function createOrGetFirebaseUser(phoneNumber: string, displayName?: string) {
  const formattedPhone = formatE164Phone(phoneNumber);

  if (!adminAuth) {
    return {
      uid: `usr_${formattedPhone.replace(/\D/g, '').slice(-10)}`,
      phoneNumber: formattedPhone,
      displayName,
    };
  }

  try {
    const existing = await adminAuth.getUserByPhoneNumber(formattedPhone);
    if (displayName && existing.displayName !== displayName) {
      await adminAuth.updateUser(existing.uid, { displayName });
    }
    return existing;
  } catch (err: any) {
    if (err.code === 'auth/user-not-found') {
      const newUser = await adminAuth.createUser({
        phoneNumber: formattedPhone,
        displayName: displayName || 'Kisan User',
      });
      return newUser;
    }
    throw err;
  }
}

export async function createFirebaseCustomToken(uid: string, claims: Record<string, any> = {}) {
  if (!adminAuth) {
    return `demo_token_${claims.role ? claims.role.toLowerCase() : 'farmer'}`;
  }
  return await adminAuth.createCustomToken(uid, claims);
}

export async function verifyFirebaseIdToken(token: string) {
  if (!token) throw new Error('Unauthorized: Authorization token missing');
  
  // Demo mode fallback if token starts with demo prefix or admin SDK is unconfigured
  if (token.startsWith('demo_token_')) {
    const suffix = token.replace('demo_token_', '');
    const role = suffix.includes('admin') ? 'ADMIN' : suffix.includes('farmer') ? 'FARMER' : suffix.includes('buyer') ? 'BUYER' : suffix.includes('transporter') ? 'TRANSPORTER' : 'FARMER';
    return {
      uid: `demo_uid_${suffix}`,
      phone_number: '+919876543210',
      role,
      isDemo: true,
    };
  }

  if (!adminAuth) {
    // In fallback mode without Firebase Admin private key, non-demo tokens are rejected
    throw new Error('Unauthorized: Invalid or expired Firebase ID token');
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    return decodedToken;
  } catch (err: any) {
    console.error('Failed to verify Firebase ID Token:', err.message);
    throw new Error('Unauthorized: Invalid or expired Firebase ID token');
  }
}
