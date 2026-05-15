import { NextResponse } from 'next/server';

/**
 * GET /api/test — health check (restored after git clean).
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'dcc-webiste-crm',
    timestamp: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV || 'development',
    endpoints: {
      health: '/api/test',
      email: '/api/test/email',
      contact: '/api/test-contact',
      config: '/api/check-config',
    },
  });
}
