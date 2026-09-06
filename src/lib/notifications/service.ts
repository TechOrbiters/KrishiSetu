/**
 * KRISHISETU — Domain Notification & FCM Push Service
 * Supports domain events:
 * ORDER_CREATED, ORDER_ACCEPTED, TRANSPORT_ASSIGNED, PICKUP_COMPLETED,
 * DELIVERY_STARTED, DELIVERED, PAYMENT_RECEIVED, FRESHNESS_ALERT, PRICE_ALERT, DEMAND_ALERT
 */

import { supabaseAdmin } from '../supabase/server';
import { adminMessaging } from '../firebase/admin';

export type DomainEventType =
  | 'ORDER_CREATED'
  | 'ORDER_ACCEPTED'
  | 'TRANSPORT_ASSIGNED'
  | 'PICKUP_COMPLETED'
  | 'DELIVERY_STARTED'
  | 'DELIVERED'
  | 'PAYMENT_RECEIVED'
  | 'FRESHNESS_ALERT'
  | 'PRICE_ALERT'
  | 'DEMAND_ALERT';

export interface SendNotificationPayload {
  userId: string;
  eventType: DomainEventType;
  title: string;
  message: string;
  linkUrl?: string;
  idempotencyKey?: string; // e.g. "ORDER_CREATED:ord_123"
}

