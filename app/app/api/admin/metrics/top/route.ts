import { NextRequest, NextResponse } from 'next/server'
export const runtime = 'edge'
export const dynamic = 'force-dynamic'
import { getSupabase } from '@/lib/supabase'
import { secureApiRoute } from '@/lib/security/api-security'
import { Permissions } from '@/lib/security/permissions'
import { AuditActions, AuditResourceTypes } from '@/lib/security/audit'

export const GET = secureApiRoute(
  async (_req: NextRequest, user) => {
    const supabase = getSupabase()

  // Active users now (last 5 minutes) + sparkline last hour
  const { data: activeRows, error: activeErr } = await supabase
    .rpc('active_users_last_5_min')
  if (activeErr && activeErr.message.includes('rpc')) {
    // Fallback direct query using page_views
  }

  // Direct queries via Supabase JS since RPCs may not exist
  const { data: activeNowData, error: activeNowError } = await supabase
    .from('page_views')
    .select('user_id, created_at')
    .gt('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString())
  const activeNow = (activeNowData || [])
    .reduce((acc: Record<string, boolean>, r: any) => { acc[r.user_id] = true; return acc }, {})
  const activeUsersNow = Object.keys(activeNow).length

  // Sparkline: aggregate by minute for last hour
  const { data: sparkRows } = await supabase
    .from('page_views')
    .select('created_at, user_id')
    .gt('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
  const seriesMap = new Map<string, Set<string>>()
  for (const r of sparkRows || []) {
    const t = new Date(r.created_at)
    t.setSeconds(0, 0)
    const key = t.toISOString()
    if (!seriesMap.has(key)) seriesMap.set(key, new Set())
    seriesMap.get(key)!.add(r.user_id)
  }
  const series = Array.from(seriesMap.entries()).sort(([a],[b]) => a.localeCompare(b)).map(([t, set]) => ({ t, v: set.size }))

  // Leads today and vs yesterday
  const todayStart = new Date(); todayStart.setHours(0,0,0,0)
  const yStart = new Date(todayStart.getTime() - 24*60*60*1000)
  const yEnd = new Date(todayStart.getTime() - 1)
  const { count: leadsTodayCount } = await supabase.from('leads').select('*', { count: 'exact', head: true }).gte('created_at', todayStart.toISOString())
  const { count: leadsYesterdayCount } = await supabase.from('leads').select('*', { count: 'exact', head: true }).gte('created_at', yStart.toISOString()).lte('created_at', yEnd.toISOString())
  const leadsToday = {
    value: leadsTodayCount || 0,
    pctVsYesterday: (leadsTodayCount && leadsYesterdayCount && leadsYesterdayCount > 0)
      ? (leadsTodayCount - leadsYesterdayCount) / leadsYesterdayCount
      : 0,
  }

  // Trial conversions this week (non-trial subscriptions) and conversion rate
  const weekStart = new Date(); const day = weekStart.getDay(); const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1); weekStart.setDate(diff); weekStart.setHours(0,0,0,0)
  const { count: convertedCount } = await supabase.from('builder_subscriptions').select('*', { count: 'exact', head: true }).neq('tier', 'trial').gte('updated_at', weekStart.toISOString())
  const { count: startedCount } = await supabase.from('builder_subscriptions').select('*', { count: 'exact', head: true }).eq('tier', 'trial').gte('updated_at', weekStart.toISOString())
  const trialConversionsWeek = { value: convertedCount || 0, conversionRate: (startedCount && startedCount>0) ? (convertedCount||0)/(startedCount) : 0 }

  // Revenue MTD and growth vs last month
  const now = new Date(); const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth()-1, 1)
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
  const { data: payMtdRows } = await supabase.from('payments').select('amount, created_at').gte('created_at', monthStart.toISOString())
  const revenueMtdValue = (payMtdRows || []).reduce((s, r:any) => s + Number(r.amount||0), 0)
  const { data: payPrev } = await supabase.from('payments').select('amount, created_at').gte('created_at', prevMonthStart.toISOString()).lte('created_at', prevMonthEnd.toISOString())
  const prevMonthValue = (payPrev || []).reduce((s, r:any) => s + Number(r.amount||0), 0)
  const revenueMtd = {
    value: revenueMtdValue,
    growthVsLastMonth: prevMonthValue>0 ? (revenueMtdValue - prevMonthValue)/prevMonthValue : 0,
  }

    return NextResponse.json({
      activeUsersNow: { value: activeUsersNow, series },
      leadsToday,
      trialConversionsWeek,
      revenueMtd,
    })
  },
  {
    requireAuth: true,
    requireRole: ['admin'],
    requirePermission: Permissions.ADMIN_ACCESS,
    rateLimit: 'api',
    auditAction: AuditActions.VIEW,
    auditResourceType: AuditResourceTypes.ADMIN
  }
)
