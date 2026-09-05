import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../supabase/server';

const memoryIdempotencyStore = new Map<string, { statusCode: number; body: any; expiresAt: number }>();

export async function checkIdempotency(req: NextRequest, userId: string): Promise<{ cachedResponse?: NextResponse; idempotencyKey?: string }> {
  const key = req.headers.get('idempotency-key') || req.headers.get('x-idempotency-key');
  if (!key) return {};

  const fullKey = `${userId}:${key}`;
  const now = Date.now();

  // Check in-memory store first
  if (memoryIdempotencyStore.has(fullKey)) {
    const record = memoryIdempotencyStore.get(fullKey)!;
    if (record.expiresAt > now) {
      return {
        cachedResponse: NextResponse.json(record.body, { status: record.statusCode }),
        idempotencyKey: key,
      };
    }
    memoryIdempotencyStore.delete(fullKey);
  }

  // Check Supabase if configured
  try {
    const { data } = await supabaseAdmin
      .from('idempotency_keys')
      .select('status_code, response_body, expires_at')
      .eq('key', fullKey)
      .single();

    if (data && new Date(data.expires_at).getTime() > now) {
      return {
        cachedResponse: NextResponse.json(data.response_body, { status: data.status_code }),
        idempotencyKey: key,
      };
    }
  } catch {
    // Ignore DB fallback error
  }

  return { idempotencyKey: key };
}

export async function saveIdempotency(key: string, userId: string, statusCode: number, responseBody: any) {
  const fullKey = `${userId}:${key}`;
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours TTL

  memoryIdempotencyStore.set(fullKey, { statusCode, body: responseBody, expiresAt });

  try {
    await supabaseAdmin.from('idempotency_keys').upsert({
      key: fullKey,
      user_id: userId,
      status_code: statusCode,
      response_body: responseBody,
      expires_at: new Date(expiresAt).toISOString(),
    });
  } catch {
    // Memory store handles fallback
  }
}
