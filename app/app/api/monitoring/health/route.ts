/**
 * System Health Monitoring API
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSystemHealth } from '@/lib/services/monitoring';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const health = await getSystemHealth();
    return NextResponse.json(health);
  } catch (error) {
    return NextResponse.json(
      {
        status: 'down',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

