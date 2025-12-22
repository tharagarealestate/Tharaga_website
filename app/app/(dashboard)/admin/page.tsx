"use client"

import { useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { getSupabase } from '@/lib/supabase'
import { format } from 'date-fns'

// ---------- Types ----------

type DateRange = '7d' | '30d' | '90d'

type TopProperty = {
  title: string
  area: string | null
  total_views: number
  total_inquiries: number
  conversion_rate: number
  price: number | null
}

type BuilderRow = {
  name: string
  company_name: string | null
  properties_listed: number
  total_leads: number
  deals_closed: number
  total_revenue: number | null
}

type Activity = {
  event_name: string
  user_id: string | null
  event_data: any
  created_at: string
}

// ---------- Data Fetchers ----------

async function fetcher<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, cache: 'no-store' })
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  return res.json()
}

function useRealtime<T = any>(table: string, onChange: () => void) {
  useEffect(() => {
    const supabase = getSupabase()
    const channel = supabase
      .channel(`rt:${table}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
        onChange()
      })
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [table, onChange])
}

// ---------- Queries (API endpoints via RPC SQL) ----------

async function getTopRowMetrics() {
  return fetcher<{
    activeUsersNow: { value: number; series: Array<{ t: string; v: number }> }
    leadsToday: { value: number; pctVsYesterday: number }
    trialConversionsWeek: { value: number; conversionRate: number }
    revenueMtd: { value: number; growthVsLastMonth: number }
  }>('/api/admin/metrics/top')
}

async function getUserGrowth(range: DateRange) {
  const params = new URLSearchParams({ range })
  return fetcher<Array<{ date: string; total_users: number; active_users: number; new_users: number }>>(
    `/api/admin/metrics/user-growth?${params.toString()}`,
  )
}

async function getLeadQuality() {
  return fetcher<Array<{ category: string; count: number }>>('/api/admin/metrics/lead-quality')
}

async function getRevenueForecast() {
  return fetcher<Array<{ month: string; pessimistic: number; realistic: number; optimistic: number }>>(
    '/api/admin/metrics/revenue-forecast',
  )
}

async function getFunnel() {
  return fetcher<Array<{ stage: string; count: number }>>('/api/admin/metrics/funnel')
}

async function getTopProperties() {
  return fetcher<TopProperty[]>('/api/admin/metrics/top-properties')
}

async function getBuilderLeaderboard() {
  return fetcher<BuilderRow[]>('/api/admin/metrics/builder-leaderboard')
}

async function getRecentActivity() {
  return fetcher<Activity[]>('/api/admin/metrics/recent-activity')
}

// ---------- Component ----------

export default function AdminDashboardPage() {
  const qc = useQueryClient()
  const [range, setRange] = useState<DateRange>('30d')
  const [R, setR] = useState<any>(null)

  // Lazy-load recharts only on this page
  useEffect(() => { let mounted=true; (async()=>{ try{ const mod = await import('recharts'); if(mounted) setR(mod) }catch{} })(); return ()=>{ mounted=false } }, [])

  // Top row metrics
  const topQuery = useQuery({
    queryKey: ['admin-top'],
    queryFn: getTopRowMetrics,
    refetchInterval: 30_000,
    placeholderData: (prev) => prev,
  })

  // Charts
  const growthQuery = useQuery({
    queryKey: ['user-growth', range],
    queryFn: () => getUserGrowth(range),
    refetchInterval: 30_000,
    placeholderData: (prev) => prev,
  })

  const leadQualityQuery = useQuery({
    queryKey: ['lead-quality'],
    queryFn: getLeadQuality,
    refetchInterval: 60_000,
    placeholderData: (prev) => prev,
  })

  const forecastQuery = useQuery({
    queryKey: ['revenue-forecast'],
    queryFn: getRevenueForecast,
    refetchInterval: 60_000,
    placeholderData: (prev) => prev,
  })

  const funnelQuery = useQuery({
    queryKey: ['funnel'],
    queryFn: getFunnel,
    refetchInterval: 60_000,
    placeholderData: (prev) => prev,
  })

  // Tables
  const topPropsQuery = useQuery({
    queryKey: ['top-props'],
    queryFn: getTopProperties,
    refetchInterval: 60_000,
    placeholderData: (prev) => prev,
  })

  const buildersQuery = useQuery({
    queryKey: ['builder-leaderboard'],
    queryFn: getBuilderLeaderboard,
    refetchInterval: 60_000,
    placeholderData: (prev) => prev,
  })

  const activityQuery = useQuery({
    queryKey: ['recent-activity'],
    queryFn: getRecentActivity,
    refetchInterval: 30_000,
    placeholderData: (prev) => prev,
  })

  // Realtime subscriptions to refresh
  useRealtime('page_views', () => qc.invalidateQueries({ queryKey: ['admin-top'] }))
  useRealtime('leads', () => {
    qc.invalidateQueries({ queryKey: ['admin-top'] })
    qc.invalidateQueries({ queryKey: ['lead-quality'] })
    qc.invalidateQueries({ queryKey: ['top-props'] })
    qc.invalidateQueries({ queryKey: ['builder-leaderboard'] })
    qc.invalidateQueries({ queryKey: ['recent-activity'] })
  })
  useRealtime('events', () => {
    qc.invalidateQueries({ queryKey: ['funnel'] })
    qc.invalidateQueries({ queryKey: ['recent-activity'] })
  })
  useRealtime('payments', () => {
    qc.invalidateQueries({ queryKey: ['admin-top'] })
    qc.invalidateQueries({ queryKey: ['revenue-forecast'] })
  })

  // Export CSV
  function exportCSV() {
    const rows: any[] = []
    rows.push({ section: 'top', data: topQuery.data })
    rows.push({ section: 'user_growth', data: growthQuery.data })
    rows.push({ section: 'lead_quality', data: leadQualityQuery.data })
    rows.push({ section: 'revenue_forecast', data: forecastQuery.data })
    rows.push({ section: 'funnel', data: funnelQuery.data })
    rows.push({ section: 'top_properties', data: topPropsQuery.data })
    rows.push({ section: 'builder_leaderboard', data: buildersQuery.data })
    rows.push({ section: 'activity', data: activityQuery.data })
    const csv = toCSV(rows)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `admin-dashboard-${format(new Date(), 'yyyy-MM-dd-HH-mm')}.csv`
    a.click()
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-100 mb-2">Admin Dashboard</h1>
        <p className="text-gray-400">Comprehensive platform metrics and insights</p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <Select value={range} onChange={(e) => setRange(e.target.value as DateRange)} className="w-[160px] bg-gray-900 text-gray-100 border-gray-800">
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </Select>
        <Button onClick={exportCSV} className="bg-gold-600 hover:bg-gold-500 border-gold-500 text-gray-900">Export CSV</Button>
        <Button
          variant="secondary"
          className="border-gray-800 bg-gray-900 text-gray-200 hover:bg-gray-800"
          onClick={async () => {
            const emails = window.prompt('Enter recipient emails (comma separated)') || ''
            if (!emails.trim()) return
            const freq = window.prompt('Frequency: daily, weekly, or monthly', 'daily') || 'daily'
            try {
              const res = await fetch('/api/admin/email-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ recipients: emails.split(',').map(s => s.trim()).filter(Boolean), frequency: freq, range }),
              })
              if (!res.ok) throw new Error('Request failed')
              alert('Report scheduled!')
            } catch {
              alert('Failed to schedule report')
            }
          }}
        >
          Email Report
        </Button>
      </div>

      {/* Top Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Active Users Now"
          value={topQuery.data?.activeUsersNow.value}
          loading={topQuery.isLoading}
          accent="emerald"
        >
          <Sparkline data={topQuery.data?.activeUsersNow.series || []} color="var(--emerald-500)" />
        </MetricCard>

        <MetricCard
          title="Leads Today"
          value={topQuery.data?.leadsToday.value}
          sub={`${fmtPct(topQuery.data?.leadsToday.pctVsYesterday)} vs yesterday`}
          loading={topQuery.isLoading}
          accent="gold"
        />

        <MetricCard
          title="Trial Conversions (This Week)"
          value={topQuery.data?.trialConversionsWeek.value}
          sub={`Rate ${fmtPct(topQuery.data?.trialConversionsWeek.conversionRate)}`}
          loading={topQuery.isLoading}
          accent="primary"
        />

        <MetricCard
          title="Revenue (MTD)"
          value={fmtINR(topQuery.data?.revenueMtd.value)}
          sub={`${fmtPct(topQuery.data?.revenueMtd.growthVsLastMonth)} vs last month`}
          loading={topQuery.isLoading}
          accent="emerald"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gray-900 border-gray-800">
          <div className="mb-2 text-gray-200 font-semibold">User Growth (Last {range.toUpperCase()})</div>
          {growthQuery.isLoading || !R ? (
            <div className="h-64 rounded-md bg-gray-800/60 animate-pulse" />
          ) : (
            <div className="h-64">
              <R.ResponsiveContainer width="100%" height="100%">
                <R.LineChart data={growthQuery.data || []}>
                  <R.CartesianGrid stroke="#222" />
                  <R.XAxis dataKey="date" stroke="#aaa" tick={{ fill: '#aaa', fontSize: 12 }} />
                  <R.YAxis stroke="#aaa" tick={{ fill: '#aaa', fontSize: 12 }} />
                  <R.Tooltip contentStyle={{ background: '#0b0b0b', border: '1px solid #222', color: '#eee' }} />
                  <R.Line dataKey="total_users" stroke="var(--primary-600)" dot={false} strokeWidth={2} name="Total Users" />
                  <R.Line dataKey="active_users" stroke="var(--emerald-500)" dot={false} strokeWidth={2} name="Active Users" />
                  <R.Line dataKey="new_users" stroke="var(--gold-500)" dot={false} strokeWidth={2} name="New Signups" />
                </R.LineChart>
              </R.ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <div className="mb-2 text-gray-200 font-semibold">Lead Quality Distribution</div>
          {leadQualityQuery.isLoading || !R ? (
            <div className="h-64 rounded-md bg-gray-800/60 animate-pulse" />
          ) : (
            <div className="h-64">
              <R.ResponsiveContainer width="100%" height="100%">
                <R.PieChart>
                  <R.Pie data={leadQualityQuery.data || []} dataKey="count" nameKey="category" innerRadius={48} outerRadius={80} paddingAngle={3}>
                    {(leadQualityQuery.data || []).map((_, idx) => (
                      <R.Cell key={idx} fill={pieColors[idx % pieColors.length]} />
                    ))}
                  </R.Pie>
                  <R.Tooltip contentStyle={{ background: '#0b0b0b', border: '1px solid #222', color: '#eee' }} />
                </R.PieChart>
              </R.ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card className="bg-gray-900 border-gray-800 lg:col-span-2">
          <div className="mb-2 text-gray-200 font-semibold">Revenue Forecast (Next 3 Months)</div>
          {forecastQuery.isLoading || !R ? (
            <div className="h-64 rounded-md bg-gray-800/60 animate-pulse" />
          ) : (
            <div className="h-64">
              <R.ResponsiveContainer width="100%" height="100%">
                <R.AreaChart data={forecastQuery.data || []}>
                  <R.CartesianGrid stroke="#222" />
                  <R.XAxis dataKey="month" stroke="#aaa" tick={{ fill: '#aaa', fontSize: 12 }} />
                  <R.YAxis stroke="#aaa" tick={{ fill: '#aaa', fontSize: 12 }} />
                  <R.Tooltip contentStyle={{ background: '#0b0b0b', border: '1px solid #222', color: '#eee' }} />
                  <R.Area type="monotone" dataKey="pessimistic" stroke="#9ca3af" fill="#1f2937" name="Pessimistic" />
                  <R.Area type="monotone" dataKey="realistic" stroke="var(--emerald-500)" fill="rgba(16,185,129,0.15)" name="Realistic" />
                  <R.Area type="monotone" dataKey="optimistic" stroke="var(--gold-500)" fill="rgba(234,179,8,0.15)" name="Optimistic" />
                </R.AreaChart>
              </R.ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card className="bg-gray-900 border-gray-800 lg:col-span-2">
          <div className="mb-2 text-gray-200 font-semibold">Acquisition Funnel (Last 30 Days)</div>
          {funnelQuery.isLoading ? (
            <div className="h-64 rounded-md bg-gray-800/60 animate-pulse" />
          ) : (
            <div className="h-64 flex items-end gap-4">
              {(funnelQuery.data || []).map((s) => (
                <div key={s.stage} className="flex-1">
                  <div className="bg-primary-600/30 border border-primary-600/40 rounded-md p-2 text-center">
                    <div className="text-xs text-gray-400 mb-1">{s.stage}</div>
                    <div className="text-h5 font-semibold text-gray-100">{s.count}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gray-900 border-gray-800">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-gray-200 font-semibold">Top Performing Properties</div>
          </div>
          <div className="overflow-auto rounded-md border border-gray-800">
            {topPropsQuery.isLoading ? (
              <div className="h-48 bg-gray-800/60 animate-pulse" />
            ) : (
            <table className="min-w-full text-sm">
              <thead className="bg-gray-800/60 text-gray-300">
                <tr>
                  <th className="px-3 py-2 text-left">Title</th>
                  <th className="px-3 py-2 text-left">Area</th>
                  <th className="px-3 py-2 text-right">Views</th>
                  <th className="px-3 py-2 text-right">Inquiries</th>
                  <th className="px-3 py-2 text-right">Conv%</th>
                  <th className="px-3 py-2 text-right">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {(topPropsQuery.data || []).map((p, idx) => (
                  <tr key={idx} className="text-gray-200">
                    <td className="px-3 py-2">{p.title}</td>
                    <td className="px-3 py-2">{p.area || '-'}</td>
                    <td className="px-3 py-2 text-right">{p.total_views}</td>
                    <td className="px-3 py-2 text-right">{p.total_inquiries}</td>
                    <td className="px-3 py-2 text-right">{(p.conversion_rate * 100).toFixed(1)}%</td>
                    <td className="px-3 py-2 text-right">{p.price ? fmtINR(p.price) : '-'}</td>
                  </tr>
                ))}
                {(!topPropsQuery.data?.length && !topPropsQuery.isLoading) && (
                  <tr><td className="px-3 py-4" colSpan={6}>No data.</td></tr>
                )}
              </tbody>
            </table>
            )}
          </div>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-gray-200 font-semibold">Builder Leaderboard</div>
          </div>
          <div className="overflow-auto rounded-md border border-gray-800">
            {buildersQuery.isLoading ? (
              <div className="h-48 bg-gray-800/60 animate-pulse" />
            ) : (
            <table className="min-w-full text-sm">
              <thead className="bg-gray-800/60 text-gray-300">
                <tr>
                  <th className="px-3 py-2 text-left">Name</th>
                  <th className="px-3 py-2 text-left">Company</th>
                  <th className="px-3 py-2 text-right">Properties</th>
                  <th className="px-3 py-2 text-right">Leads</th>
                  <th className="px-3 py-2 text-right">Closed</th>
                  <th className="px-3 py-2 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {(buildersQuery.data || []).map((r, idx) => (
                  <tr key={idx} className="text-gray-200">
                    <td className="px-3 py-2">{r.name}</td>
                    <td className="px-3 py-2">{r.company_name || '-'}</td>
                    <td className="px-3 py-2 text-right">{r.properties_listed}</td>
                    <td className="px-3 py-2 text-right">{r.total_leads}</td>
                    <td className="px-3 py-2 text-right">{r.deals_closed}</td>
                    <td className="px-3 py-2 text-right">{r.total_revenue ? fmtINR(r.total_revenue) : '-'}</td>
                  </tr>
                ))}
                {(!buildersQuery.data?.length && !buildersQuery.isLoading) && (
                  <tr><td className="px-3 py-4" colSpan={6}>No data.</td></tr>
                )}
              </tbody>
            </table>
            )}
          </div>
        </Card>
      </div>

      {/* Live Activity */}
      <Card className="bg-gray-900 border-gray-800">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-gray-200 font-semibold">Recent Activity</div>
          <Button variant="secondary" className="border-gray-800 bg-gray-900 text-gray-200 hover:bg-gray-800" onClick={() => activityQuery.refetch()}>
            Refresh
          </Button>
        </div>
        <div className="overflow-auto rounded-md border border-gray-800">
          {activityQuery.isLoading ? (
            <div className="h-40 bg-gray-800/60 animate-pulse" />
          ) : (
            <table className="min-w-full text-sm">
              <thead className="bg-gray-800/60 text-gray-300">
                <tr>
                  <th className="px-3 py-2 text-left">Event</th>
                  <th className="px-3 py-2 text-left">User</th>
                  <th className="px-3 py-2 text-left">Data</th>
                  <th className="px-3 py-2 text-left">When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {(activityQuery.data || []).map((a, idx) => (
                  <tr key={idx} className="text-gray-200">
                    <td className="px-3 py-2">{a.event_name}</td>
                    <td className="px-3 py-2">{a.user_id || '-'}</td>
                    <td className="px-3 py-2 font-mono text-xs text-gray-400 truncate max-w-[24rem]">{shorten(JSON.stringify(a.event_data))}</td>
                    <td className="px-3 py-2">{new Date(a.created_at).toLocaleString()}</td>
                  </tr>
                ))}
                {(!activityQuery.data?.length && !activityQuery.isLoading) && (
                  <tr><td className="px-3 py-4" colSpan={4}>No activity yet.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  )
}

// ---------- UI Bits ----------

function MetricCard({
  title,
  value,
  sub,
  loading,
  accent = 'primary',
  children,
}: {
  title: string
  value: number | string | undefined
  sub?: string
  loading?: boolean
  accent?: 'primary' | 'emerald' | 'gold'
  children?: React.ReactNode
}) {
  const isNumber = typeof value === 'number'
  const animated = useCountUp(isNumber ? (value as number) : null)
  const displayValue = loading
    ? '—'
    : isNumber
    ? animated
    : value ?? '—'
  return (
    <Card className="bg-gray-900 border-gray-800">
      <div className="text-sm text-gray-400">{title}</div>
      <div className="mt-1 flex items-baseline gap-2">
        <div className="text-3xl font-semibold text-gray-100 tabular-nums">{displayValue}</div>
        {sub && <div className="text-xs text-gray-400">{sub}</div>}
      </div>
      {children && <div className="mt-2">{children}</div>}
    </Card>
  )
}

function Sparkline({ data, color }: { data: Array<{ t: string; v: number }>; color: string }) {
  const formatted = useMemo(() => (data || []).map((d) => ({ t: d.t, v: d.v })), [data])
  const [R, setR] = useState<any>(null)
  useEffect(() => { let mounted=true; (async()=>{ try{ const mod = await import('recharts'); if(mounted) setR(mod) }catch{} })(); return ()=>{ mounted=false } }, [])
  if (!R) return <div className="h-12" />
  return (
    <div className="h-12">
      <R.ResponsiveContainer width="100%" height="100%">
        <R.AreaChart data={formatted}>
          <defs>
            <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.6} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <R.Area type="monotone" dataKey="v" stroke={color} fill="url(#grad)" strokeWidth={2} />
        </R.AreaChart>
      </R.ResponsiveContainer>
    </div>
  )
}

const pieColors = ['#eab308', '#f59e0b', '#3b82f6', '#6b7280', '#d1d5db']

// ---------- Utils ----------

function toCSV(rows: any[]): string {
  const out: string[] = []
  for (const r of rows) {
    out.push(`SECTION,${r.section}`)
    if (Array.isArray(r.data)) {
      for (const item of r.data) {
        out.push(csvLine(item))
      }
    } else if (r.data && typeof r.data === 'object') {
      out.push(csvLine(r.data))
    }
  }
  return out.join('\n')
}

function csvLine(obj: any): string {
  const entries = Object.entries(obj || {})
  return entries.map(([, v]) => escapeCsv(String(v))).join(',')
}

function escapeCsv(v: string): string {
  if (v.includes(',') || v.includes('\n') || v.includes('"')) {
    return '"' + v.replace(/"/g, '""') + '"'
  }
  return v
}

function fmtPct(v?: number) {
  if (v == null || isNaN(v)) return '—'
  const sign = v > 0 ? '+' : ''
  return `${sign}${(v * 100).toFixed(1)}%`
}

function fmtINR(v?: number | string) {
  const n = typeof v === 'string' ? Number(v) : v
  if (n == null || isNaN(n)) return '—'
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
}

function shorten(s: string, max = 80) {
  if (s.length <= max) return s
  return s.slice(0, max - 1) + '…'
}

function useCountUp(target: number | null, durationMs = 600) {
  const [display, setDisplay] = useState<number>(typeof target === 'number' ? target : 0)
  useEffect(() => {
    if (typeof target !== 'number') {
      setDisplay(0)
      return
    }
    let raf = 0
    const start = performance.now()
    const from = display
    const delta = target - from
    function tick(now: number) {
      const t = Math.min(1, (now - start) / durationMs)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(Math.round(from + delta * eased))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target])
  return typeof target === 'number' ? display : null
}
