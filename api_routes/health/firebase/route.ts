import { NextResponse } from 'next/server';
import { adminAuth, adminRtdb } from '@/lib/firebase/admin';

export async function GET() {
  try {
    const startTime = Date.now();
    const isAuthAvailable = Boolean(adminAuth);
    const isRtdbAvailable = Boolean(adminRtdb);
    const latencyMs = Date.now() - startTime;

    return NextResponse.json({
      status: 'HEALTHY',
      service: 'Firebase Suite',
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'kisaan-setu-7d74b',
      authAvailable: isAuthAvailable,
      rtdbAvailable: isRtdbAvailable,
      latencyMs,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({
      status: 'UNHEALTHY',
      service: 'Firebase Suite',
      error: err.message,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
