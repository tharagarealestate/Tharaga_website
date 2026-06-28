'use client'

import { useState, useEffect, useCallback } from 'react'
import { TrendingUp, TrendingDown, Minus, Calendar, RefreshCw, AlertCircle } from 'lucide-react'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useSmartScore, ScoreHistory } from '@/hooks/useSmartScore'
import { getSupabase } from '@/lib/supabase'
import { format, parseISO } from 'date-fns'

interface SmartScoreHistoryProps {
  leadId: string | number
  days?: number
  variant?: 'glass' | 'compact'
}

interface HistoryDataPoint {
  date: string
  score: number
  conversion_prob: number
  churn_risk: number
  timestamp: string
}

interface TrendData {
  score_trend: 'improving' | 'declining' | 'stable'
  score_change: number
  conversion_prob_trend: 'improving' | 'declining' | 'stable'
  conversion_prob_change: number
  churn_risk_trend: 'improving' | 'declining' | 'stable'
  churn_risk_change: number
}

export default function SmartScoreHistory({
  leadId,
  days = 30,
  variant = 'glass'
}: SmartScoreHistoryProps) {
  const { history, loading, error, fetchHistory } = useSmartScore(leadId)
  const [selectedDays, setSelectedDays] = useState(days)
  const [trends, setTrends] = useState<TrendData | null>(null)
  const [chartData, setChartData] = useState<HistoryDataPoint[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const supabase = getSupabase()

  // Fetch history on mount and when days change
  useEffect(() => {
    if (leadId) {
      loadHistory()
    }
  }, [leadId, selectedDays])

  // Real-time subscription for score updates
  useEffect(() => {
    if (!leadId) return

    const leadIdNum = typeof leadId === 'string' ? parseInt(leadId, 10) : leadId
    if (isNaN(leadIdNum)) return

    // Subscribe to smartscore_history table
    const channel = supabase
      .channel(`smartscore_history:${leadIdNum}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'smartscore_history',
          filter: `lead_id=eq.${leadIdNum}`
        },
        (payload) => {
          console.log('🔄 New score history entry:', payload.new)
          // Refresh history when new entry is added
          loadHistory()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'leads',
          filter: `id=eq.${leadIdNum}`
        },
        (payload) => {
          // If score was updated, refresh history
          if (payload.new.smartscore_v2 !== payload.old?.smartscore_v2) {
            console.log('🔄 Lead score updated, refreshing history')
            loadHistory()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [leadId, supabase])

  const loadHistory = useCallback(async () => {
    try {
      setIsRefreshing(true)
      const data = await fetchHistory(selectedDays)
      if (data) {
        // Data is already in the format { history: [...], trends: {...} }
        processHistoryData(data.history || [], data.trends)
      }
    } catch (err) {
      console.error('Failed to load history:', err)
    } finally {
      setIsRefreshing(false)
    }
  }, [selectedDays, fetchHistory])

  const processHistoryData = (historyData: ScoreHistory[] | any[] | undefined, trendData?: TrendData) => {
    if (!historyData || historyData.length === 0) {
      setChartData([])
      if (historyData && historyData.length === 0) {
        // If we have trends from API, use them
        if (trendData) {
          setTrends(trendData)
        }
      }
      return
    }
    
    // Normalize history data if needed
    const normalizedHistory = historyData.map((item: any) => ({
      id: item.id || item.id?.toString(),
      lead_id: item.lead_id,
      score_value: parseFloat(item.score_value?.toString() || item.score_value || '0'),
      conversion_probability: parseFloat(item.conversion_probability?.toString() || item.conversion_probability || '0'),
      predicted_ltv: parseFloat(item.predicted_ltv?.toString() || item.predicted_ltv || '0'),
      churn_risk: parseFloat(item.churn_risk?.toString() || item.churn_risk || '0'),
      confidence_score: parseFloat(item.confidence_score?.toString() || item.confidence_score || '0'),
      ai_insights: item.ai_insights || {},
      created_at: item.created_at
    }))
    // Process history into chart format
    const processed = normalizedHistory.map(item => ({
      date: format(parseISO(item.created_at), 'MMM dd'),
      score: parseFloat(item.score_value?.toString() || '0'),
      conversion_prob: parseFloat(item.conversion_probability?.toString() || '0') * 100,
      churn_risk: parseFloat(item.churn_risk?.toString() || '0') * 100,
      timestamp: item.created_at
    }))

    setChartData(processed)
    
    // Set trends if provided
    if (trendData) {
      setTrends(trendData)
    } else if (processed.length >= 2) {
      // Calculate trends manually
      const first = processed[0]
      const last = processed[processed.length - 1]
      setTrends({
        score_trend: last.score > first.score + 5 ? 'improving' : last.score < first.score - 5 ? 'declining' : 'stable',
        score_change: last.score - first.score,
        conversion_prob_trend: last.conversion_prob > first.conversion_prob + 5 ? 'improving' : last.conversion_prob < first.conversion_prob - 5 ? 'declining' : 'stable',
        conversion_prob_change: last.conversion_prob - first.conversion_prob,
        churn_risk_trend: last.churn_risk < first.churn_risk - 5 ? 'improving' : last.churn_risk > first.churn_risk + 5 ? 'declining' : 'stable',
        churn_risk_change: last.churn_risk - first.churn_risk
      })
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="w-4 h-4 text-emerald-400" />
      case 'declining':
        return <TrendingDown className="w-4 h-4 text-red-400" />
      default:
        return <Minus className="w-4 h-4 text-gray-400" />
    }
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving':
        return 'text-emerald-400'
      case 'declining':
        return 'text-red-400'
      default:
        return 'text-gray-400'
    }
  }

  if (loading && chartData.length === 0) {
    return (
      <div className="relative group">
        <div className="relative h-full rounded-3xl overflow-hidden transition-all duration-500 backdrop-blur-xl bg-white/10 border border-white/20">
          <div className="relative p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-white/10 rounded w-1/2" />
              <div className="h-64 bg-white/10 rounded" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error && chartData.length === 0) {
    return (
      <div className="relative group">
        <div className="relative h-full rounded-3xl overflow-hidden transition-all duration-500 backdrop-blur-xl bg-white/10 border border-red-500/30">
          <div className="relative p-6">
            <div className="flex items-center gap-2 text-red-400">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm">{error || 'Failed to load history'}</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`
      relative group
      ${variant === 'compact' ? '' : 'lg:scale-105'}
    `}>
      {/* Card Container */}
      <div className={`
        relative h-full
        rounded-3xl overflow-hidden
        transition-all duration-500
        backdrop-blur-xl bg-white/10 border border-white/20
        hover:shadow-2xl hover:-translate-y-2
      `}>
        {/* Shimmer Effect on Hover */}
        <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none' />
        
        <div className='relative p-6'>
          {/* Header */}
          <div className='mb-6 flex items-center justify-between'>
            <div>
              <h3 className='text-xl font-bold text-white flex items-center gap-2 mb-1'>
                <Calendar className='w-5 h-5 text-gold-400' />
                Score History
              </h3>
              <p className='text-gray-400 text-sm'>Trend analysis over time</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="invisible"
                size="sm"
                onClick={loadHistory}
                disabled={isRefreshing}
                className="text-white/70 hover:text-white hover:bg-white/10"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
              <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1 border border-white/10">
                {[7, 30, 90].map(d => (
                  <button
                    key={d}
                    onClick={() => setSelectedDays(d)}
                    className={`px-3 py-1 text-xs rounded transition-all ${
                      selectedDays === d
                        ? 'bg-gold-500/20 text-gold-400 border border-gold-500/30'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {d}d
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Trend Indicators */}
          {trends && (
            <div className='grid grid-cols-3 gap-3 mb-6'>
              <div className='bg-white/5 rounded-xl p-3 border border-white/10'>
                <div className='flex items-center justify-between mb-1'>
                  <span className='text-xs text-gray-400'>Score Trend</span>
                  {getTrendIcon(trends.score_trend)}
                </div>
                <div className={`text-lg font-bold ${getTrendColor(trends.score_trend)}`}>
                  {trends.score_change > 0 ? '+' : ''}{trends.score_change.toFixed(1)}
                </div>
              </div>
              <div className='bg-white/5 rounded-xl p-3 border border-white/10'>
                <div className='flex items-center justify-between mb-1'>
                  <span className='text-xs text-gray-400'>Conversion</span>
                  {getTrendIcon(trends.conversion_prob_trend)}
                </div>
                <div className={`text-lg font-bold ${getTrendColor(trends.conversion_prob_trend)}`}>
                  {trends.conversion_prob_change > 0 ? '+' : ''}{(trends.conversion_prob_change * 100).toFixed(1)}%
                </div>
              </div>
              <div className='bg-white/5 rounded-xl p-3 border border-white/10'>
                <div className='flex items-center justify-between mb-1'>
                  <span className='text-xs text-gray-400'>Churn Risk</span>
                  {getTrendIcon(trends.churn_risk_trend)}
                </div>
                <div className={`text-lg font-bold ${getTrendColor(trends.churn_risk_trend)}`}>
                  {trends.churn_risk_change > 0 ? '+' : ''}{(trends.churn_risk_change * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          )}

          {/* Chart */}
          {chartData.length > 0 ? (
            <div className='mb-4'>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorConversion" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorChurn" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
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
                    domain={[0, 100]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                    labelStyle={{ color: '#D4AF37' }}
                  />
                  <Legend 
                    wrapperStyle={{ color: '#fff', fontSize: '12px' }}
                  />
                  <ReferenceLine y={70} stroke="rgba(212, 175, 55, 0.5)" strokeDasharray="3 3" label={{ value: "Hot Lead", position: "right", fill: "rgba(212, 175, 55, 0.7)" }} />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#D4AF37"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorScore)"
                    name="SmartScore"
                  />
                  <Area
                    type="monotone"
                    dataKey="conversion_prob"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorConversion)"
                    name="Conversion %"
                  />
                  <Area
                    type="monotone"
                    dataKey="churn_risk"
                    stroke="#ef4444"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorChurn)"
                    name="Churn Risk %"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className='h-64 flex items-center justify-center bg-white/5 rounded-xl border border-white/10'>
              <div className='text-center'>
                <Calendar className='w-12 h-12 text-white/20 mx-auto mb-2' />
                <p className='text-white/60 text-sm'>No history data available</p>
                <p className='text-white/40 text-xs mt-1'>Scores will appear here as they are calculated</p>
              </div>
            </div>
          )}

          {/* Summary Stats */}
          {chartData.length > 0 && (
            <div className='grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/10'>
              <div className='text-center'>
                <div className='text-xs text-gray-400 mb-1'>Avg Score</div>
                <div className='text-lg font-bold text-white'>
                  {(chartData.reduce((sum, d) => sum + d.score, 0) / chartData.length).toFixed(1)}
                </div>
              </div>
              <div className='text-center'>
                <div className='text-xs text-gray-400 mb-1'>Peak Score</div>
                <div className='text-lg font-bold text-gold-400'>
                  {Math.max(...chartData.map(d => d.score)).toFixed(1)}
                </div>
              </div>
              <div className='text-center'>
                <div className='text-xs text-gray-400 mb-1'>Data Points</div>
                <div className='text-lg font-bold text-white'>
                  {chartData.length}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

