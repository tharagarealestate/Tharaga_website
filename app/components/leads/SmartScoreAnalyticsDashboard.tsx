'use client'

import { useState, useEffect, useCallback } from 'react'
import { BarChart3, TrendingUp, Users, DollarSign, Target, AlertTriangle, RefreshCw, Download, Filter } from 'lucide-react'
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Select } from '@/components/ui/SelectGroup'
import { useSmartScoreAnalytics, ScoreAnalytics } from '@/hooks/useSmartScore'
import { getSupabase } from '@/lib/supabase'
import { format } from 'date-fns'

interface SmartScoreAnalyticsDashboardProps {
  period?: '7d' | '30d' | '90d' | '1y'
  variant?: 'full' | 'compact'
}

const COLORS = {
  hot: '#D4AF37',
  warm: '#10b981',
  developing: '#f59e0b',
  cold: '#6b7280',
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#10b981'
}

const TIER_COLORS = ['#D4AF37', '#10b981', '#f59e0b', '#6b7280']

export default function SmartScoreAnalyticsDashboard({
  period = '30d',
  variant = 'full'
}: SmartScoreAnalyticsDashboardProps) {
  const { analytics, loading, error, refresh } = useSmartScoreAnalytics(period)
  const [selectedPeriod, setSelectedPeriod] = useState(period)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const supabase = getSupabase()

  // Real-time subscription for analytics updates
  useEffect(() => {
    // Subscribe to leads table changes for this builder
    let mounted = true

    async function setupSubscription() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !mounted) return

      const channel = supabase
        .channel('smartscore_analytics_updates')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'leads',
            filter: `builder_id=eq.${user.id}`
          },
          (payload) => {
            // If score-related fields changed, refresh analytics
            if (
              payload.new.smartscore_v2 !== payload.old?.smartscore_v2 ||
              payload.new.conversion_probability !== payload.old?.conversion_probability ||
              payload.new.priority_tier !== payload.old?.priority_tier
            ) {
              console.log('🔄 Lead score updated, refreshing analytics')
              if (mounted) {
                refresh()
              }
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'smartscore_history'
          },
          () => {
            // New score history entry, refresh analytics
            if (mounted) {
              refresh()
            }
          }
        )
        .subscribe()

      return () => {
        mounted = false
        supabase.removeChannel(channel)
      }
    }

    const cleanup = setupSubscription()
    return () => {
      mounted = false
      cleanup.then(fn => fn && fn())
    }
  }, [supabase, refresh])

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await refresh()
    } finally {
      setIsRefreshing(false)
    }
  }, [refresh])

  const handleExport = useCallback(() => {
    if (!analytics) return

    const data = {
      period: selectedPeriod,
      generated_at: new Date().toISOString(),
      ...analytics
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `smartscore-analytics-${selectedPeriod}-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [analytics, selectedPeriod])

  if (loading && !analytics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 relative overflow-hidden p-6">
        <div className="max-w-7xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden transition-all duration-500 backdrop-blur-xl bg-white/10 border border-white/20 p-12">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-white/10 rounded w-1/3" />
              <div className="h-64 bg-white/10 rounded" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error && !analytics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 relative overflow-hidden p-6">
        <div className="max-w-7xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden transition-all duration-500 backdrop-blur-xl bg-white/10 border border-red-500/30 p-12 text-center">
            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-400">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return null
  }

  // Prepare chart data
  const tierDistributionData = [
    { name: 'Hot', value: analytics.tier_distribution.hot, color: COLORS.hot },
    { name: 'Warm', value: analytics.tier_distribution.warm, color: COLORS.warm },
    { name: 'Developing', value: analytics.tier_distribution.developing, color: COLORS.developing },
    { name: 'Cold', value: analytics.tier_distribution.cold, color: COLORS.cold }
  ]

  const scoreRangesData = Object.entries(analytics.score_ranges).map(([range, count]) => ({
    range,
    count,
    percentage: analytics.overview.total_leads > 0 
      ? (count / analytics.overview.total_leads) * 100 
      : 0
  }))

  const churnRiskData = [
    { name: 'High Risk', value: analytics.churn_risk_analysis.high_risk, color: COLORS.high },
    { name: 'Medium Risk', value: analytics.churn_risk_analysis.medium_risk, color: COLORS.medium },
    { name: 'Low Risk', value: analytics.churn_risk_analysis.low_risk, color: COLORS.low }
  ]

  const trendsData = analytics.trends.map(trend => ({
    date: trend.date,
    avg_score: parseFloat(trend.avg_score?.toString() || '0'),
    hot_leads: parseInt(trend.hot_leads?.toString() || '0')
  }))

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 relative overflow-hidden p-6">
      {/* Animated Background Elements */}
      <div className='absolute inset-0 opacity-30'>
        <div className='absolute top-20 left-10 w-96 h-96 bg-gold-500 rounded-full blur-3xl animate-pulse-slow' />
        <div 
          className='absolute bottom-20 right-10 w-[600px] h-[600px] bg-emerald-500 rounded-full blur-3xl animate-pulse-slow' 
          style={{ animationDelay: '1s' }} 
        />
      </div>

      <div className="max-w-7xl mx-auto relative z-10 space-y-6">
        {/* Header */}
        <div className="relative rounded-3xl overflow-hidden transition-all duration-500 backdrop-blur-xl bg-white/10 border border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3 flex-1">
              <div className="bg-gold-500/20 border border-gold-500/30 rounded-lg p-2 sm:p-3 flex-shrink-0">
                <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-gold-500" />
              </div>
              <div className="min-w-0">
                <h2 className="text-xl sm:text-2xl font-bold text-white">SmartScore Analytics</h2>
                <p className="text-sm sm:text-base text-white/60">Comprehensive lead qualification insights</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto">
              <Select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as '7d' | '30d' | '90d' | '1y')}
                className="bg-white/5 border-white/20 text-white flex-1 sm:w-40 text-sm sm:text-base min-h-[44px]"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </Select>
              <Button
                variant="invisible"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="text-white/70 hover:text-white hover:bg-white/10 min-h-[44px] min-w-[44px]"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                variant="invisible"
                size="sm"
                onClick={handleExport}
                className="text-white/70 hover:text-white hover:bg-white/10 min-h-[44px] min-w-[44px]"
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="group relative rounded-3xl overflow-hidden transition-all duration-500 backdrop-blur-xl bg-white/10 border border-white/20 hover:bg-white/15 hover:border-white/30 p-4 sm:p-6">
            <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none' />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-5 h-5 text-white/60" />
                <Badge className="bg-emerald-500/20 border-emerald-500/30 text-emerald-400">
                  Total
                </Badge>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-white mb-1">
                {analytics.overview.total_leads}
              </div>
              <div className="text-xs sm:text-sm text-white/60">Active Leads</div>
            </div>
          </div>

          <div className="group relative rounded-3xl overflow-hidden transition-all duration-500 backdrop-blur-xl bg-white/10 border border-white/20 hover:bg-white/15 hover:border-white/30 p-6">
            <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none' />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <Target className="w-5 h-5 text-white/60" />
                <Badge className="bg-gold-500/20 border-gold-500/30 text-gold-400">
                  Avg
                </Badge>
              </div>
              <div className="text-3xl font-bold text-gold-400 mb-1">
                {analytics.overview.avg_score.toFixed(1)}
              </div>
              <div className="text-sm text-white/60">Average SmartScore</div>
            </div>
          </div>

          <div className="group relative rounded-3xl overflow-hidden transition-all duration-500 backdrop-blur-xl bg-white/10 border border-white/20 hover:bg-white/15 hover:border-white/30 p-6">
            <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none' />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-5 h-5 text-white/60" />
                <Badge className="bg-emerald-500/20 border-emerald-500/30 text-emerald-400">
                  {(analytics.overview.avg_conversion_prob * 100).toFixed(1)}%
                </Badge>
              </div>
              <div className="text-3xl font-bold text-emerald-400 mb-1">
                {(analytics.overview.avg_conversion_prob * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-white/60">Avg Conversion Prob</div>
            </div>
          </div>

          <div className="group relative rounded-3xl overflow-hidden transition-all duration-500 backdrop-blur-xl bg-white/10 border border-white/20 hover:bg-white/15 hover:border-white/30 p-6">
            <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none' />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-5 h-5 text-white/60" />
                <Badge className="bg-gold-500/20 border-gold-500/30 text-gold-400">
                  LTV
                </Badge>
              </div>
              <div className="text-3xl font-bold text-gold-400 mb-1">
                ₹{(analytics.overview.total_predicted_revenue / 100000).toFixed(1)}L
              </div>
              <div className="text-sm text-white/60">Predicted Revenue</div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tier Distribution Pie Chart */}
          <div className="group relative rounded-3xl overflow-hidden transition-all duration-500 backdrop-blur-xl bg-white/10 border border-white/20 hover:bg-white/15 hover:border-white/30 p-6">
            <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none' />
            <div className="relative z-10">
              <h3 className="text-lg font-semibold text-white mb-4">Lead Tier Distribution</h3>
              {analytics.overview.total_leads > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={tierDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {tierDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-300 flex items-center justify-center">
                  <p className="text-white/60">No data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Score Ranges Bar Chart */}
          <div className="group relative rounded-3xl overflow-hidden transition-all duration-500 backdrop-blur-xl bg-white/10 border border-white/20 hover:bg-white/15 hover:border-white/30 p-6">
            <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none' />
            <div className="relative z-10">
              <h3 className="text-lg font-semibold text-white mb-4">Score Distribution</h3>
              {scoreRangesData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={scoreRangesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis 
                      dataKey="range" 
                      stroke="rgba(255,255,255,0.5)"
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis 
                      stroke="rgba(255,255,255,0.5)"
                      style={{ fontSize: '12px' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                      formatter={(value: any) => [value, 'Leads']}
                    />
                    <Bar dataKey="count" fill="#D4AF37" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-300 flex items-center justify-center">
                  <p className="text-white/60">No data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Trends Line Chart */}
          {trendsData.length > 0 && (
            <div className="group relative rounded-3xl overflow-hidden transition-all duration-500 backdrop-blur-xl bg-white/10 border border-white/20 hover:bg-white/15 hover:border-white/30 p-6 lg:col-span-2">
              <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none' />
              <div className="relative z-10">
                <h3 className="text-lg font-semibold text-white mb-4">Score Trends Over Time</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={trendsData}>
                    <defs>
                      <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis 
                      dataKey="date" 
                      stroke="rgba(255,255,255,0.5)"
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis 
                      stroke="rgba(255,255,255,0.5)"
                      style={{ fontSize: '12px' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                    />
                    <Legend 
                      wrapperStyle={{ color: '#fff', fontSize: '12px' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="avg_score"
                      stroke="#D4AF37"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorTrend)"
                      name="Avg Score"
                    />
                    <Line
                      type="monotone"
                      dataKey="hot_leads"
                      stroke="#10b981"
                      strokeWidth={2}
                      name="Hot Leads"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Churn Risk Analysis */}
          <div className="group relative rounded-3xl overflow-hidden transition-all duration-500 backdrop-blur-xl bg-white/10 border border-white/20 hover:bg-white/15 hover:border-white/30 p-6">
            <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none' />
            <div className="relative z-10">
              <h3 className="text-lg font-semibold text-white mb-4">Churn Risk Analysis</h3>
              {analytics.overview.total_leads > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={churnRiskData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {churnRiskData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-300 flex items-center justify-center">
                  <p className="text-white/60">No data available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* High Value Leads Table */}
        {analytics.high_value_leads.length > 0 && (
          <div className="group relative rounded-3xl overflow-hidden transition-all duration-500 backdrop-blur-xl bg-white/10 border border-white/20 hover:bg-white/15 hover:border-white/30 p-6">
            <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none' />
            <div className="relative z-10">
              <h3 className="text-lg font-semibold text-white mb-4">High Value Leads (Top 10)</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-white/80">Lead ID</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-white/80">SmartScore</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-white/80">Conversion Prob</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-white/80">Predicted LTV</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.high_value_leads.map((lead, idx) => (
                      <tr key={lead.lead_id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="py-3 px-4 text-sm text-white/70">#{lead.lead_id}</td>
                        <td className="py-3 px-4">
                          <Badge className={`${
                            lead.smartscore >= 80 ? 'bg-gold-500/20 border-gold-500/30 text-gold-400' :
                            lead.smartscore >= 60 ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' :
                            'bg-white/10 border-white/20 text-white/60'
                          }`}>
                            {lead.smartscore.toFixed(1)}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm text-white/70">
                          {(lead.conversion_probability * 100).toFixed(1)}%
                        </td>
                        <td className="py-3 px-4 text-sm text-gold-400 font-semibold">
                          ₹{(lead.predicted_ltv / 100000).toFixed(1)}L
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

