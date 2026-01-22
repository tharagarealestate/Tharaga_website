"use client"

import React, { useEffect, useState } from 'react'
import { Sparkles, Loader2, CheckCircle2 } from 'lucide-react'
import { fetchRecommendations } from '@/lib/api'
import { getSupabase } from '@/lib/supabase'

interface MatchData {
  score: number
  reasons: string[]
}

interface EnhancedMatchScoreProps {
  propertyId: string
  userId?: string
  className?: string
}

export function EnhancedMatchScore({ propertyId, userId, className = '' }: EnhancedMatchScoreProps) {
  const [matchData, setMatchData] = useState<MatchData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    // Get user if not provided
    async function getUser() {
      if (userId) {
        setUser({ id: userId })
        return
      }

      try {
        const supabase = getSupabase()
        const { data } = await supabase.auth.getUser()
        if (data?.user) {
          setUser(data.user)
        } else {
          // Fallback to session-based
          const sessionId = typeof document !== 'undefined'
            ? document.cookie.match(/(?:^|; )thg_sid=([^;]+)/)?.[1]
            : null
          if (sessionId) {
            setUser({ id: `session_${sessionId}` })
          }
        }
      } catch (err) {
        console.error('Error getting user:', err)
      }
    }

    getUser()
  }, [userId])

  useEffect(() => {
    if (!propertyId) {
      setLoading(false)
      return
    }

    async function fetchMatchScore() {
      try {
        setLoading(true)
        setError(null)

        const sessionId = typeof document !== 'undefined'
          ? document.cookie.match(/(?:^|; )thg_sid=([^;]+)/)?.[1]
          : null

        // Get recommendations using existing API
        const res = await fetchRecommendations({ 
          user_id: user?.id || 'anon', 
          session_id: sessionId || 'anon', 
          num_results: 20 
        })
        
        const items = res?.items || []
        if (!items.length) {
          setLoading(false)
          return
        }

        // Find this property in recommendations
        const found = items.find((i: any) => i.property_id === propertyId)
        
        if (found) {
          // Normalize score to 0-100
          const maxScore = Math.max(1, ...items.map((i: any) => Math.max(0, Number(i.score || 0))))
          const score = Math.max(0, Number(found.score || 0))
          const normalizedScore = Math.round((score / maxScore) * 100)
          
          setMatchData({
            score: normalizedScore,
            reasons: found.reasons || []
          })
        } else {
          setLoading(false)
          return
        }
      } catch (err: any) {
        console.error('Match score error:', err)
        setError(err.message || 'Failed to calculate match score')
      } finally {
        setLoading(false)
      }
    }

    fetchMatchScore()
  }, [user?.id, propertyId])

  if (loading) {
    return (
      <div className={`rounded-xl border-2 border-amber-300 bg-slate-900/95 p-4 ${className}`}>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-amber-300" />
          <span className="text-sm font-medium text-white">AI Match Score</span>
        </div>
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 text-amber-300 animate-spin" />
        </div>
      </div>
    )
  }

  if (error || !matchData) {
    return null // Fail silently if no match data
  }

  const score = matchData.score || 0
  const scoreColor = score >= 80
    ? 'text-emerald-400'
    : score >= 60
    ? 'text-yellow-400'
    : 'text-orange-400'

  const scoreBg = score >= 80
    ? 'bg-emerald-500/20 border-emerald-500/50'
    : score >= 60
    ? 'bg-yellow-500/20 border-yellow-500/50'
    : 'bg-orange-500/20 border-orange-500/50'

  return (
    <div className={`rounded-xl border-2 border-amber-300 bg-slate-900/95 p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-amber-300" />
        <span className="text-sm font-medium text-white">AI Match Score</span>
      </div>
      
      <div className={`rounded-lg border-2 ${scoreBg} p-4 mb-3`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-300">Personalized Match</span>
          <span className={`text-3xl font-bold ${scoreColor}`}>{score}%</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2 mb-3">
          <div
            className={`h-2 rounded-full ${
              score >= 80
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                : score >= 60
                ? 'bg-gradient-to-r from-yellow-500 to-amber-500'
                : 'bg-gradient-to-r from-orange-500 to-red-500'
            }`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

      {matchData.reasons && matchData.reasons.length > 0 && (
        <div className="space-y-2">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Why it matches:</span>
          <ul className="space-y-1.5">
            {matchData.reasons.slice(0, 3).map((reason, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-amber-300/20">
        <p className="text-xs text-slate-400">
          Based on your search history and preferences
        </p>
      </div>
    </div>
  )
}


