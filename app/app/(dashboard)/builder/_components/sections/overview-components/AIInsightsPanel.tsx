"use client"

import { motion } from 'framer-motion'
import { Sparkles, TrendingUp, TrendingDown, Lightbulb, AlertTriangle } from 'lucide-react'

interface AIInsightsPanelProps {
  insights: {
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
}

export function AIInsightsPanel({ insights, marketInsights }: AIInsightsPanelProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* AI-Generated Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl p-6"
      >
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <h3 className="text-lg font-semibold text-white">AI-Generated Insights</h3>
        </div>

        {/* Performance Summary */}
        <div className="mb-6 p-4 bg-amber-500/10 border border-amber-400/30 rounded-lg">
          <h4 className="text-sm font-semibold text-amber-300 mb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Performance Summary
          </h4>
          <p className="text-sm text-slate-300">{insights.performanceSummary}</p>
        </div>

        {/* Key Findings */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-yellow-400" />
            Key Findings
          </h4>
          <ul className="space-y-2">
            {insights.keyFindings.map((finding, index) => (
              <li key={index} className="text-sm text-slate-300 flex items-start gap-2">
                <span className="text-amber-400 mt-1">•</span>
                <span>{finding}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Trend Analysis */}
        <div className="mb-6 p-4 bg-blue-500/10 border border-blue-400/30 rounded-lg">
          <h4 className="text-sm font-semibold text-blue-300 mb-2">Trend Analysis</h4>
          <p className="text-sm text-slate-300">{insights.trendAnalysis}</p>
        </div>

        {/* Opportunities */}
        {insights.opportunities.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-emerald-300 mb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Opportunities
            </h4>
            <ul className="space-y-2">
              {insights.opportunities.map((opp, index) => (
                <li key={index} className="text-sm text-slate-300 flex items-start gap-2">
                  <span className="text-emerald-400 mt-1">✓</span>
                  <span>{opp}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Risks */}
        {insights.risks.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-red-300 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Risks
            </h4>
            <ul className="space-y-2">
              {insights.risks.map((risk, index) => (
                <li key={index} className="text-sm text-slate-300 flex items-start gap-2">
                  <span className="text-red-400 mt-1">⚠</span>
                  <span>{risk}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </motion.div>

      {/* Market Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl p-6"
      >
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Market Insights</h3>
        </div>

        {/* Market Trends */}
        <div className="space-y-4 mb-6">
          {marketInsights.marketTrends.map((trend, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${
                trend.impact === 'positive'
                  ? 'bg-emerald-500/10 border-emerald-400/30'
                  : trend.impact === 'warning'
                  ? 'bg-amber-500/10 border-amber-400/30'
                  : 'bg-red-500/10 border-red-400/30'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="text-sm font-semibold text-white">{trend.title}</h4>
                <span className="text-xs text-slate-400">
                  {(trend.confidence * 100).toFixed(0)}% confidence
                </span>
              </div>
              <p className="text-sm text-slate-300">{trend.description}</p>
            </div>
          ))}
        </div>

        {/* Competitive Analysis */}
        {marketInsights.competitiveAnalysis && (
          <div className="p-4 bg-blue-500/10 border border-blue-400/30 rounded-lg">
            <h4 className="text-sm font-semibold text-blue-300 mb-3">Competitive Position</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300">Lead Generation</span>
                <span className="text-white font-semibold">
                  {marketInsights.competitiveAnalysis.leadGeneration}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300">Conversion Rate</span>
                <span className="text-white font-semibold">
                  {marketInsights.competitiveAnalysis.conversionRate}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300">Response Time</span>
                <span className="text-white font-semibold">
                  {marketInsights.competitiveAnalysis.responseTime}
                </span>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}
