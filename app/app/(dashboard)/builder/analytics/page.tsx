"use client"

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { TrendingUp, Users, Clock, DollarSign, Target, BarChart3, Calendar, ArrowUp, ArrowDown } from 'lucide-react'

interface DashboardAnalytics {
  overview: {
    total_leads: number
    new_leads_this_period: number
    hot_leads: number
    warm_leads: number
    active_conversations: number
    avg_response_time: number
    conversion_rate: number
  }
  lead_quality: {
    hot: { count: number; percentage: number }
    warm: { count: number; percentage: number }
    developing: { count: number; percentage: number }
    cold: { count: number; percentage: number }
    low_quality: { count: number; percentage: number }
  }
  funnel: {
    total_visitors: number
    engaged_users: number
    high_intent: number
    contacted: number
    meetings_scheduled: number
    offers_made: number
    deals_closed: number
    conversion_rates: {
      visitor_to_engaged: number
      engaged_to_high_intent: number
      high_intent_to_contacted: number
      contacted_to_meeting: number
      meeting_to_offer: number
      offer_to_close: number
      overall: number
    }
  }
  score_trends: {
    dates: string[]
    avg_scores: number[]
    hot_lead_counts: number[]
    new_lead_counts: number[]
  }
  activity_by_hour: Record<number, number>
  activity_by_day: Record<string, number>
  top_properties: Array<{
    property_id: string
    property_title: string
    view_count: number
    unique_viewers: number
    avg_engagement_time: number
    lead_count: number
    conversion_rate: number
  }>
  response_metrics: {
    avg_first_response_time: number
    avg_response_time: number
    response_rate: number
    pending_responses: number
    overdue_followups: number
  }
  revenue: {
    pipeline_value: number
    expected_revenue: number
    closed_deals_value: number
    avg_deal_size: number
    projected_monthly: number
  }
  lead_sources: Array<{
    source: string
    count: number
    percentage: number
    avg_quality_score: number
    conversion_rate: number
  }>
  comparison?: {
    period: string
    metrics: Record<string, { current: number; previous: number; change: number }>
  }
}

async function fetchAnalytics(period: string, compare: boolean) {
  const params = new URLSearchParams({ period, compare: compare.toString() })
  const res = await fetch(`/api/analytics/dashboard?${params}`)
  if (!res.ok) throw new Error('Failed to fetch analytics')
  const json = await res.json()
  return json.data as DashboardAnalytics
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', { 
    style: 'currency', 
    currency: 'INR',
    maximumFractionDigits: 0 
  }).format(amount)
}

function formatNumber(num: number) {
  return new Intl.NumberFormat('en-IN').format(num)
}

