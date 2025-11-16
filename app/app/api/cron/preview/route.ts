/**
 * Cron Preview API - Preview what would be executed
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

    const pendingJobs = await automationQueue.getPendingJobs(10)

    return NextResponse.json({
      data: {
        pending_count: pendingJobs.length,
        jobs: pendingJobs.map(job => ({
          id: job.id,
          automation_id: job.automation_id,
          priority: job.priority,
          scheduled_for: job.scheduled_for,
        })),
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}



