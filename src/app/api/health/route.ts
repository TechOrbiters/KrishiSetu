import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'HEALTHY',
    service: 'KRISHISETU Backend API',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
}