export default function AnalyticsDashboard() {
  const [period, setPeriod] = useState('30d')
  const [compare, setCompare] = useState(false)
  
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['analytics', period, compare],
    queryFn: () => fetchAnalytics(period, compare),
  })
  
  if (isLoading) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="text-sm text-fgMuted">Loading analytics...</div>
      </main>
    )
  }
  
  if (!analytics) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="text-sm text-fgMuted">No analytics data available</div>
      </main>
    )
  }
  
  return (
    <main className="mx-auto max-w-7xl px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-2">Analytics Dashboard</h1>
          <p className="text-sm text-fgMuted">Complete metrics and insights for your leads</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 border border-border rounded text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="this_month">This Month</option>
            <option value="last_month">Last Month</option>
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={compare}
              onChange={(e) => setCompare(e.target.checked)}
              className="rounded"
            />
            Compare
          </label>
        </div>
      </div>
      
      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="border border-border rounded p-4 bg-white">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-fgMuted">Total Leads</div>
            <Users className="w-4 h-4 text-fgMuted" />
          </div>
          <div className="text-2xl font-bold">{formatNumber(analytics.overview.total_leads)}</div>
          <div className="text-xs text-fgMuted mt-1">
            {analytics.overview.new_leads_this_period} new this period
          </div>
        </div>
        
        <div className="border border-border rounded p-4 bg-white">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-fgMuted">Conversion Rate</div>
            <Target className="w-4 h-4 text-fgMuted" />
          </div>
          <div className="text-2xl font-bold">{analytics.overview.conversion_rate.toFixed(1)}%</div>
          <div className="text-xs text-fgMuted mt-1">
            {analytics.overview.hot_leads} hot leads
          </div>
        </div>
        
        <div className="border border-border rounded p-4 bg-white">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-fgMuted">Avg Response Time</div>
            <Clock className="w-4 h-4 text-fgMuted" />
          </div>
          <div className="text-2xl font-bold">{analytics.overview.avg_response_time}m</div>
          <div className="text-xs text-fgMuted mt-1">
            {analytics.overview.active_conversations} active conversations
          </div>
        </div>
        
        <div className="border border-border rounded p-4 bg-white">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-fgMuted">Pipeline Value</div>
            <DollarSign className="w-4 h-4 text-fgMuted" />
          </div>
          <div className="text-2xl font-bold">{formatCurrency(analytics.revenue.pipeline_value)}</div>
          <div className="text-xs text-fgMuted mt-1">
            {formatCurrency(analytics.revenue.projected_monthly)}/month projected
          </div>
        </div>
      </div>
      
      {/* Lead Quality Distribution */}
      <div className="border border-border rounded p-6 bg-white">
        <h2 className="text-lg font-semibold mb-4">Lead Quality Distribution</h2>
        <div className="overflow-auto border border-border rounded">
          <table className="min-w-[720px] w-full text-sm">
            <thead>
              <tr className="bg-muted/40">
                <th className="text-left p-3">Category</th>
                <th className="text-left p-3">Count</th>
                <th className="text-left p-3">Percentage</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-border">
                <td className="p-3 font-medium">Hot Lead</td>
                <td className="p-3">{analytics.lead_quality.hot.count}</td>
                <td className="p-3">{analytics.lead_quality.hot.percentage}%</td>
              </tr>
              <tr className="border-t border-border">
                <td className="p-3 font-medium">Warm Lead</td>
                <td className="p-3">{analytics.lead_quality.warm.count}</td>
                <td className="p-3">{analytics.lead_quality.warm.percentage}%</td>
              </tr>
              <tr className="border-t border-border">
                <td className="p-3 font-medium">Developing Lead</td>
                <td className="p-3">{analytics.lead_quality.developing.count}</td>
                <td className="p-3">{analytics.lead_quality.developing.percentage}%</td>
              </tr>
              <tr className="border-t border-border">
                <td className="p-3 font-medium">Cold Lead</td>
                <td className="p-3">{analytics.lead_quality.cold.count}</td>
                <td className="p-3">{analytics.lead_quality.cold.percentage}%</td>
              </tr>
              <tr className="border-t border-border">
                <td className="p-3 font-medium">Low Quality</td>
                <td className="p-3">{analytics.lead_quality.low_quality.count}</td>
                <td className="p-3">{analytics.lead_quality.low_quality.percentage}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Conversion Funnel */}
      <div className="border border-border rounded p-6 bg-white">
        <h2 className="text-lg font-semibold mb-4">Conversion Funnel</h2>
        <div className="overflow-auto border border-border rounded">
          <table className="min-w-[720px] w-full text-sm">
            <thead>
              <tr className="bg-muted/40">
                <th className="text-left p-3">Stage</th>
                <th className="text-left p-3">Count</th>
                <th className="text-left p-3">Conversion Rate</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-border">
                <td className="p-3 font-medium">Total Visitors</td>
                <td className="p-3">{formatNumber(analytics.funnel.total_visitors)}</td>
                <td className="p-3">—</td>
              </tr>
              <tr className="border-t border-border">
                <td className="p-3 font-medium">Engaged Users</td>
                <td className="p-3">{formatNumber(analytics.funnel.engaged_users)}</td>
                <td className="p-3">{analytics.funnel.conversion_rates.visitor_to_engaged.toFixed(1)}%</td>
              </tr>
              <tr className="border-t border-border">
                <td className="p-3 font-medium">High Intent</td>
                <td className="p-3">{formatNumber(analytics.funnel.high_intent)}</td>
                <td className="p-3">{analytics.funnel.conversion_rates.engaged_to_high_intent.toFixed(1)}%</td>
              </tr>
              <tr className="border-t border-border">
                <td className="p-3 font-medium">Contacted</td>
                <td className="p-3">{formatNumber(analytics.funnel.contacted)}</td>
                <td className="p-3">{analytics.funnel.conversion_rates.high_intent_to_contacted.toFixed(1)}%</td>
              </tr>
              <tr className="border-t border-border">
                <td className="p-3 font-medium">Meetings Scheduled</td>
                <td className="p-3">{formatNumber(analytics.funnel.meetings_scheduled)}</td>
                <td className="p-3">{analytics.funnel.conversion_rates.contacted_to_meeting.toFixed(1)}%</td>
              </tr>
              <tr className="border-t border-border">
                <td className="p-3 font-medium">Offers Made</td>
                <td className="p-3">{formatNumber(analytics.funnel.offers_made)}</td>
                <td className="p-3">{analytics.funnel.conversion_rates.meeting_to_offer.toFixed(1)}%</td>
              </tr>
              <tr className="border-t border-border">
                <td className="p-3 font-medium">Deals Closed</td>
                <td className="p-3">{formatNumber(analytics.funnel.deals_closed)}</td>
                <td className="p-3">{analytics.funnel.conversion_rates.offer_to_close.toFixed(1)}%</td>
              </tr>
              <tr className="border-t border-border bg-muted/20">
                <td className="p-3 font-bold">Overall Conversion</td>
                <td className="p-3">—</td>
                <td className="p-3 font-bold">{analytics.funnel.conversion_rates.overall.toFixed(2)}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Revenue Metrics */}
      <div className="border border-border rounded p-6 bg-white">
        <h2 className="text-lg font-semibold mb-4">Revenue Projections</h2>
        <div className="overflow-auto border border-border rounded">
          <table className="min-w-[720px] w-full text-sm">
            <thead>
              <tr className="bg-muted/40">
                <th className="text-left p-3">Metric</th>
                <th className="text-left p-3">Value</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-border">
                <td className="p-3 font-medium">Pipeline Value</td>
                <td className="p-3">{formatCurrency(analytics.revenue.pipeline_value)}</td>
              </tr>
              <tr className="border-t border-border">
                <td className="p-3 font-medium">Expected Revenue</td>
                <td className="p-3">{formatCurrency(analytics.revenue.expected_revenue)}</td>
              </tr>
              <tr className="border-t border-border">
                <td className="p-3 font-medium">Closed Deals Value</td>
                <td className="p-3">{formatCurrency(analytics.revenue.closed_deals_value)}</td>
              </tr>
              <tr className="border-t border-border">
                <td className="p-3 font-medium">Avg Deal Size</td>
                <td className="p-3">{formatCurrency(analytics.revenue.avg_deal_size)}</td>
              </tr>
              <tr className="border-t border-border">
                <td className="p-3 font-medium">Projected Monthly</td>
                <td className="p-3">{formatCurrency(analytics.revenue.projected_monthly)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Response Metrics */}
      <div className="border border-border rounded p-6 bg-white">
        <h2 className="text-lg font-semibold mb-4">Response Performance</h2>
        <div className="overflow-auto border border-border rounded">
          <table className="min-w-[720px] w-full text-sm">
            <thead>
              <tr className="bg-muted/40">
                <th className="text-left p-3">Metric</th>
                <th className="text-left p-3">Value</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-border">
                <td className="p-3 font-medium">Avg First Response Time</td>
                <td className="p-3">{analytics.response_metrics.avg_first_response_time}m</td>
              </tr>
              <tr className="border-t border-border">
                <td className="p-3 font-medium">Avg Response Time</td>
                <td className="p-3">{analytics.response_metrics.avg_response_time}m</td>
              </tr>
              <tr className="border-t border-border">
                <td className="p-3 font-medium">Response Rate</td>
                <td className="p-3">{analytics.response_metrics.response_rate.toFixed(1)}%</td>
              </tr>
              <tr className="border-t border-border">
                <td className="p-3 font-medium">Pending Responses</td>
                <td className="p-3">{analytics.response_metrics.pending_responses}</td>
              </tr>
              <tr className="border-t border-border">
                <td className="p-3 font-medium">Overdue Follow-ups</td>
                <td className="p-3">{analytics.response_metrics.overdue_followups}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Top Properties */}
      {analytics.top_properties.length > 0 && (
        <div className="border border-border rounded p-6 bg-white">
          <h2 className="text-lg font-semibold mb-4">Top Properties</h2>
          <div className="overflow-auto border border-border rounded">
            <table className="min-w-[720px] w-full text-sm">
              <thead>
                <tr className="bg-muted/40">
                  <th className="text-left p-3">Property</th>
                  <th className="text-left p-3">Views</th>
                  <th className="text-left p-3">Unique Viewers</th>
                  <th className="text-left p-3">Avg Engagement</th>
                  <th className="text-left p-3">Leads</th>
                </tr>
              </thead>
              <tbody>
                {analytics.top_properties.map((prop) => (
                  <tr key={prop.property_id} className="border-t border-border">
                    <td className="p-3 font-medium">{prop.property_title}</td>
                    <td className="p-3">{formatNumber(prop.view_count)}</td>
                    <td className="p-3">{formatNumber(prop.unique_viewers)}</td>
                    <td className="p-3">{prop.avg_engagement_time}s</td>
                    <td className="p-3">{formatNumber(prop.lead_count)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Lead Sources */}
      {analytics.lead_sources.length > 0 && (
        <div className="border border-border rounded p-6 bg-white">
          <h2 className="text-lg font-semibold mb-4">Lead Sources</h2>
          <div className="overflow-auto border border-border rounded">
            <table className="min-w-[720px] w-full text-sm">
              <thead>
                <tr className="bg-muted/40">
                  <th className="text-left p-3">Source</th>
                  <th className="text-left p-3">Count</th>
                  <th className="text-left p-3">Percentage</th>
                  <th className="text-left p-3">Avg Quality Score</th>
                </tr>
              </thead>
              <tbody>
                {analytics.lead_sources.map((source) => (
                  <tr key={source.source} className="border-t border-border">
                    <td className="p-3 font-medium">{source.source}</td>
                    <td className="p-3">{formatNumber(source.count)}</td>
                    <td className="p-3">{source.percentage}%</td>
                    <td className="p-3">{source.avg_quality_score.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  )
}

