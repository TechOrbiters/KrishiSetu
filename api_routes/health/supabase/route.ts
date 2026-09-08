import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET() {
  try {
    const startTime = Date.now();
    const { data, error } = await supabaseAdmin.from('users').select('count', { count: 'exact', head: true });
    const latencyMs = Date.now() - startTime;

    if (error) {
      return NextResponse.json({
        status: 'DEGRADED',
        database: 'Supabase PostgreSQL',
        reachable: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      }, { status: 503 });
    }

    return NextResponse.json({
      status: 'HEALTHY',
      database: 'Supabase PostgreSQL',
      reachable: true,
      latencyMs,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({
      status: 'UNHEALTHY',
      database: 'Supabase PostgreSQL',
      reachable: false,
      error: err.message,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
