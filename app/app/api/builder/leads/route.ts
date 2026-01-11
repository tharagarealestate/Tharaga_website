import { NextRequest, NextResponse } from 'next/server'
export const runtime = 'edge'
import { getSupabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const status = url.searchParams.get('status') || 'all'
  const scoreMin = Number(url.searchParams.get('scoreMin') || '0')
  const scoreMax = Number(url.searchParams.get('scoreMax') || '10')
  const source = url.searchParams.get('source') || 'all'
  const dateRange = url.searchParams.get('dateRange') || '30days'
  const limit = Number(url.searchParams.get('limit') || '0') // 0 = no limit, supports pagination

  const supabase = getSupabase()

  // Get authenticated user - NO DEMO FALLBACK
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Use real authenticated user ID as builder_id
  const builderId = user.id

  let fromDate: string | null = null
  const now = new Date()
  if (dateRange === '7days') {
    fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  } else if (dateRange === '30days') {
    fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
  } else if (dateRange === '90days') {
    fromDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString()
  }

  let query = supabase
    .from('leads')
    .select('id, created_at, builder_id, property_id, name, email, phone, message, status, score, source, budget, properties!inner(title, location)')
    .eq('builder_id', builderId)
    .gte('score', scoreMin)
    .lte('score', scoreMax)
    .order('created_at', { ascending: false })

  if (status !== 'all') query = query.eq('status', status)
  if (source !== 'all') query = query.eq('source', source)
  if (fromDate) query = query.gte('created_at', fromDate)
  if (limit > 0) query = query.limit(limit) // Support pagination via limit parameter

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Map property join to nested object
  const items = (data || []).map((row: any) => ({
    id: row.id,
    created_at: row.created_at,
    name: row.name,
    email: row.email,
    phone: row.phone,
    status: row.status,
    score: row.score,
    source: row.source,
    budget: row.budget,
    property: { title: row.properties?.title, location: row.properties?.location },
  }))

  const res = NextResponse.json({ items })
  // Cache for 60s on the edge/CDN with stale-while-revalidate
  res.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=60')
  return res
}
