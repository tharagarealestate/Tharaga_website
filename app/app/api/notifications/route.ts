'use server'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const pageParam = Number.parseInt(searchParams.get('page') || '1', 10)
  const limitParam = Number.parseInt(searchParams.get('limit') || '20', 10)
  const unreadOnly = searchParams.get('unread_only') === 'true'
  const type = searchParams.get('type')

  const page = Number.isNaN(pageParam) || pageParam < 1 ? 1 : pageParam
  const limit = Number.isNaN(limitParam) ? 20 : Math.min(Math.max(limitParam, 1), 100)
  const from = (page - 1) * limit
  const to = from + limit - 1

  try {
    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (unreadOnly) {
      query = query.eq('read', false)
    }

    if (type) {
      query = query.eq('type', type)
    }

    const { data, error, count } = await query

    if (error) {
      throw error
    }

    return NextResponse.json({
      notifications: data ?? [],
      pagination: {
        page,
        limit,
        total: count ?? 0,
        total_pages: count ? Math.ceil(count / limit) : 0,
      },
    })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}


