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

const glassPrimary = 'bg-white/[0.03] backdrop-blur-[20px] border border-white/[0.08] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]'
const glassSecondary = 'bg-white/[0.02] backdrop-blur-[12px] border border-white/[0.05] rounded-xl'

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
  const contracts = contractsData || []

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
    <SectionWrapper>
      <div className="w-full max-w-7xl mx-auto space-y-6 py-6">
        {/* Header */}
        <header className="space-y-2">
          <h1 className="font-display text-4xl font-bold text-white sm:text-5xl">
            Ultra Automation Analytics
          </h1>
          <p className="text-base text-blue-100/80 sm:text-lg max-w-2xl">
            Comprehensive insights into automation performance, conversion metrics, and optimization opportunities.
          </p>
        </header>

        {/* Period Filter */}
        <div className={glassPrimary + ' p-4'}>
          <div className="flex items-center gap-2">
            {(['7d', '30d', '90d', 'all'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  'px-4 py-2 rounded-lg border text-sm font-medium transition-all',
                  period === p
                    ? 'bg-gold-500/20 border-gold-500/40 text-gold-400'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                )}
              >
                {p === 'all' ? 'All Time' : p}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="relative min-h-[400px]">
            <GlassLoadingOverlay />
          </div>
        ) : (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                color="text-gold-400"
              />
            </div>

            {/* Conversion Funnel */}
            <div className={glassPrimary + ' p-6'}>
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

            {/* Stage Time Analysis */}
            <div className={glassPrimary + ' p-6'}>
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
              {/* Negotiation Metrics */}
              <div className={glassPrimary + ' p-6'}>
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

              {/* Contract Metrics */}
              <div className={glassPrimary + ' p-6'}>
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

            {/* Bottleneck Alerts */}
            {analytics.funnel.bottleneckStages.length > 0 && (
              <div className={glassPrimary + ' p-6 border border-orange-500/30 bg-orange-500/5'}>
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
          </>
        )}
      </div>
    </SectionWrapper>
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
      className={cn(glassPrimary, 'p-6', urgent && 'border-orange-500/30 bg-orange-500/5')}
    >
      <div className="flex items-start justify-between mb-4">
        <Icon className={cn('w-6 h-6', color)} />
        {trend && (
          <div className={cn(
            'flex items-center gap-1 text-xs font-medium',
            trend.positive ? 'text-emerald-400' : 'text-red-400'
          )}>
            {trend.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>
      <div className={cn('text-3xl font-bold mb-1', color)}>{value}</div>
      <div className="text-sm text-gray-400">{label}</div>
      {subtitle && (
        <div className="text-xs text-gray-500 mt-1">{subtitle}</div>
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
    <div className={cn(glassSecondary, 'p-4 border', isBottleneck && 'border-orange-500/30 bg-orange-500/5')}>
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
    <div className={cn('flex items-center justify-between p-4 rounded-lg bg-white/5', urgent && 'border border-red-500/30')}>
      <div className="flex items-center gap-3">
        <Icon className={cn('w-5 h-5', color)} />
        <span className="text-gray-300">{label}</span>
      </div>
      <span className={cn('text-lg font-bold', color)}>{value}</span>
    </div>
  )
}

