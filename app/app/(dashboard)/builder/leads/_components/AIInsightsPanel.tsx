'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Sparkles, 
  TrendingUp, 
  AlertTriangle, 
  Lightbulb, 
  Zap,
  Clock,
  Target,
  ArrowRight
} from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

interface AIInsight {
  id: string
  type: 'recommendation' | 'warning' | 'opportunity' | 'action'
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  lead_id?: string
  lead_name?: string
  action?: {
    label: string
    url: string
  }
  confidence: number
  created_at: string
}

export function AIInsightsPanel() {
  const [insights, setInsights] = useState<AIInsight[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchInsights() {
      try {
        setLoading(true)
        // Fetch AI insights from API
        const response = await fetch('/api/leads/ai-insights')
        if (response.ok) {
          const data = await response.json()
          setInsights(data.insights || [])
        } else {
          setError('Failed to load insights')
        }
      } catch (err) {
        console.error('Error fetching insights:', err)
        setError('Failed to load insights')
      } finally {
        setLoading(false)
      }
    }

    fetchInsights()
    // Refresh every 60 seconds
    const interval = setInterval(fetchInsights, 60000)
    return () => clearInterval(interval)
  }, [])

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'recommendation':
        return <Lightbulb className="w-5 h-5" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />
      case 'opportunity':
        return <TrendingUp className="w-5 h-5" />
      case 'action':
        return <Zap className="w-5 h-5" />
      default:
        return <Sparkles className="w-5 h-5" />
    }
  }

  const getInsightColor = (type: string, priority: string) => {
    if (type === 'warning') return 'from-red-500/20 to-rose-500/20 border-red-500/50'
    if (type === 'opportunity') return 'from-green-500/20 to-emerald-500/20 border-green-500/50'
    if (priority === 'high') return 'from-amber-500/20 to-yellow-500/20 border-amber-500/50'
    return 'from-blue-500/20 to-cyan-500/20 border-blue-500/50'
  }

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl p-12 shadow-2xl">
        <div className="flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl p-12 shadow-2xl">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Failed to Load Insights</h3>
          <p className="text-slate-400">{error}</p>
        </div>
      </div>
    )
  }

  if (insights.length === 0) {
    return (
      <div className="bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl p-12 shadow-2xl">
        <div className="text-center">
          <Sparkles className="w-16 h-16 text-purple-400/50 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No AI Insights Yet</h3>
          <p className="text-slate-400 mb-6">
            AI insights will appear here as we analyze your leads and identify opportunities
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
            <Clock className="w-4 h-4" />
            <span>Insights are generated in real-time as leads are processed</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {insights.map((insight, index) => (
          <motion.div
            key={insight.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: index * 0.1 }}
            className={`bg-gradient-to-br ${getInsightColor(insight.type, insight.priority)} border rounded-xl p-6 shadow-lg`}
          >
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${getInsightColor(insight.type, insight.priority)} flex items-center justify-center flex-shrink-0`}>
                {getInsightIcon(insight.type)}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">{insight.title}</h3>
                    {insight.lead_name && (
                      <p className="text-sm text-slate-300 mb-2">
                        Related to: <span className="font-semibold">{insight.lead_name}</span>
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      insight.priority === 'high' ? 'bg-red-500/30 text-red-200' :
                      insight.priority === 'medium' ? 'bg-yellow-500/30 text-yellow-200' :
                      'bg-blue-500/30 text-blue-200'
                    }`}>
                      {insight.priority.toUpperCase()}
                    </span>
                    <span className="text-xs text-slate-400">
                      {Math.round(insight.confidence * 100)}% confidence
                    </span>
                  </div>
                </div>
                <p className="text-slate-300 mb-4">{insight.description}</p>
                {insight.action && (
                  <a
                    href={insight.action.url}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white text-sm font-semibold transition-all"
                  >
                    {insight.action.label}
                    <ArrowRight className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

