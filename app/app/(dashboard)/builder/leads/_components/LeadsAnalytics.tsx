'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Target,
  Calendar,
  DollarSign,
  BarChart3
} from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

interface AnalyticsData {
  conversion_rate: number
  conversion_trend: 'up' | 'down' | 'stable'
  avg_response_time: number
  response_time_trend: 'up' | 'down' | 'stable'
  total_value: number
  value_trend: 'up' | 'down' | 'stable'
  leads_by_source: Array<{
    source: string
    count: number
    percentage: number
  }>
  leads_by_status: Array<{
    status: string
    count: number
    percentage: number
  }>
  conversion_funnel: Array<{
    stage: string
    count: number
    percentage: number
  }>
}

export function LeadsAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setLoading(true)
        const response = await fetch('/api/leads/analytics')
        if (response.ok) {
          const data = await response.json()
          setAnalytics(data)
        } else {
          setError('Failed to load analytics')
        }
      } catch (err) {
        console.error('Error fetching analytics:', err)
        setError('Failed to load analytics')
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
    // Refresh every 5 minutes
    const interval = setInterval(fetchAnalytics, 300000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl p-12 shadow-2xl">
        <div className="flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  if (error || !analytics) {
    return (
      <div className="bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl p-12 shadow-2xl">
        <div className="text-center">
          <BarChart3 className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Failed to Load Analytics</h3>
          <p className="text-slate-400">{error || 'No data available'}</p>
        </div>
      </div>
    )
  }

  const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'stable' }) => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-green-400" />
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-400" />
    return <div className="w-4 h-4 border-2 border-slate-400 rounded-full" />
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl p-6 shadow-2xl"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
              <Target className="w-6 h-6 text-green-400" />
            </div>
            <TrendIcon trend={analytics.conversion_trend} />
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            {analytics.conversion_rate.toFixed(1)}%
          </div>
          <div className="text-sm text-slate-400">Conversion Rate</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl p-6 shadow-2xl"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-400" />
            </div>
            <TrendIcon trend={analytics.response_time_trend} />
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            {analytics.avg_response_time.toFixed(0)}h
          </div>
          <div className="text-sm text-slate-400">Avg Response Time</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl p-6 shadow-2xl"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-amber-400" />
            </div>
            <TrendIcon trend={analytics.value_trend} />
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            ₹{(analytics.total_value / 100000).toFixed(1)}L
          </div>
          <div className="text-sm text-slate-400">Total Pipeline Value</div>
        </motion.div>
      </div>

      {/* Leads by Source */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl p-6 shadow-2xl"
      >
        <h3 className="text-lg font-semibold text-white mb-4">Leads by Source</h3>
        <div className="space-y-3">
          {analytics.leads_by_source.map((source, index) => (
            <div key={source.source} className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-white">{source.source || 'Unknown'}</span>
                  <span className="text-sm text-slate-400">{source.count} leads</span>
                </div>
                <div className="w-full bg-slate-700/50 rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${source.percentage}%` }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full"
                  />
                </div>
              </div>
              <span className="text-sm font-semibold text-slate-300 w-12 text-right">
                {source.percentage.toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Conversion Funnel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl p-6 shadow-2xl"
      >
        <h3 className="text-lg font-semibold text-white mb-4">Conversion Funnel</h3>
        <div className="space-y-3">
          {analytics.conversion_funnel.map((stage, index) => (
            <div key={stage.stage} className="flex items-center gap-4">
              <div className="w-24 text-sm text-slate-400">{stage.stage}</div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-white">{stage.count} leads</span>
                  <span className="text-sm text-slate-400">{stage.percentage.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-700/50 rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${stage.percentage}%` }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

