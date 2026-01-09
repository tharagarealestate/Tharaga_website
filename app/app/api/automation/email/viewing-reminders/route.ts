/**
 * Viewing Reminder Processor API
 * Processes scheduled viewing reminders
 */

import { NextRequest, NextResponse } from 'next/server';
import { processViewingReminders } from '@/lib/services/scheduledJobProcessor';

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const result = await processViewingReminders();

    return NextResponse.json({
      success: result.success,
      processed: result.processed,
      failed: result.failed,
      results: result.results
    });

  } catch (error: any) {
    console.error('[Viewing Reminders] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

























































