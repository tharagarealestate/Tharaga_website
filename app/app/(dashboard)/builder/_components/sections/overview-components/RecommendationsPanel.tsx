"use client"

import { motion } from 'framer-motion'
import { Lightbulb, ArrowRight, Zap, Building2, DollarSign, Users } from 'lucide-react'

interface Recommendation {
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  category: 'leads' | 'properties' | 'revenue' | 'operations'
  impact: string
  effort: 'low' | 'medium' | 'high'
}

interface RecommendationsPanelProps {
  recommendations: Recommendation[]
}

const categoryIcons = {
  leads: Users,
  properties: Building2,
  revenue: DollarSign,
  operations: Zap
}

const priorityColors = {
  high: {
    bg: 'bg-red-500/10',
    border: 'border-red-400/30',
    text: 'text-red-300',
    badge: 'bg-red-500/20 text-red-300'
  },
  medium: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-400/30',
    text: 'text-amber-300',
    badge: 'bg-amber-500/20 text-amber-300'
  },
  low: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-400/30',
    text: 'text-blue-300',
    badge: 'bg-blue-500/20 text-blue-300'
  }
}

const effortLabels = {
  low: 'Quick Win',
  medium: 'Moderate Effort',
  high: 'Strategic Initiative'
}

export function RecommendationsPanel({ recommendations }: RecommendationsPanelProps) {
  // Sort by priority
  const sortedRecommendations = [...recommendations].sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    return priorityOrder[b.priority] - priorityOrder[a.priority]
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl p-6"
    >
      <div className="flex items-center gap-2 mb-6">
        <Lightbulb className="w-5 h-5 text-yellow-400" />
        <h3 className="text-lg font-semibold text-white">AI Recommendations</h3>
        <span className="text-sm text-slate-400">({recommendations.length} actionable items)</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sortedRecommendations.map((rec, index) => {
          const colors = priorityColors[rec.priority]
          const CategoryIcon = categoryIcons[rec.category] || Zap

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`${colors.bg} ${colors.border} border rounded-lg p-4 hover:scale-[1.02] transition-transform cursor-pointer`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <CategoryIcon className={`w-4 h-4 ${colors.text}`} />
                  <span className={`text-xs px-2 py-1 rounded ${colors.badge}`}>
                    {rec.priority.toUpperCase()}
                  </span>
                </div>
                <span className="text-xs text-slate-400">{effortLabels[rec.effort]}</span>
              </div>

              <h4 className={`text-sm font-semibold ${colors.text} mb-2`}>
                {rec.title}
              </h4>
              <p className="text-sm text-slate-300 mb-3">{rec.description}</p>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Impact: {rec.impact}</span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </div>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}
