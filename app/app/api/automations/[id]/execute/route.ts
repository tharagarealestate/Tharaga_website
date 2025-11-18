/**
 * Automation Execute API - Manually trigger automation
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
      return NextResponse.json({ error: 'Automation not found' }, { status: 404 })
    }

    const body = await request.json()
    const { lead_id, event_data = {} } = body

    // Queue the automation
    const jobId = await automationQueue.queueAutomation({
      automation_id: automation.id,
      context: {
        event: {
          trigger_type: 'manual',
          trigger_name: 'Manual Execution',
          event_source: 'manual',
          event_type: 'create',
          event_data,
          lead_id,
          builder_id: user.id,
        },
        automation,
      },
      priority: automation.priority || 5,
    })

    return NextResponse.json({
      success: true,
      job_id: jobId,
      message: 'Automation queued for execution',
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}







