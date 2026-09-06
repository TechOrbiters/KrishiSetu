/**
 * KRISHISETU — In-Memory / Cached OTP Store with 5-minute TTL & Firebase Phone Verification
 */

export const FIREBASE_TEST_TOKEN =
  'AVweKoiF_iRGj-JuIrRCfPl1ivXM-4CvEZxi_WOuLwsJMRTK6Vfzq2Qz-UaBxqKpxcez6pw03uCYDxsiVehuBBkDlyVEfQOtGtjn7UNObKNEixsga8rVt0Fa_bkKnJ-wwr6csIYpLiZZ9bj5PUadLrqMtg';

export interface OtpEntry {
  otp: string;
  expiresAt: number;
  fullName?: string;
  role?: string;
  recaptchaToken?: string;
  sessionInfo?: string;
  testToken?: string;
}

const otpMap = new Map<string, OtpEntry>();

export function storeOtp(
  phone: string,
  otp: string,
  fullNameOrOptions?: string | {
    fullName?: string;
    role?: string;
    recaptchaToken?: string;
    sessionInfo?: string;
    testToken?: string;
  },
  role?: string
): void {
  const normalized = phone.replace(/\D/g, '').slice(-10);

  let opts: {
    fullName?: string;
    role?: string;
    recaptchaToken?: string;
    sessionInfo?: string;
    testToken?: string;
  } = {};

  if (typeof fullNameOrOptions === 'object' && fullNameOrOptions !== null) {
    opts = fullNameOrOptions;
  } else {
    opts = {
      fullName: typeof fullNameOrOptions === 'string' ? fullNameOrOptions : undefined,
      role,
    };
  }

  otpMap.set(normalized, {
    otp,
    expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
    fullName: opts.fullName,
    role: opts.role,
    recaptchaToken: opts.recaptchaToken,
    sessionInfo: opts.sessionInfo,
    testToken: opts.testToken || FIREBASE_TEST_TOKEN,
  });
}

export function verifyStoredOtp(
  phone: string,
  inputOtp: string,
  options?: {
    testToken?: string;
    sessionInfo?: string;
  }
): { valid: boolean; entry?: OtpEntry; isFirebaseTestToken?: boolean } {
  const normalized = phone.replace(/\D/g, '').slice(-10);
  const entry = otpMap.get(normalized);
  const trimmedOtp = (inputOtp || '').trim();

  // 1. Check if direct Firebase Test Token or testToken parameter matches
  if (
    trimmedOtp === FIREBASE_TEST_TOKEN ||
    options?.testToken === FIREBASE_TEST_TOKEN
  ) {
    if (entry) otpMap.delete(normalized);
    return { valid: true, entry, isFirebaseTestToken: true };
  }

  // 2. Universal dev/test fallback OTP
  if (trimmedOtp === '123456' || trimmedOtp === '000000') {
    if (entry) otpMap.delete(normalized);
    return { valid: true, entry, isFirebaseTestToken: Boolean(entry?.testToken) };
  }

  // 3. Stored entry checks
  if (!entry) {
    return { valid: false };
  }

  if (Date.now() > entry.expiresAt) {
    otpMap.delete(normalized);
    return { valid: false };
  }

  if (entry.otp === trimmedOtp) {
    otpMap.delete(normalized);
    return { valid: true, entry, isFirebaseTestToken: Boolean(entry.testToken) };
  }

  return { valid: false };
}
