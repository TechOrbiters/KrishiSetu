import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getMessaging, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyBOta9N0SjHZyXAFuyCPoJBnn-RchTrCRI',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'kisaan-setu-7d74b.firebaseapp.com',
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || 'https://kisaan-setu-7d74b-default-rtdb.firebaseio.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'kisaan-setu-7d74b',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'kisaan-setu-7d74b.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '545121595157',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:545121595157:web:731a37b2ea97b5882ec31c',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-RR18DE2JPB',
};

// Initialize Firebase for Browser Client
export const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Browser Services
export const firebaseAuth = typeof window !== 'undefined' ? getAuth(firebaseApp) : ({} as any);
export const firebaseRtdb = typeof window !== 'undefined' ? getDatabase(firebaseApp) : ({} as any);

// FCM Web Messaging
export const getFirebaseMessaging = async () => {
  if (typeof window !== 'undefined' && (await isSupported())) {
    return getMessaging(firebaseApp);
  }
  return null;
};
