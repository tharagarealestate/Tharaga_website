/**
 * Job Queue Cleanup API - Clean up old completed/failed jobs
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const daysOld = body.days_old || 30
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

    // Delete old completed/failed jobs for user's automations
    const { data: automations } = await supabase
      .from('automations')
      .select('id')
      .eq('builder_id', user.id)

    const automationIds = automations?.map(a => a.id) || []

    if (automationIds.length === 0) {
      return NextResponse.json({ data: { deleted: 0 } })
    }

    const { data, error } = await supabase
      .from('automation_queue')
      .delete()
      .in('automation_id', automationIds)
      .in('status', ['completed', 'failed'])
      .lt('completed_at', cutoffDate.toISOString())
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      data: {
        deleted: data?.length || 0,
        cutoff_date: cutoffDate.toISOString(),
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}


