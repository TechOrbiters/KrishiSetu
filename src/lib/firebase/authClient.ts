import {
  signInWithCustomToken,
  signOut,
  UserCredential,
} from 'firebase/auth';
import { firebaseAuth } from './client';

/**
 * Signs in the browser Firebase client with a signed Custom Token
 * issued by the server-side Firebase Admin SDK.
 */
export async function authenticateWithCustomToken(customToken: string): Promise<UserCredential | null> {
  if (typeof window === 'undefined' || !firebaseAuth) {
    console.warn('Firebase Auth is not available in current execution context.');
    return null;
  }
  return await signInWithCustomToken(firebaseAuth, customToken);
}

/**
 * Direct phone-based authentication without OTP.
 * Communicates with POST /api/auth/login and authenticates the browser client.
 */
export async function directPhoneAuth(payload: {
  phone: string;
  fullName?: string;
  role?: string;
  village?: string;
  district?: string;
  state?: string;
  aadhaarLast4?: string;
}) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (json.success && json.customToken) {
    try {
      await authenticateWithCustomToken(json.customToken);
    } catch (e: any) {
      console.warn('Browser customToken signIn warning:', e.message);
    }
  }
  return json;
}

/**
 * Backward compatibility alias for directPhoneAuth.
 */
export async function verifyPhoneOtpAndRegister(payload: {
  phone: string;
  otp?: string;
  testToken?: string;
  verificationToken?: string;
  sessionInfo?: string;
  fullName?: string;
  role?: string;
  village?: string;
  district?: string;
  state?: string;
  aadhaarLast4?: string;
}) {
  return await directPhoneAuth(payload);
}

/**
 * Retrieves the signed Firebase ID Token for authenticated requests.
 */
export async function getFirebaseBearerToken(): Promise<string | null> {
  if (!firebaseAuth || !firebaseAuth.currentUser) return null;
  return await firebaseAuth.currentUser.getIdToken(true);
}

/**
 * Logs out the Firebase user from the browser.
 */
export async function logoutFirebase(): Promise<void> {
  if (typeof window !== 'undefined' && firebaseAuth && firebaseAuth.signOut) {
    await signOut(firebaseAuth);
  }
}
