/**
 * Automation Stats API - Real-time statistics
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const builderId = searchParams.get('builder_id') || user.id

    // Get total automations
    const { count: total } = await supabase
      .from('automations')
      .select('*', { count: 'exact', head: true })
      .eq('builder_id', builderId)

    // Get active automations
    const { count: active } = await supabase
      .from('automations')
      .select('*', { count: 'exact', head: true })
      .eq('builder_id', builderId)
      .eq('is_active', true)

    // Get today's executions
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { count: todayExecutions } = await supabase
      .from('automation_executions')
      .select('*', { count: 'exact', head: true })
      .gte('executed_at', today.toISOString())
      .in('automation_id', 
        supabase
          .from('automations')
          .select('id')
          .eq('builder_id', builderId)
      )

    // Get success rate
    const { data: allExecutions } = await supabase
      .from('automation_executions')
      .select('status')
      .in('automation_id',
        supabase
          .from('automations')
          .select('id')
          .eq('builder_id', builderId)
      )

    const totalExecutions = allExecutions?.length || 0
    const successful = allExecutions?.filter(e => e.status === 'success').length || 0
    const successRate = totalExecutions > 0 ? (successful / totalExecutions) * 100 : 0

    // Get pending jobs
    const { count: pendingJobs } = await supabase
      .from('automation_queue')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
      .in('automation_id',
        supabase
          .from('automations')
          .select('id')
          .eq('builder_id', builderId)
      )

    return NextResponse.json({
      data: {
        total: total || 0,
        active: active || 0,
        today_executions: todayExecutions || 0,
        success_rate: Math.round(successRate * 100) / 100,
        pending_jobs: pendingJobs || 0,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}



