import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getSupabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const supabase = getSupabase()
  const url = new URL(req.url)
  const range = (url.searchParams.get('range') || '30d') as '7d' | '30d' | '90d'
  const days = range === '7d' ? 7 : range === '90d' ? 90 : 30
  const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  // New signups per day and cumulative total
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, created_at')
    .gt('created_at', from.toISOString())

  // All users up to now to compute cumulative
  const { data: allProfiles } = await supabase
    .from('profiles')
    .select('id, created_at')

  // Active users per day derived from page_views
  const { data: pageViews } = await supabase
    .from('page_views')
    .select('user_id, created_at')
    .gt('created_at', from.toISOString())

  const byDay = new Map<string, { new_users: number; active_users: number }>()
  for (let i = 0; i < days; i++) {
    const d = new Date(from.getTime() + i * 24 * 60 * 60 * 1000)
    const key = d.toISOString().slice(0, 10)
    byDay.set(key, { new_users: 0, active_users: 0 })
  }

  for (const p of profiles || []) {
    const key = new Date(p.created_at).toISOString().slice(0, 10)
    if (byDay.has(key)) byDay.get(key)!.new_users++
  }

  const activeByDay = new Map<string, Set<string>>()
  for (const v of pageViews || []) {
    const key = new Date(v.created_at).toISOString().slice(0, 10)
    if (!activeByDay.has(key)) activeByDay.set(key, new Set())
    if (v.user_id) activeByDay.get(key)!.add(v.user_id)
  }
  for (const [key, set] of activeByDay.entries()) {
    if (byDay.has(key)) byDay.get(key)!.active_users = set.size
  }

  // cumulative total users
  const allSorted = (allProfiles || []).sort((a:any,b:any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  let cumulative = 0
  const out: Array<{ date: string; total_users: number; active_users: number; new_users: number }> = []
  const startDay = new Date(from); startDay.setHours(0,0,0,0)
  for (let i = 0; i < days; i++) {
    const d = new Date(startDay.getTime() + i * 24 * 60 * 60 * 1000)
    const key = d.toISOString().slice(0, 10)
    const addedToday = allSorted.filter((p:any) => new Date(p.created_at).toISOString().slice(0,10) === key).length
    cumulative += addedToday
    const per = byDay.get(key) || { new_users: 0, active_users: 0 }
    out.push({ date: key, total_users: cumulative, active_users: per.active_users, new_users: per.new_users })
  }

  return NextResponse.json(out)
}
