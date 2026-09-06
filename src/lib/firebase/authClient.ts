import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInWithCustomToken,
  signOut,
  ConfirmationResult,
  UserCredential,
} from 'firebase/auth';
import { firebaseAuth } from './client';

export const FIREBASE_TEST_TOKEN =
  'AVweKoiF_iRGj-JuIrRCfPl1ivXM-4CvEZxi_WOuLwsJMRTK6Vfzq2Qz-UaBxqKpxcez6pw03uCYDxsiVehuBBkDlyVEfQOtGtjn7UNObKNEixsga8rVt0Fa_bkKnJ-wwr6csIYpLiZZ9bj5PUadLrqMtg';

export function setupRecaptcha(containerId: string): RecaptchaVerifier {
  if (typeof window === 'undefined' || !firebaseAuth) {
    throw new Error('RecaptchaVerifier can only be initialized in the browser.');
  }

  // Clear existing recaptcha instance if present to avoid re-rendering errors
  if ((window as any).recaptchaVerifier) {
    try {
      (window as any).recaptchaVerifier.clear();
    } catch (e) {
      console.warn('Clearing old recaptcha verifier:', e);
    }
    (window as any).recaptchaVerifier = null;
  }

  const verifier = new RecaptchaVerifier(firebaseAuth, containerId, {
    size: 'invisible',
    callback: () => {
      console.log('Firebase Recaptcha verified successfully');
    },
    'expired-callback': () => {
      console.warn('Firebase Recaptcha expired');
    },
  });

  (window as any).recaptchaVerifier = verifier;
  return verifier;
}

export function resetRecaptcha(): void {
  if (typeof window !== 'undefined' && (window as any).recaptchaVerifier) {
    try {
      (window as any).recaptchaVerifier.clear();
    } catch (e) {
      console.warn('Error resetting recaptcha verifier:', e);
    }
    (window as any).recaptchaVerifier = null;
  }
}

export async function sendPhoneOtp(
  phoneNumber: string,
  verifier: RecaptchaVerifier
): Promise<ConfirmationResult> {
  let cleaned = phoneNumber.replace(/\D/g, '');
  if (cleaned.length === 10) {
    cleaned = `+91${cleaned}`;
  } else if (!phoneNumber.startsWith('+')) {
    cleaned = `+${cleaned}`;
  } else {
    cleaned = phoneNumber;
  }

  const confirmationResult = await signInWithPhoneNumber(firebaseAuth, cleaned, verifier);
  return confirmationResult;
}

export async function verifyOtpCode(
  confirmationResult: ConfirmationResult,
  otpCode: string
): Promise<UserCredential> {
  const credential = await confirmationResult.confirm(otpCode);
  return credential;
}

export async function authenticateWithCustomToken(customToken: string): Promise<UserCredential | null> {
  if (typeof window === 'undefined' || !firebaseAuth) {
    console.warn('Firebase Auth is not available in current execution context.');
    return null;
  }
  return await signInWithCustomToken(firebaseAuth, customToken);
}

export async function requestPhoneOtp(
  phone: string,
  fullName?: string,
  role: string = 'FARMER',
  options?: { recaptchaToken?: string; testToken?: string }
) {
  const res = await fetch('/api/auth/otp/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone,
      fullName,
      role,
      recaptchaToken: options?.recaptchaToken || options?.testToken || FIREBASE_TEST_TOKEN,
      testToken: options?.testToken || FIREBASE_TEST_TOKEN,
    }),
  });
  return await res.json();
}

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
  const res = await fetch('/api/auth/otp/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...payload,
      testToken: payload.testToken || FIREBASE_TEST_TOKEN,
    }),
  });
  const json = await res.json();
  if (json.success && json.customToken) {
    // Authenticate browser client directly into Firebase Auth
    try {
      await authenticateWithCustomToken(json.customToken);
    } catch (e: any) {
      console.warn('Browser customToken signIn warning:', e.message);
    }
  }
  return json;
}

export async function getFirebaseBearerToken(): Promise<string | null> {
  if (!firebaseAuth || !firebaseAuth.currentUser) return null;
  return await firebaseAuth.currentUser.getIdToken(true);
}

export async function logoutFirebase(): Promise<void> {
  if (typeof window !== 'undefined' && firebaseAuth && firebaseAuth.signOut) {
    await signOut(firebaseAuth);
  }
  resetRecaptcha();
}
