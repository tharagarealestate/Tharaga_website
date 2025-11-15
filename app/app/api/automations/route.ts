/**
 * Automation API Routes - List and Create automations
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
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    let query = supabase
      .from('automations')
      .select('*')
      .eq('builder_id', builderId)

    if (status) {
      query = query.eq('is_active', status === 'active')
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    query = query.order('created_at', { ascending: false })

    const { data, error } = await query

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
    const {
      name,
      description,
      trigger_conditions,
      actions,
      priority = 5,
      is_active = true,
      tags = [],
      builder_id = user.id,
    } = body

    if (!name || !trigger_conditions || !actions) {
      return NextResponse.json(
        { error: 'Missing required fields: name, trigger_conditions, actions' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('automations')
      .insert({
        builder_id,
        name,
        description,
        trigger_conditions,
        actions,
        priority,
        is_active,
        tags,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