export function isUuid(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

export async function resolveDbUserId(identifier: string): Promise<string | null> {
  if (!identifier) return null;
  if (isUuid(identifier)) return identifier;

  try {
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('firebase_uid', identifier)
      .maybeSingle();

    if (user?.id) return user.id;

    // Create user record if not present to get a valid UUID
    let userPhone: string | null = null;
    try {
      const { adminAuth } = await import('../firebase/admin');
      if (adminAuth) {
        const fbUser = await adminAuth.getUser(identifier);
        userPhone = fbUser?.phoneNumber || null;
      }
    } catch (_) {}

    const { data: newUser, error } = await supabaseAdmin
      .from('users')
      .upsert({
        firebase_uid: identifier,
        phone: userPhone,
        full_name: 'Registered User',
        role: 'FARMER',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'firebase_uid' })
      .select('id')
      .single();

    if (error) {
      console.warn('[resolveDbUserId Error]:', error.message);
      return null;
    }

    return newUser?.id || null;
  } catch (err: any) {
    console.warn('[resolveDbUserId Exception]:', err.message);
    return null;
  }
}

// In-memory store for FCM tokens per user (supports multiple devices per user)
const fcmTokenMemoryStore = new Map<string, Map<string, { token: string; deviceInfo: string }>>();

export async function registerUserFcmToken(userId: string, token: string, deviceInfo = 'Web Browser'): Promise<boolean> {
  try {
    const resolvedUserId = await resolveDbUserId(userId);
    if (!resolvedUserId) {
      console.warn('[FCM Token Register]: Could not resolve user ID for', userId);
      return false;
    }

    if (!fcmTokenMemoryStore.has(resolvedUserId)) {
      fcmTokenMemoryStore.set(resolvedUserId, new Map());
    }
    fcmTokenMemoryStore.get(resolvedUserId)!.set(token, { token, deviceInfo });

    // Attempt DB persistence if table exists
    try {
      await supabaseAdmin
        .from('user_fcm_tokens')
        .upsert({
          user_id: resolvedUserId,
          fcm_token: token,
          device_info: deviceInfo,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,fcm_token' });
    } catch (_) {
      // Ignore schema missing error for user_fcm_tokens table
    }

    return true;
  } catch (err: any) {
    console.error('[FCM Token Register Exception Details]:', err);
    return false;
  }
}

export async function sendDomainNotification(payload: SendNotificationPayload): Promise<{ success: boolean; isDuplicate?: boolean; notification?: any }> {
  try {
    const { userId, eventType, title, message, linkUrl, idempotencyKey } = payload;

    const resolvedUserId = await resolveDbUserId(userId);
    if (!resolvedUserId) {
      console.warn('[Notification Service Error]: Could not resolve DB user ID for', userId);
      return { success: false };
    }

    const dedupKey = idempotencyKey || `${eventType}:${resolvedUserId}:${Date.now()}`;
    const baseLink = linkUrl || '/farmer/dashboard';
    const formattedLinkUrl = baseLink.includes('?') 
      ? `${baseLink}&evt=${eventType}&idempotency_key=${encodeURIComponent(dedupKey)}`
      : `${baseLink}?evt=${eventType}&idempotency_key=${encodeURIComponent(dedupKey)}`;

    // 1. Deduplication check using idempotency_key or link_url
    const { data: userNotifs } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_id', resolvedUserId);

    if (userNotifs && userNotifs.length > 0) {
      const existing = userNotifs.find((n: any) => 
        n.idempotency_key === dedupKey ||
        (n.link_url && n.link_url.includes(`idempotency_key=${encodeURIComponent(dedupKey)}`))
      );

      if (existing) {
        return {
          success: true,
          isDuplicate: true,
          notification: {
            ...existing,
            event_type: existing.event_type || eventType,
            idempotency_key: existing.idempotency_key || dedupKey,
          },
        };
      }
    }

    // 2. Persist notification in Supabase with column fallback
    let notificationData: any = null;

    // Try full insert with event_type and idempotency_key
    const { data: fullInsert, error: fullErr } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: resolvedUserId,
        title,
        message,
        is_read: false,
        link_url: formattedLinkUrl,
        event_type: eventType,
        idempotency_key: dedupKey,
        created_at: new Date().toISOString(),
      })
      .select()
      .maybeSingle();

    if (!fullErr && fullInsert) {
      notificationData = fullInsert;
    } else {
      // Fallback insert with standard columns
      const { data: fallbackInsert } = await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: resolvedUserId,
          title,
          message,
          is_read: false,
          link_url: formattedLinkUrl,
          created_at: new Date().toISOString(),
        })
        .select()
        .maybeSingle();

      if (fallbackInsert) {
        notificationData = {
          ...fallbackInsert,
          event_type: eventType,
          idempotency_key: dedupKey,
        };
      }
    }

    if (!notificationData) {
      // Memory fallback if DB insert failed
      notificationData = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        user_id: resolvedUserId,
        title,
        message,
        is_read: false,
        link_url: formattedLinkUrl,
        event_type: eventType,
        idempotency_key: dedupKey,
        created_at: new Date().toISOString(),
      };
    }

    // 3. Dispatch Push Notification via Firebase Cloud Messaging (FCM)
    try {
      const userTokensMap = fcmTokenMemoryStore.get(resolvedUserId);
      const memoryTokens = userTokensMap ? Array.from(userTokensMap.values()).map(t => t.token) : [];

      let dbTokens: string[] = [];
      try {
        const { data: fetchedTokens } = await supabaseAdmin
          .from('user_fcm_tokens')
          .select('fcm_token')
          .eq('user_id', resolvedUserId);
        if (fetchedTokens) {
          dbTokens = fetchedTokens.map((t: any) => t.fcm_token).filter(Boolean);
        }
      } catch (_) {}

      const allTokens = Array.from(new Set([...memoryTokens, ...dbTokens]));

      if (adminMessaging && allTokens.length > 0) {
        await adminMessaging.sendEachForMulticast({
          tokens: allTokens,
          notification: { title, body: message },
          data: { eventType, linkUrl: baseLink },
        });
      }
    } catch (fcmErr: any) {
      console.warn('[FCM Dispatch Notice]:', fcmErr.message);
    }

    return {
      success: true,
      isDuplicate: false,
      notification: notificationData,
    };
  } catch (err: any) {
    console.error('[Notification Service Error]:', err.message);
    return { success: false };
  }
}

