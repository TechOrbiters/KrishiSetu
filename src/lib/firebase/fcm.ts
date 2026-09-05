import { getToken, onMessage } from 'firebase/messaging';
import { getFirebaseMessaging } from './client';

export async function requestFcmToken(): Promise<string | null> {
  try {
    const messaging = await getFirebaseMessaging();
    if (!messaging) return null;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('FCM Notification permission denied by user.');
      return null;
    }

    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || 'demo_vapid_key',
    });

    if (token) {
      // Register token with backend server
      await registerFcmTokenWithBackend(token);
    }

    return token;
  } catch (err: any) {
    console.warn('FCM Token generation warning:', err.message);
    return null;
  }
}

export async function registerFcmTokenWithBackend(fcmToken: string) {
  try {
    await fetch('/api/notifications/register-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fcmToken }),
    });
  } catch {
    // Non-blocking fallback
  }
}

export async function listenForegroundMessages(callback: (payload: any) => void) {
  const messaging = await getFirebaseMessaging();
  if (!messaging) return () => {};

  return onMessage(messaging, (payload) => {
    callback(payload);
  });
}
