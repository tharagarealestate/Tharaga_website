/**
 * Cron Execute API - Execute cron jobs
 */

import { NextRequest, NextResponse } from 'next/server'
import { jobProcessor } from '@/lib/automation/queue/jobProcessor'

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret) {
      return NextResponse.json(
        { error: 'CRON_SECRET not configured' },
        { status: 500 }
      )
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Process queue
    await jobProcessor.processBatch()

    return NextResponse.json({
      success: true,
      message: 'Cron job executed',
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}











