import { NextRequest, NextResponse } from 'next/server';
import { runSecurityMonitoring } from '@/lib/security/monitoring';
import { scheduleKeyRotation } from '@/lib/security/key-rotation';

/**
 * GET /api/cron/security-monitoring
 * Cron job endpoint for security monitoring
 * Should be called periodically (e.g., every 15 minutes)
 * 
 * Protected by cron secret or Vercel Cron
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (if using external cron)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Run security monitoring checks
    await runSecurityMonitoring();

    // Check if key rotation is needed (runs less frequently)
    const shouldCheckRotation = Math.random() < 0.1; // 10% chance per run
    if (shouldCheckRotation) {
      await scheduleKeyRotation();
    }

    return NextResponse.json({
      success: true,
      message: 'Security monitoring completed',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('[Cron/SecurityMonitoring] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message
      },
      { status: 500 }
    );
  }
}

