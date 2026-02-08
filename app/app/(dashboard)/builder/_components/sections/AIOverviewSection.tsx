"use client"

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingUp,
  TrendingDown,
  Users,
  Building2,
  DollarSign,
  Activity,
  AlertCircle,
  Sparkles,
  BarChart3,
  PieChart,
  LineChart,
  Target,
  Zap,
  Lightbulb,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react'
import { BuilderPageWrapper } from '../BuilderPageWrapper'
import { StandardStatsCard } from '../design-system/StandardStatsCard'
import {
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  BarChart,
  PieChart as RechartsPieChart,
  AreaChart,
  Area,
  Line,
  Bar,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ComposedChart
} from 'recharts'
import { AIInsightsPanel } from './overview-components/AIInsightsPanel'
import { AnomalyAlerts } from './overview-components/AnomalyAlerts'
import { RecommendationsPanel } from './overview-components/RecommendationsPanel'
import { TrendSparkline } from './overview-components/TrendSparkline'
import { PerformanceHeatmap } from './overview-components/PerformanceHeatmap'

interface DashboardData {
  metrics: {
    total_leads: number
    hot_leads: number
    warm_leads: number
    total_properties: number
    active_properties: number
    total_revenue: number
    monthly_revenue: number
    conversion_rate: number
    avg_response_time: number
    lead_trends: Array<{ date: string; count: number }>
    property_performance: Array<{ property_id: string; views: number; inquiries: number }>
    revenue_trends: Array<{ date: string; revenue: number }>
  }
  aiInsights: {
    keyFindings: string[]
    performanceSummary: string
    trendAnalysis: string
    opportunities: string[]
    risks: string[]
  }
  marketInsights: {
    marketTrends: Array<{
      title: string
      description: string
      impact: string
      confidence: number
    }>
    competitiveAnalysis: any
    recommendations: string[]
  }
  anomalies: Array<{
    type: string
    severity: string
    title: string
    description: string
    recommendation: string
  }>
  recommendations: Array<{
    title: string
    description: string
    priority: string
    category: string
    impact: string
    effort: string
  }>
  generatedAt?: string
}

interface OverviewSectionProps {
  onNavigate?: (section: string) => void
}

const COLORS = {
  primary: '#F59E0B',
  secondary: '#3B82F6',
  success: '#10B981',
  danger: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
  purple: '#8B5CF6',
  orange: '#F97316'
}

const CHART_COLORS = [COLORS.primary, COLORS.secondary, COLORS.success, COLORS.purple, COLORS.orange]

