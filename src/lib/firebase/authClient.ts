import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  UserCredential,
} from 'firebase/auth';
import { firebaseAuth } from './client';

export function setupRecaptcha(containerId: string): RecaptchaVerifier {
  if (typeof window === 'undefined' || !firebaseAuth) {
    throw new Error('RecaptchaVerifier can only be initialized in the browser.');
  }

  // Window recaptcha instance caching
  if ((window as any).recaptchaVerifier) {
    return (window as any).recaptchaVerifier;
  }

  const verifier = new RecaptchaVerifier(firebaseAuth, containerId, {
    size: 'invisible',
    callback: () => {
      console.log('Recaptcha resolved successfully');
    },
    'expired-callback': () => {
      console.warn('Recaptcha expired');
    },
  });

  (window as any).recaptchaVerifier = verifier;
  return verifier;
}

export async function sendPhoneOtp(
  phoneNumber: string,
  verifier: RecaptchaVerifier
): Promise<ConfirmationResult> {
  if (!phoneNumber.startsWith('+')) {
    phoneNumber = `+91${phoneNumber}`;
  }
  const confirmationResult = await signInWithPhoneNumber(firebaseAuth, phoneNumber, verifier);
  return confirmationResult;
}

export async function verifyOtpCode(
  confirmationResult: ConfirmationResult,
  otpCode: string
): Promise<UserCredential> {
  const credential = await confirmationResult.confirm(otpCode);
  return credential;
}

export async function getFirebaseBearerToken(): Promise<string | null> {
  if (!firebaseAuth || !firebaseAuth.currentUser) return null;
  return await firebaseAuth.currentUser.getIdToken();
}
