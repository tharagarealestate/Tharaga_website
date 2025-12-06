"use client"

import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Eye, Users, MessageSquare, TrendingUp, TrendingDown, Building2, Download } from 'lucide-react'
import { Select } from '@/components/ui'
import { format } from 'date-fns'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

// Simple empty state when no properties exist
function EmptyPropertiesState() {
  return (
    <div className="glass-card p-12 rounded-2xl text-center bg-white border border-gray-200">
      <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
      <h3 className="text-xl font-bold text-gray-900 mb-2">No properties yet</h3>
      <p className="text-gray-600 mb-6">List your first property to see performance analytics</p>
      <a href="/builders/add-property" className="inline-flex items-center gap-2 px-4 py-2 bg-gold-500 hover:bg-gold-600 text-primary-950 rounded-lg font-semibold">
        List your first property
      </a>
    </div>
  )
}

async function fetchBuilderProperties() {
  const res = await fetch('/api/builder/properties', { next: { revalidate: 0 } as any })
  if (!res.ok) throw new Error('Failed to load properties')
  const j = await res.json()
  return (j.items || []) as Array<{ id: string; title: string }>
}

async function fetchPropertyAnalytics(propertyId: string | undefined, dateRange: string) {
  if (!propertyId) return null
  const params = new URLSearchParams({ property_id: propertyId, dateRange })
  const res = await fetch(`/api/builder/property-analytics?${params.toString()}`, { next: { revalidate: 0 } as any })
  if (!res.ok) throw new Error('Failed to load analytics')
  return await res.json()
}

const CHART_COLORS = ['#D4AF37', '#2563EB', '#10B981', '#F59E0B', '#8B5CF6']

type MetricCardProps = {
  title: string
  value: any
  change?: number
  icon: any
  color: 'primary' | 'purple' | 'amber' | 'emerald'
}

