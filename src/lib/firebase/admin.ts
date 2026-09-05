import { getApps, initializeApp, cert, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getDatabase } from 'firebase-admin/database';
import { getMessaging } from 'firebase-admin/messaging';

let adminApp: App | undefined;

const projectId = process.env.FIREBASE_PROJECT_ID || 'kisaan-setu-7d74b';
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const databaseURL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || `https://${projectId}-default-rtdb.firebaseio.com`;

if (getApps().length === 0) {
  if (privateKey && clientEmail && projectId) {
    try {
      adminApp = initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
        databaseURL,
      });
    } catch (error) {
      console.warn('Firebase Admin SDK initialization skipped (using fallback/demo mode).');
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

export async function verifyFirebaseIdToken(token: string) {
  if (!token) throw new Error('Unauthorized: Authorization token missing');
  
  // Demo mode fallback if token starts with demo prefix or admin SDK is unconfigured
  if (token.startsWith('demo_token_')) {
    const role = token.includes('farmer') ? 'FARMER' : token.includes('buyer') ? 'BUYER' : token.includes('transporter') ? 'TRANSPORTER' : 'FARMER';
    return {
      uid: token.includes('unknown') ? 'demo_uid_unknown_999' : `demo_uid_${role.toLowerCase()}`,
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
