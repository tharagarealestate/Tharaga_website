/**
 * Schedule API Routes - List and Create schedules
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const builderId = searchParams.get('builder_id') || user.id

    const { data, error } = await supabase
      .from('automations')
      .select('*')
      .eq('builder_id', builderId)
      .not('trigger_conditions', 'is', null)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: data || [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, schedule, automation_id, builder_id = user.id } = body

    if (!name || !schedule || !automation_id) {
      return NextResponse.json(
        { error: 'Missing required fields: name, schedule, automation_id' },
        { status: 400 }
      )
    }

    // Schedules are stored as automations with schedule metadata
    const { data, error } = await supabase
      .from('automations')
      .update({
        schedule_metadata: schedule,
      })
      .eq('id', automation_id)
      .eq('builder_id', builder_id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

