/**
 * Job Logs API - List execution logs
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
    const automationId = searchParams.get('automation_id')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')

    let query = supabase
      .from('automation_executions')
      .select(`
        *,
        automations!inner(builder_id)
      `)
      .eq('automations.builder_id', user.id)

    if (automationId) {
      query = query.eq('automation_id', automationId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    query = query.order('executed_at', { ascending: false }).limit(limit)

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: data || [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}







