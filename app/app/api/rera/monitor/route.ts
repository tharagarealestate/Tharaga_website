/**
 * RERA Monitoring API Route
 * 
 * This endpoint should be called by a cron job (e.g., daily) to:
 * - Check for expired RERA
 * - Check for expiring soon RERA
 * - Re-verify stale RERA
 * - Create alerts
 * 
 * Usage: POST /api/rera/monitor
 * Headers: Authorization: Bearer <service_role_key> (or use API key)
 */

import { NextResponse } from 'next/server';
import { reraMonitoringService } from '@/lib/rera/monitoring-service';

export async function POST(request: Request) {
  try {
    // Verify authorization (in production, use proper API key validation)
    const authHeader = request.headers.get('authorization');
    const apiKey = request.headers.get('x-api-key');
    
    // For now, allow if service role key is provided or if called from server
    // In production, implement proper API key validation
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const expectedKey = process.env.RERA_MONITOR_API_KEY || serviceRoleKey;
    
    if (expectedKey && authHeader !== `Bearer ${expectedKey}` && apiKey !== expectedKey) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        message: 'Valid API key required'
      }, { status: 401 });
    }

    // Run monitoring check
    const result = await reraMonitoringService.runMonitoringCheck();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results: result,
      message: `Monitoring complete: ${result.checked} checked, ${result.expired} expired, ${result.expiringSoon} expiring soon, ${result.alertsCreated} alerts created`,
    });

  } catch (error) {
    console.error('RERA monitoring error:', error);
    return NextResponse.json({ 
      error: 'Monitoring failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * GET endpoint to retrieve monitoring statistics
 */
export async function GET() {
  try {
    const stats = await reraMonitoringService.getMonitoringStats();
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      stats,
    });
  } catch (error) {
    console.error('Error fetching monitoring stats:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch stats',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}



