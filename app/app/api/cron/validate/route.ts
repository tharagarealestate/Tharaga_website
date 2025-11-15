/**
 * Cron Validate API - Validate cron configuration
 */

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET
    const hasSecret = !!cronSecret

    return NextResponse.json({
      data: {
        cron_secret_configured: hasSecret,
        cron_secret_length: cronSecret?.length || 0,
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

