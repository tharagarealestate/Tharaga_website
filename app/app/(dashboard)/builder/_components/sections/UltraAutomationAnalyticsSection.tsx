"use client"

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Target,
  Clock,
  Users,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Activity,
  PieChart as PieChartIcon,
  ArrowUpRight,
  ArrowDownRight,
  Handshake,
  FileText,
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Area,
  AreaChart,
} from 'recharts'
import { cn } from '@/lib/utils'
import { SectionWrapper } from './SectionWrapper'
import { useQuery } from '@tanstack/react-query'
import { useDealLifecycles, useViewings, useNegotiations, useContracts } from '../ultra-automation/hooks/useUltraAutomationData'
import { detectStallingDeals, calculateConversionFunnel, analyzeNegotiations, analyzeContracts } from '../ultra-automation/utils/dataProcessing'
import { LoadingSpinner, GlassLoadingOverlay } from '@/components/ui/loading-spinner'
import { builderGlassPanel, builderGlassSubPanel } from '../builderGlassStyles'

interface UltraAutomationAnalyticsSectionProps {
  onNavigate?: (section: string) => void
}

export function UltraAutomationAnalyticsSection({ onNavigate }: UltraAutomationAnalyticsSectionProps) {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('30d')

  // Fetch all Ultra Automation data
  const { data: lifecycleData, isLoading: lifecycleLoading } = useDealLifecycles({})
  const { data: viewingsData, isLoading: viewingsLoading } = useViewings({})
  const { data: negotiationsData, isLoading: negotiationsLoading } = useNegotiations({})
  const { data: contractsData, isLoading: contractsLoading } = useContracts({})

  const lifecycles = lifecycleData?.lifecycles || []
  const viewings = viewingsData?.viewings || []
  const negotiations = negotiationsData?.negotiations || []
  const contracts = Array.isArray(contractsData) ? contractsData : []
  
  // Check for empty states
  const isEmpty = 
    (lifecycleData?.isEmpty || lifecycles.length === 0) &&
    (viewingsData?.isEmpty || viewings.length === 0) &&
    (negotiationsData?.isEmpty || negotiations.length === 0) &&
    contracts.length === 0

  // Calculate analytics
  const analytics = useMemo(() => {
    // Conversion funnel
    const funnel = calculateConversionFunnel(lifecycles)
    
    // Stalling analysis
    const stalling = detectStallingDeals(lifecycles, {
      warningDays: 7,
      criticalDays: 14,
    })

    // Negotiation analysis
    const negotiationAnalysis = analyzeNegotiations(negotiations)

    // Contract analysis
    const contractAnalysis = analyzeContracts(contracts)

    // Viewing statistics
    const viewingStats = {
      total: viewings.length,
      scheduled: viewings.filter((v: any) => v.status === 'scheduled').length,
      completed: viewings.filter((v: any) => v.status === 'completed').length,
      completionRate: viewings.length > 0 
        ? (viewings.filter((v: any) => v.status === 'completed').length / viewings.length) * 100 
        : 0,
    }

    // Calculate average time per stage
    const avgTimePerStage: Record<string, number> = {}
    funnel.stages.forEach((stage) => {
      avgTimePerStage[stage.stage] = stage.avgDays
    })

    // Overall metrics
    const totalDeals = lifecycles.length
    const activeDeals = lifecycles.filter((l: any) => l.current_stage !== 'closed').length
    const closedDeals = lifecycles.filter((l: any) => l.current_stage === 'closed').length
    const conversionRate = totalDeals > 0 ? (closedDeals / totalDeals) * 100 : 0

    return {
      funnel,
      stalling,
      negotiationAnalysis,
      contractAnalysis,
      viewingStats,
      avgTimePerStage,
      totalDeals,
      activeDeals,
      closedDeals,
      conversionRate,
    }
  }, [lifecycles, viewings, negotiations, contracts])

  const isLoading = lifecycleLoading || viewingsLoading || negotiationsLoading || contractsLoading

  // Prepare chart data
  const funnelChartData = analytics.funnel.stages.map((stage) => ({
    name: stage.stage.replace(/_/g, ' ').toUpperCase(),
    value: stage.count,
    percentage: stage.percentage,
    avgDays: stage.avgDays,
  }))

  const stageTimeData = Object.entries(analytics.avgTimePerStage).map(([stage, days]) => ({
    stage: stage.replace(/_/g, ' ').toUpperCase(),
    days: Math.round(days),
  }))

  const COLORS = ['#D4AF37', '#10B981', '#3B82F6', '#F97316', '#EF4444', '#8B5CF6']

  return (
    <div className="space-y-6">
      {/* Header - Design System Typography */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4"
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Ultra Automation Analytics</h1>
        <p className="text-slate-300 text-base sm:text-lg max-w-2xl">
          Comprehensive insights into automation performance, conversion metrics, and optimization opportunities.
        </p>
      </motion.div>

      {/* Period Filter - Design System */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl overflow-hidden shadow-2xl"
      >
        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-2">
            {(['7d', '30d', '90d', 'all'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  'px-6 py-3 rounded-lg text-sm font-medium transition-all capitalize',
                  period === p
                    ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30'
                    : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                )}
              >
                {p === 'all' ? 'All Time' : p}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Content - Design System Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl overflow-hidden shadow-2xl"
      >
        <div className="p-6 sm:p-8">
          {isLoading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-300 mx-auto mb-4"></div>
                <p className="text-slate-400">Loading analytics...</p>
              </div>
            </div>
          ) : isEmpty ? (
            <div className="text-center py-16 px-6">
              <div className="p-4 bg-slate-700/30 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <Activity className="h-10 w-10 text-slate-500" />
              </div>
              <h4 className="text-xl font-semibold text-white mb-2">No Automation Data Yet</h4>
              <p className="text-slate-400">
                Automation analytics will appear here once you have deals, viewings, negotiations, or contracts.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Key Metrics - Design System Statistics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                  icon={Target}
                  label="Overall Conversion"
                  value={`${analytics.conversionRate.toFixed(1)}%`}
                  trend={{ value: 12.5, positive: true }}
                  color="text-emerald-400"
                />
                <MetricCard
                  icon={Activity}
                  label="Active Deals"
                  value={analytics.activeDeals}
                  subtitle={`${analytics.closedDeals} closed`}
                  color="text-blue-400"
                />
                <MetricCard
                  icon={AlertTriangle}
                  label="Stalled Deals"
                  value={analytics.stalling.stalled.length}
                  subtitle={`${analytics.stalling.atRisk.length} at risk`}
                  color="text-red-400"
                  urgent
                />
                <MetricCard
                  icon={CheckCircle2}
                  label="Viewing Completion"
                  value={`${analytics.viewingStats.completionRate.toFixed(1)}%`}
                  subtitle={`${analytics.viewingStats.completed}/${analytics.viewingStats.total}`}
                  color="text-amber-400"
                />
              </div>

              {/* Conversion Funnel - Design System Container */}
              <div className="bg-slate-800/95 glow-border rounded-lg border border-slate-700/50 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">Conversion Funnel</h3>
                  <p className="text-sm text-gray-400">Deal progression through all stages</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-emerald-400">
                    {analytics.funnel.overallConversion.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-400">Overall Conversion</div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Funnel Bar Chart */}
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={funnelChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fill: '#9CA3AF', fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={100}
                      />
                      <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(0, 0, 0, 0.8)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar dataKey="value" fill="#D4AF37" radius={[8, 8, 0, 0]}>
                        {funnelChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Stage Details */}
                <div className="space-y-3">
                  {analytics.funnel.stages.map((stage, index) => (
                    <StageCard
                      key={stage.stage}
                      stage={stage}
                      color={COLORS[index % COLORS.length]}
                      isBottleneck={analytics.funnel.bottleneckStages.includes(stage.stage)}
                    />
                  ))}
                </div>
              </div>
            </div>

              {/* Stage Time Analysis - Design System Container */}
              <div className="bg-slate-800/95 glow-border rounded-lg border border-slate-700/50 p-6">
              <h3 className="text-xl font-bold text-white mb-6">Average Time Per Stage</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stageTimeData}>
                    <defs>
                      <linearGradient id="colorDays" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                    <XAxis 
                      dataKey="stage" 
                      tick={{ fill: '#9CA3AF', fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={100}
                    />
                    <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="days"
                      stroke="#D4AF37"
                      fillOpacity={1}
                      fill="url(#colorDays)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

              {/* Negotiation & Contract Metrics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Negotiation Metrics - Design System Container */}
                <div className="bg-slate-800/95 glow-border rounded-lg border border-slate-700/50 p-6">
                <h3 className="text-xl font-bold text-white mb-6">Negotiation Metrics</h3>
                <div className="space-y-4">
                  <StatRow
                    label="Active Negotiations"
                    value={analytics.negotiationAnalysis.activeCount}
                    icon={Handshake}
                    color="text-blue-400"
                  />
                  <StatRow
                    label="Avg Price Gap"
                    value={`${analytics.negotiationAnalysis.avgPriceGap.toFixed(1)}%`}
                    icon={TrendingUp}
                    color="text-orange-400"
                  />
                  <StatRow
                    label="Success Probability"
                    value={`${analytics.negotiationAnalysis.successProbability.toFixed(1)}%`}
                    icon={Target}
                    color="text-emerald-400"
                  />
                </div>
              </div>

                {/* Contract Metrics - Design System Container */}
                <div className="bg-slate-800/95 glow-border rounded-lg border border-slate-700/50 p-6">
                <h3 className="text-xl font-bold text-white mb-6">Contract Metrics</h3>
                <div className="space-y-4">
                  <StatRow
                    label="Total Contracts"
                    value={contracts.length}
                    icon={FileText}
                    color="text-blue-400"
                  />
                  <StatRow
                    label="Signed This Month"
                    value={analytics.contractAnalysis.signedThisMonth}
                    icon={CheckCircle2}
                    color="text-emerald-400"
                  />
                  <StatRow
                    label="Urgent (Pending)"
                    value={analytics.contractAnalysis.urgent.length}
                    icon={AlertTriangle}
                    color="text-red-400"
                    urgent
                  />
                </div>
              </div>
            </div>

              {/* Bottleneck Alerts - Design System */}
              {analytics.funnel.bottleneckStages.length > 0 && (
                <div className="bg-rose-500/20 border border-rose-400/50 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <AlertTriangle className="w-6 h-6 text-orange-400" />
                  <h3 className="text-xl font-bold text-orange-400">
                    Bottleneck Stages Detected
                  </h3>
                </div>
                <p className="text-sm text-gray-300 mb-4">
                  These stages are taking more than 2x the average time. Consider optimizing these processes.
                </p>
                <div className="flex flex-wrap gap-2">
                  {analytics.funnel.bottleneckStages.map((stage) => (
                    <span
                      key={stage}
                      className="px-4 py-2 bg-orange-500/20 border border-orange-500/30 rounded-lg text-sm text-orange-400"
                    >
                      {stage.replace(/_/g, ' ').toUpperCase()}
                    </span>
                  ))}
                </div>
              </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

function MetricCard({
  icon: Icon,
  label,
  value,
  subtitle,
  trend,
  color,
  urgent,
}: {
  icon: any
  label: string
  value: string | number
  subtitle?: string
  trend?: { value: number; positive: boolean }
  color: string
  urgent?: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('p-6 bg-slate-800/95 glow-border rounded-lg border border-slate-700/50', urgent && 'border-rose-500/30 bg-rose-500/5')}
    >
      <div className="flex items-center justify-between mb-4">
        <Icon className={cn('h-8 w-8', color)} />
        {trend && (
          <div className={cn(
            'flex items-center gap-1 text-xs font-medium',
            trend.positive ? 'text-emerald-300' : 'text-rose-300'
          )}>
            {trend.positive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
          </div>
        )}
      </div>
      <p className={cn('text-2xl font-bold text-white mb-1', color)}>{value}</p>
      <p className="text-sm text-slate-400">{label}</p>
      {subtitle && (
        <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
      )}
    </motion.div>
  )
}

function StageCard({
  stage,
  color,
  isBottleneck,
}: {
  stage: { stage: string; count: number; percentage: number; avgDays: number }
  color: string
  isBottleneck: boolean
}) {
  return (
    <div className={cn('p-4 bg-slate-700/30 rounded-lg border border-slate-600/30', isBottleneck && 'border-rose-500/30 bg-rose-500/5')}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold text-white">
          {stage.stage.replace(/_/g, ' ').toUpperCase()}
        </h4>
        {isBottleneck && (
          <AlertTriangle className="w-4 h-4 text-orange-400" />
        )}
      </div>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-lg font-bold text-white">{stage.count}</div>
          <div className="text-xs text-gray-400">{stage.percentage.toFixed(1)}%</div>
        </div>
        <div className="text-right">
          <div className="text-sm font-medium text-gray-300">{stage.avgDays.toFixed(1)} days</div>
          <div className="text-xs text-gray-500">avg time</div>
        </div>
      </div>
    </div>
  )
}

function StatRow({
  label,
  value,
  icon: Icon,
  color,
  urgent,
}: {
  label: string
  value: string | number
  icon: any
  color: string
  urgent?: boolean
}) {
  return (
    <div className={cn('flex items-center justify-between p-4 rounded-lg bg-slate-700/30', urgent && 'border border-rose-500/30')}>
      <div className="flex items-center gap-3">
        <Icon className={cn('w-5 h-5', color)} />
        <span className="text-gray-300">{label}</span>
      </div>
      <span className={cn('text-lg font-bold', color)}>{value}</span>
    </div>
  )
}

