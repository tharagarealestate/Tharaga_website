/**
 * Schedule Trigger API - Manually trigger a scheduled automation
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { automationQueue } from '@/lib/automation/queue/automationQueue'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify ownership
    const { data: automation, error: fetchError } = await supabase
      .from('automations')
      .select('*')
      .eq('id', params.id)
      .eq('builder_id', user.id)
      .single()

    if (fetchError || !automation) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 })
    }

    // Queue the automation
    const jobId = await automationQueue.queueAutomation({
      automation_id: automation.id,
      context: {
        event: {
          trigger_type: 'scheduled',
          trigger_name: 'Manual Schedule Trigger',
          event_source: 'manual',
          event_type: 'create',
          event_data: {},
          builder_id: user.id,
        },
        automation,
      },
      priority: automation.priority || 5,
    })

    return NextResponse.json({
      success: true,
      job_id: jobId,
      message: 'Schedule triggered successfully',
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}


