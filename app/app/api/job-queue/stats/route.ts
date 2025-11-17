/**
 * Job Queue Stats API
 */

import { NextRequest, NextResponse } from 'next/server'
import { automationQueue } from '@/lib/automation/queue/automationQueue'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const builderId = searchParams.get('builder_id')

    const stats = await automationQueue.getStats(builderId || undefined)

    return NextResponse.json({ data: stats })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}