export function AIOverviewSection({ onNavigate }: OverviewSectionProps) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('30d')

  const fetchData = useCallback(async () => {
    const startTime = Date.now();
    console.log('[AI Overview] fetchData started at', new Date().toISOString());
    
    try {
      setRefreshing(true)
      console.log('[AI Overview] Making API request to /api/builder/overview/ai-insights...');
      
      const response = await fetch('/api/builder/overview/ai-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include' // Ensure cookies are sent
      })

      console.log('[AI Overview] API response status:', response.status, response.statusText);
      const result = await response.json()
      console.log('[AI Overview] API response data:', {
        success: result.success,
        hasData: !!result.data,
        error: result.error,
        debug: result.debug
      });
      
      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 401) {
          console.error('[AI Overview] Authentication error:', result.error, result.debug)
          // Don't set data to null, show empty state instead
          setData(null)
          return
        }
        console.error('[AI Overview] API error response:', {
          status: response.status,
          error: result.error,
          debug: result.debug
        });
        throw new Error(result.error || 'Failed to fetch dashboard data')
      }

      if (result.success && result.data) {
        console.log('[AI Overview] Successfully loaded data:', {
          metrics: result.data.metrics ? 'present' : 'missing',
          aiInsights: result.data.aiInsights ? 'present' : 'missing',
          marketInsights: result.data.marketInsights ? 'present' : 'missing',
          duration: result.debug?.duration
        });
        setData(result.data)
      } else {
        // If API returns success:false but no error, create empty data structure
        console.warn('[AI Overview] API returned success:false:', result)
        setData(null)
      }
    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error('[AI Overview] Error fetching dashboard data after', duration, 'ms:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      // Set data to null to show error state
      setData(null)
    } finally {
      setLoading(false)
      setRefreshing(false)
      const duration = Date.now() - startTime;
      console.log('[AI Overview] fetchData completed in', duration, 'ms');
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const getTrendIcon = (value: number, reverse = false) => {
    if (reverse) {
      if (value > 0) return <ArrowDownRight className="w-4 h-4 text-red-500" />
      if (value < 0) return <ArrowUpRight className="w-4 h-4 text-emerald-500" />
    } else {
      if (value > 0) return <ArrowUpRight className="w-4 h-4 text-emerald-500" />
      if (value < 0) return <ArrowDownRight className="w-4 h-4 text-red-500" />
    }
    return <Minus className="w-4 h-4 text-gray-500" />
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value)
  }

  if (loading) {
    return (
      <BuilderPageWrapper
        title="AI-Powered Overview"
        description="Intelligent insights and analytics for your real estate business"
        noContainer
      >
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400 mx-auto mb-4"></div>
            <p className="text-slate-400">Loading AI insights...</p>
          </div>
        </div>
      </BuilderPageWrapper>
    )
  }

  if (!data) {
    return (
      <BuilderPageWrapper
        title="AI-Powered Overview"
        description="Intelligent insights and analytics for your real estate business"
        noContainer
      >
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-slate-400 mb-2">Failed to load dashboard data</p>
          <p className="text-xs text-slate-500 mb-4">
            Check browser console for detailed error logs
          </p>
          <button
            onClick={fetchData}
            disabled={refreshing}
            className="mt-4 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Retrying...' : 'Retry'}
          </button>
        </div>
      </BuilderPageWrapper>
    )
  }

  const { metrics, aiInsights, marketInsights, anomalies, recommendations } = data

  // Prepare chart data
  const leadTrendData = metrics.lead_trends.slice(-30).map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    leads: item.count
  }))

  const revenueTrendData = metrics.revenue_trends.length > 0
    ? metrics.revenue_trends.slice(-30).map(item => ({
        date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: item.revenue
      }))
    : leadTrendData.map(item => ({ date: item.date, revenue: 0 }))

  const leadCategoryData = [
    { name: 'Hot Leads', value: metrics.hot_leads, color: COLORS.danger },
    { name: 'Warm Leads', value: metrics.warm_leads, color: COLORS.warning },
    { name: 'Other Leads', value: metrics.total_leads - metrics.hot_leads - metrics.warm_leads, color: COLORS.info }
  ].filter(item => item.value > 0)

  const propertyPerformanceData = metrics.property_performance.slice(0, 5).map(p => ({
    name: `Property ${p.property_id.slice(0, 8)}`,
    views: p.views,
    inquiries: p.inquiries,
    conversion: p.views > 0 ? ((p.inquiries / p.views) * 100).toFixed(1) : 0
  }))

  return (
    <BuilderPageWrapper
      title="AI-Powered Overview"
      description="Intelligent insights and analytics powered by OpenAI and advanced reasoning"
      noContainer
    >
      <div className="space-y-6">
        {/* Header with Refresh */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-amber-400" />
              AI Dashboard Overview
            </h2>
            <p className="text-slate-400 mt-1">
              Last updated: {data?.generatedAt ? new Date(data.generatedAt).toLocaleString() : 'Never'}
            </p>
          </div>
          <button
            onClick={fetchData}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition text-white"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Anomaly Alerts */}
        {anomalies.length > 0 && (
          <AnomalyAlerts anomalies={anomalies} />
        )}

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StandardStatsCard
            title="Total Leads"
            value={metrics.total_leads}
            icon={<Users className="w-5 h-5" />}
            trend={leadTrendData.length > 1 ? {
              value: ((leadTrendData[leadTrendData.length - 1].leads - leadTrendData[0].leads) / leadTrendData[0].leads) * 100,
              label: 'vs last period'
            } : undefined}
          />
          <StandardStatsCard
            title="Hot Leads"
            value={metrics.hot_leads}
            icon={<Zap className="w-5 h-5" />}
            subtitle={`${metrics.total_leads > 0 ? ((metrics.hot_leads / metrics.total_leads) * 100).toFixed(1) : 0}% of total`}
          />
          <StandardStatsCard
            title="Active Properties"
            value={metrics.active_properties}
            icon={<Building2 className="w-5 h-5" />}
            subtitle={`${metrics.total_properties} total`}
          />
          <StandardStatsCard
            title="Monthly Revenue"
            value={formatCurrency(metrics.monthly_revenue)}
            icon={<DollarSign className="w-5 h-5" />}
            trend={revenueTrendData.length > 1 ? {
              value: ((revenueTrendData[revenueTrendData.length - 1].revenue - revenueTrendData[0].revenue) / (revenueTrendData[0].revenue || 1)) * 100,
              label: 'vs last period'
            } : undefined}
          />
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-semibold text-white">Conversion Rate</h3>
              </div>
              {getTrendIcon(metrics.conversion_rate - 10)}
            </div>
            <div className="text-3xl font-bold text-white mb-2">
              {metrics.conversion_rate.toFixed(1)}%
            </div>
            <p className="text-sm text-slate-400">
              Industry avg: 12-15%
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-semibold text-white">Avg Response Time</h3>
              </div>
              {getTrendIcon(2.5 - metrics.avg_response_time, true)}
            </div>
            <div className="text-3xl font-bold text-white mb-2">
              {metrics.avg_response_time.toFixed(1)}h
            </div>
            <p className="text-sm text-slate-400">
              Target: &lt;2 hours
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-semibold text-white">Total Revenue</h3>
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-2">
              {formatCurrency(metrics.total_revenue)}
            </div>
            <p className="text-sm text-slate-400">
              All-time revenue
            </p>
          </motion.div>
        </div>

        {/* AI Insights Panel */}
        <AIInsightsPanel insights={aiInsights} marketInsights={marketInsights} />

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Lead Trends Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <LineChart className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-semibold text-white">Lead Generation Trends</h3>
              </div>
              <TrendSparkline data={leadTrendData.map(d => d.leads)} />
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={leadTrendData}>
                <defs>
                  <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
                <YAxis stroke="#9CA3AF" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="leads"
                  stroke={COLORS.primary}
                  fillOpacity={1}
                  fill="url(#colorLeads)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Revenue Trends Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-semibold text-white">Revenue Trends</h3>
              </div>
              <TrendSparkline data={revenueTrendData.map(d => d.revenue)} />
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={revenueTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
                <YAxis stroke="#9CA3AF" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Bar dataKey="revenue" fill={COLORS.success} radius={[4, 4, 0, 0]} />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke={COLORS.primary}
                  strokeWidth={2}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Lead Distribution & Property Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Lead Category Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl p-6"
          >
            <div className="flex items-center gap-2 mb-6">
              <PieChart className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-semibold text-white">Lead Distribution</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={leadCategoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {leadCategoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
              </RechartsPieChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Property Performance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl p-6"
          >
            <div className="flex items-center gap-2 mb-6">
              <Building2 className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-semibold text-white">Top Properties Performance</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={propertyPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} />
                <YAxis stroke="#9CA3AF" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Legend />
                <Bar dataKey="views" fill={COLORS.info} name="Views" />
                <Bar dataKey="inquiries" fill={COLORS.success} name="Inquiries" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Performance Heatmap */}
        {metrics.property_performance.length > 0 && (
          <PerformanceHeatmap data={metrics.property_performance} />
        )}

        {/* Recommendations Panel */}
        {recommendations.length > 0 && (
          <RecommendationsPanel recommendations={recommendations} />
        )}
      </div>
    </BuilderPageWrapper>
  )
}
