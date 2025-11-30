'use client'

import { useState, useEffect } from 'react'
import { Sparkles, TrendingUp, Target, Clock, Zap, Crown, Award, Coins, AlertCircle, CheckCircle, BarChart3 } from 'lucide-react'

interface SmartScoreData {
  smartscore_v2: number
  conversion_probability: number
  predicted_ltv: number
  priority_tier: 'platinum' | 'gold' | 'silver' | 'bronze' | 'standard'
  next_best_action: string
  optimal_contact_time: string | null
  ai_insights: {
    score_breakdown?: {
      budget_alignment: number
      engagement_level: number
      purchase_intent: number
      timing_urgency: number
      profile_quality: number
      behavior_consistency: number
      social_proof: number
    }
    key_strengths?: string[]
    improvement_areas?: string[]
    conversion_blockers?: string[]
    behavior_summary?: {
      properties_viewed: number
      properties_saved: number
      avg_time_per_view_sec: number
      active_days_last_month: number
    }
  }
}

interface SmartScoreCardProps {
  leadId: string
  variant?: 'glass' | 'highlighted'
}

export default function SmartScoreCard({
  leadId,
  variant = 'glass'
}: SmartScoreCardProps) {
  const [scoreData, setScoreData] = useState<SmartScoreData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const isHighlighted = variant === 'highlighted'
  
  useEffect(() => {
    fetchSmartScore()
  }, [leadId])
  
  const fetchSmartScore = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/leads/${leadId}/smartscore`)
      if (!response.ok) throw new Error('Failed to fetch SmartScore')
      const data = await response.json()
      setScoreData(data.data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }
  
  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'platinum': return 'from-purple-500 to-pink-500'
      case 'gold': return 'from-gold-500 to-amber-500'
      case 'silver': return 'from-gray-400 to-gray-600'
      case 'bronze': return 'from-orange-600 to-orange-800'
      default: return 'from-blue-500 to-blue-600'
    }
  }
  
  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'platinum': return <Crown className="w-5 h-5" />
      case 'gold': return <Award className="w-5 h-5" />
      case 'silver': return <Coins className="w-5 h-5" />
      case 'bronze': return <Target className="w-5 h-5" />
      default: return <BarChart3 className="w-5 h-5" />
    }
  }
  
  const formatAction = (action: string) => {
    return action
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }
  
  if (isLoading) {
    return (
      <div className="relative group">
        <div className="relative h-full rounded-3xl overflow-hidden transition-all duration-500 backdrop-blur-xl bg-white/10 border border-white/20">
          <div className="relative p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-white/10 rounded w-1/2" />
              <div className="h-4 bg-white/10 rounded w-3/4" />
              <div className="h-20 bg-white/10 rounded" />
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  if (error || !scoreData) {
    return (
      <div className="relative group">
        <div className="relative h-full rounded-3xl overflow-hidden transition-all duration-500 backdrop-blur-xl bg-white/10 border border-red-500/30">
          <div className="relative p-6">
            <div className="flex items-center gap-2 text-red-400">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm">{error || 'SmartScore data unavailable'}</span>
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  const breakdown = scoreData.ai_insights?.score_breakdown || {}
  const conversionPercent = (scoreData.conversion_probability * 100).toFixed(1)
  
  return (
    <div className={`
      relative group
      ${isHighlighted ? 'lg:scale-110 lg:-translate-y-4 z-10' : ''}
    `}>
      {/* Card Container */}
      <div className={`
        relative h-full
        rounded-3xl overflow-hidden
        transition-all duration-500
        ${isHighlighted 
          ? 'bg-gradient-to-br from-gold-500/20 to-emerald-500/20 border-2 border-gold-500/50 shadow-2xl shadow-gold-500/30' 
          : 'backdrop-blur-xl bg-white/10 border border-white/20'
        }
        hover:shadow-2xl hover:-translate-y-2
      `}>
        {/* Shimmer Effect on Hover */}
        <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none' />
        
        <div className='relative p-6'>
          {/* Header */}
          <div className='mb-6'>
            <div className='flex items-center gap-3 mb-2 flex-wrap'>
              <h3 className='text-xl font-bold text-white flex items-center gap-2'>
                <Sparkles className='w-5 h-5 text-gold-400' />
                SmartScore™ 2.0
              </h3>
              <div className={`flex-shrink-0 px-3 py-1 bg-gradient-to-r ${getTierColor(scoreData.priority_tier)} text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-1.5 whitespace-nowrap`}>
                {getTierIcon(scoreData.priority_tier)}
                {scoreData.priority_tier.toUpperCase()}
              </div>
            </div>
            <p className='text-gray-400 text-sm'>AI-Powered Lead Qualification</p>
          </div>
          
          {/* Main Score Display */}
          <div className='mb-6'>
            <div className='flex items-end gap-4 mb-4'>
              <div>
                <div className='text-5xl font-bold text-white mb-1'>
                  {scoreData.smartscore_v2.toFixed(1)}
                </div>
                <div className='text-sm text-gray-400'>SmartScore</div>
              </div>
              <div className='flex-1'>
                <div className='text-2xl font-bold text-emerald-400 mb-1'>
                  {conversionPercent}%
                </div>
                <div className='text-xs text-gray-400'>Conversion Probability</div>
              </div>
            </div>
            
            {/* Score Bar */}
            <div className='w-full h-3 bg-white/5 rounded-full overflow-hidden mb-2'>
              <div
                className={`h-full bg-gradient-to-r ${getTierColor(scoreData.priority_tier)} transition-all duration-500`}
                style={{ width: `${scoreData.smartscore_v2}%` }}
              />
            </div>
            
            {/* Predicted LTV */}
            {scoreData.predicted_ltv > 0 && (
              <div className='flex items-center gap-2 text-sm text-gold-400'>
                <TrendingUp className='w-4 h-4' />
                <span>Predicted LTV: ₹{scoreData.predicted_ltv.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
              </div>
            )}
          </div>
          
          {/* Score Breakdown */}
          {Object.keys(breakdown).length > 0 && (
            <div className='mb-6 space-y-2'>
              <div className='text-xs font-semibold text-gray-300 mb-3'>Score Breakdown</div>
              {Object.entries(breakdown).map(([key, value]: [string, any]) => (
                <div key={key} className='flex items-center justify-between'>
                  <span className='text-xs text-gray-400 capitalize'>
                    {key.replace(/_/g, ' ')}
                  </span>
                  <div className='flex items-center gap-2'>
                    <div className='w-24 h-2 bg-white/5 rounded-full overflow-hidden'>
                      <div
                        className='h-full bg-gradient-to-r from-blue-500 to-purple-500'
                        style={{ width: `${value}%` }}
                      />
                    </div>
                    <span className='text-xs text-white font-semibold w-10 text-right'>
                      {value.toFixed(0)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Next Best Action */}
          {scoreData.next_best_action && (
            <div className='mb-6 p-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl border border-blue-500/30'>
              <div className='flex items-center gap-2 mb-2'>
                <Zap className='w-4 h-4 text-blue-400' />
                <span className='text-xs font-semibold text-white'>Next Best Action</span>
              </div>
              <div className='text-sm text-blue-200'>
                {formatAction(scoreData.next_best_action)}
              </div>
            </div>
          )}
          
          {/* Optimal Contact Time */}
          {scoreData.optimal_contact_time && (
            <div className='mb-6 flex items-center gap-2 text-xs text-gray-400'>
              <Clock className='w-4 h-4' />
              <span>
                Best contact: {new Date(scoreData.optimal_contact_time).toLocaleString('en-IN', {
                  weekday: 'short',
                  hour: 'numeric',
                  minute: '2-digit'
                })}
              </span>
            </div>
          )}
          
          {/* Key Strengths */}
          {scoreData.ai_insights?.key_strengths && scoreData.ai_insights.key_strengths.length > 0 && (
            <div className='mb-4'>
              <div className='text-xs font-semibold text-gray-300 mb-2'>Key Strengths</div>
              <div className='space-y-1'>
                {scoreData.ai_insights.key_strengths.map((strength: string, idx: number) => (
                  <div key={idx} className='flex items-center gap-2 text-xs text-emerald-300'>
                    <CheckCircle className='w-3 h-3' />
                    <span>{strength}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Improvement Areas */}
          {scoreData.ai_insights?.improvement_areas && scoreData.ai_insights.improvement_areas.length > 0 && (
            <div className='mb-4'>
              <div className='text-xs font-semibold text-gray-300 mb-2'>Improvement Areas</div>
              <div className='space-y-1'>
                {scoreData.ai_insights.improvement_areas.map((area: string, idx: number) => (
                  <div key={idx} className='flex items-center gap-2 text-xs text-amber-300'>
                    <AlertCircle className='w-3 h-3' />
                    <span>{area}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Behavior Summary */}
          {scoreData.ai_insights?.behavior_summary && (
            <div className='mt-4 pt-4 border-t border-white/10'>
              <div className='text-xs font-semibold text-gray-300 mb-2'>Activity Summary</div>
              <div className='grid grid-cols-2 gap-2 text-xs'>
                <div className='text-gray-400'>
                  <span className='text-white font-semibold'>{scoreData.ai_insights.behavior_summary.properties_viewed || 0}</span> views
                </div>
                <div className='text-gray-400'>
                  <span className='text-white font-semibold'>{scoreData.ai_insights.behavior_summary.properties_saved || 0}</span> saved
                </div>
                <div className='text-gray-400'>
                  <span className='text-white font-semibold'>{scoreData.ai_insights.behavior_summary.active_days_last_month || 0}</span> active days
                </div>
                <div className='text-gray-400'>
                  <span className='text-white font-semibold'>{Math.round(scoreData.ai_insights.behavior_summary.avg_time_per_view_sec || 0)}s</span> avg view
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

