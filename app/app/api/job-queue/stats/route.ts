/**
 * Job Queue Stats API
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { automationQueue } from '@/lib/automation/queue/automationQueue'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const builderId = searchParams.get('builder_id') || user.id

    const stats = await automationQueue.getStats(builderId)

    return NextResponse.json({ data: stats })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}