function MetricCard({ title, value, change, icon: Icon, color }: MetricCardProps) {
  const colors = {
    primary: { bg: 'bg-primary-100', text: 'text-primary-600' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
    amber: { bg: 'bg-amber-100', text: 'text-amber-600' },
    emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600' },
  } as const

  return (
    <div className="glass-card p-6 rounded-xl bg-white border border-gray-200">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 ${colors[color].bg} rounded-xl flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${colors[color].text}`} />
        </div>
        {typeof change === 'number' && !Number.isNaN(change) && (
          <div className={`flex items-center gap-1 text-sm font-semibold ${change > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {change > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      <div className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">{value ?? '—'}</div>
      <div className="text-sm text-gray-600">{title}</div>
    </div>
  )
}

// Simple inline heatmap using CSS grid, 7x24
function EngagementHeatmap({ data }: { data: Array<{ day: number; hour: number; value: number }> | undefined }) {
  const cells = useMemo(() => {
    const arr: number[][] = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0))
    ;(data || []).forEach(d => {
      if (d.day >= 0 && d.day < 7 && d.hour >= 0 && d.hour < 24) arr[d.day][d.hour] = d.value
    })
    return arr
  }, [data])

  const max = Math.max(1, ...cells.flat())
  return (
    <div className="grid grid-cols-24 gap-1">
      {cells.map((row, day) => (
        <div key={day} className="contents">
          {row.map((v, hour) => {
            const intensity = v / max
            const bg = intensity === 0 ? 'bg-gray-100' : ''
            const color = `rgba(16, 185, 129, ${Math.max(0.15, intensity)})` // emerald
            return (
              <div key={hour} className={`h-4 w-4 rounded ${bg}`} style={{ backgroundColor: intensity === 0 ? undefined : color }} />
            )
          })}
        </div>
      ))}
    </div>
  )
}

export default function PropertyPerformancePage() {
  const [selectedProperty, setSelectedProperty] = useState<{ id: string; title: string } | null>(null)
  const [dateRange, setDateRange] = useState<'7days' | '30days' | '90days'>('30days')

  const { data: properties } = useQuery({
    queryKey: ['builder-properties'],
    queryFn: fetchBuilderProperties,
  })

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['property-analytics', selectedProperty?.id, dateRange],
    queryFn: () => fetchPropertyAnalytics(selectedProperty?.id, dateRange),
    enabled: !!selectedProperty,
  })

  useEffect(() => {
    if (properties?.length && !selectedProperty) setSelectedProperty(properties[0])
  }, [properties, selectedProperty])

  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' }>({ key: 'date', dir: 'desc' })

  const sortedDaily = useMemo(() => {
    const rows = analytics?.daily_breakdown || []
    const sorted = [...rows].sort((a: any, b: any) => {
      const k = sort.key as keyof typeof a
      const av = a[k]
      const bv = b[k]
      if (av === bv) return 0
      return (av > bv ? 1 : -1) * (sort.dir === 'asc' ? 1 : -1)
    })
    return sorted
  }, [analytics?.daily_breakdown, sort])

  function toggleSort(key: string) {
    setSort(s => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' }))
  }

  function exportCsv() {
    const rows = analytics?.daily_breakdown || []
    const header = ['Date', 'Views', 'Unique Visitors', 'Avg. Time', 'Inquiries', 'Conversion']
    const lines = [header.join(',')]
    for (const d of rows) {
      lines.push([
        d.date,
        d.views,
        d.unique_visitors,
        d.avg_time,
        d.inquiries,
        d.conversion_rate,
      ].join(','))
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `property-analytics-${selectedProperty?.id}-${dateRange}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!selectedProperty && (properties?.length ?? 0) === 0) return <EmptyPropertiesState />
  if (!selectedProperty) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Property Performance</h1>
          <p className="text-gray-600 mt-1">Analyze views, engagement, and conversions</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-64">
            <Select
              value={selectedProperty.id}
              onChange={(e) => {
                const id = (e.target as HTMLSelectElement).value
                const p = (properties || []).find((p: any) => p.id === id) || null
                setSelectedProperty(p)
              }}
            >
              {(properties || []).map((p: any) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </Select>
          </div>

          <div className="w-40">
            <Select value={dateRange} onChange={(e) => setDateRange((e.target as HTMLSelectElement).value as any)}>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
            </Select>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        <MetricCard title="Total Views" value={analytics?.total_views} change={analytics?.views_change} icon={Eye} color="primary" />
        <MetricCard title="Unique Visitors" value={analytics?.unique_visitors} change={analytics?.visitors_change} icon={Users} color="purple" />
        <MetricCard title="Total Inquiries" value={analytics?.total_inquiries} change={analytics?.inquiries_change} icon={MessageSquare} color="amber" />
        <MetricCard title="Conversion Rate" value={typeof analytics?.conversion_rate === 'number' ? `${analytics?.conversion_rate}%` : analytics?.conversion_rate} change={analytics?.conversion_change} icon={TrendingUp} color="emerald" />
      </div>

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Views Over Time */}
        <div className="glass-card p-6 rounded-2xl bg-white border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Views Over Time</h3>
          <div className="h-[250px] md:h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={analytics?.views_trend || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="date" stroke="#6B7280" fontSize={12} />
              <YAxis stroke="#6B7280" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: '#FFFFFF' }} />
              <Line type="monotone" dataKey="views" stroke="#D4AF37" strokeWidth={3} dot={{ fill: '#D4AF37', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
          </div>
        </div>

        {/* Inquiry Sources */}
        <div className="glass-card p-6 rounded-2xl bg-white border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Inquiry Sources</h3>
          <div className="h-[250px] md:h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={analytics?.inquiry_sources || []} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={100} fill="#8884d8" dataKey="value">
                {(analytics?.inquiry_sources || []).map((_: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          </div>
        </div>

        {/* Engagement Heatmap */}
        <div className="glass-card p-6 rounded-2xl bg-white border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Engagement Heatmap</h3>
          <div className="text-sm text-gray-600 mb-4">Peak activity times (Day × Hour)</div>
          <EngagementHeatmap data={analytics?.engagement_heatmap} />
        </div>

        {/* Conversion Funnel */}
        <div className="glass-card p-6 rounded-2xl bg-white border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Conversion Funnel</h3>
          <div className="space-y-3">
            {(() => {
              const totalViews = Number(analytics?.total_views || 0)
              const saves = Number(analytics?.saves || 0)
              const inquiries = Number(analytics?.total_inquiries || 0)
              const siteVisits = Number(analytics?.site_visits || 0)
              const conversions = Number(analytics?.conversions || 0)
              const stages = [
                { stage: 'Views', count: totalViews, color: 'bg-blue-500', percentage: 100 },
                { stage: 'Saves', count: saves, color: 'bg-purple-500', percentage: totalViews ? Number(((saves / totalViews) * 100).toFixed(1)) : 0 },
                { stage: 'Inquiries', count: inquiries, color: 'bg-amber-500', percentage: totalViews ? Number(((inquiries / totalViews) * 100).toFixed(1)) : 0 },
                { stage: 'Site Visits', count: siteVisits, color: 'bg-orange-500', percentage: inquiries ? Number(((siteVisits / inquiries) * 100).toFixed(1)) : 0 },
                { stage: 'Conversions', count: conversions, color: 'bg-emerald-500', percentage: Number(analytics?.conversion_rate || 0) },
              ]
              return stages.map((item, index) => (
                <div key={item.stage}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">{item.stage}</span>
                    <span className="text-sm font-bold text-gray-900">{item.count} ({item.percentage}%)</span>
                  </div>
                  <div className="relative h-8 bg-gray-100 rounded-lg overflow-hidden">
                    <div className={`${item.color} h-full flex items-center justify-end px-3 text-white text-sm font-semibold transition-all duration-500`} style={{ width: `${item.percentage}%` }}>
                      {index < 4 && (
                        <span className="text-xs">→ {Math.max(0, Math.round((1 - (item.percentage / 100)) * totalViews))} drop-off</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            })()}
          </div>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="glass-card p-6 rounded-2xl bg-white border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Daily Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 cursor-pointer" onClick={() => toggleSort('date')}>Date</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 cursor-pointer" onClick={() => toggleSort('views')}>Views</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 cursor-pointer" onClick={() => toggleSort('unique_visitors')}>Unique Visitors</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 cursor-pointer" onClick={() => toggleSort('avg_time')}>Avg. Time</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 cursor-pointer" onClick={() => toggleSort('inquiries')}>Inquiries</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 cursor-pointer" onClick={() => toggleSort('conversion_rate')}>Conversion</th>
              </tr>
            </thead>
            <tbody>
              {(sortedDaily || []).map((day: any) => (
                <tr key={day.date} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-900">{format(new Date(day.date), 'MMM dd, yyyy')}</td>
                  <td className="py-3 px-4 text-sm text-gray-900 text-right">{day.views}</td>
                  <td className="py-3 px-4 text-sm text-gray-900 text-right">{day.unique_visitors}</td>
                  <td className="py-3 px-4 text-sm text-gray-900 text-right">{day.avg_time}s</td>
                  <td className="py-3 px-4 text-sm text-gray-900 text-right">{day.inquiries}</td>
                  <td className="py-3 px-4 text-sm font-semibold text-emerald-600 text-right">{day.conversion_rate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex justify-end">
          <button onClick={exportCsv} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors inline-flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>
    </div>
  )
}
