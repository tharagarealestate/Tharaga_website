'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Building2,
  Briefcase,
  TrendingUp,
  DollarSign,
  Target,
} from 'lucide-react'

interface LeadEnrichmentProps {
  leadId: string
  leadData: {
    name: string
    email: string
    phone?: string
    message?: string
    source?: string
  }
  onEnriched?: (enrichment: any) => void
}

export function LeadEnrichment({ leadId, leadData, onEnriched }: LeadEnrichmentProps) {
  const [loading, setLoading] = useState(false)
  const [enrichment, setEnrichment] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleEnrich = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/leads/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id: leadId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Enrichment failed')
      }

      setEnrichment(data.enrichment)
      if (onEnriched) {
        onEnriched(data.enrichment)
      }
    } catch (err: any) {
      setError(err.message || 'Enrichment failed')
    } finally {
      setLoading(false)
    }
  }

  if (enrichment) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            <h3 className="text-lg font-semibold text-white">Lead Enriched</h3>
          </div>
          <button
            onClick={handleEnrich}
            disabled={loading}
            className="px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 rounded-lg text-purple-200 text-sm font-semibold transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Re-enrich
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {enrichment.company && (
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-semibold text-slate-400 uppercase">Company</span>
              </div>
              <p className="text-sm text-white">{enrichment.company}</p>
            </div>
          )}

          {enrichment.job_title && (
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Briefcase className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-semibold text-slate-400 uppercase">Job Title</span>
              </div>
              <p className="text-sm text-white">{enrichment.job_title}</p>
            </div>
          )}

          {enrichment.estimated_income && (
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-4 h-4 text-green-400" />
                <span className="text-xs font-semibold text-slate-400 uppercase">Est. Income</span>
              </div>
              <p className="text-sm text-white">
                ₹{(enrichment.estimated_income / 100000).toFixed(1)}L/year
              </p>
            </div>
          )}

          {enrichment.buying_power_score !== undefined && (
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-semibold text-slate-400 uppercase">Buying Power</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-slate-700/50 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                    style={{ width: `${enrichment.buying_power_score}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-white">{enrichment.buying_power_score}/100</span>
              </div>
            </div>
          )}

          {enrichment.interests && enrichment.interests.length > 0 && (
            <div className="bg-slate-800/50 rounded-lg p-3 md:col-span-2">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-semibold text-slate-400 uppercase">Interests</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {enrichment.interests.map((interest: string, index: number) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-cyan-500/20 border border-cyan-500/30 rounded text-xs text-cyan-200"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}

          {enrichment.risk_factors && enrichment.risk_factors.length > 0 && (
            <div className="bg-slate-800/50 rounded-lg p-3 md:col-span-2">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <span className="text-xs font-semibold text-slate-400 uppercase">Risk Factors</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {enrichment.risk_factors.map((risk: string, index: number) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-red-500/20 border border-red-500/30 rounded text-xs text-red-200"
                  >
                    {risk}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-slate-700/50">
          <p className="text-xs text-slate-400">
            Confidence: {Math.round((enrichment.enrichment_confidence || 0) * 100)}% • 
            Powered by OpenAI
          </p>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white mb-1">AI Lead Enrichment</h3>
          <p className="text-sm text-slate-400">
            Get enriched data about this lead using AI
          </p>
        </div>
        <Sparkles className="w-6 h-6 text-purple-400" />
      </div>

      {error && (
        <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <p className="text-sm text-red-200">{error}</p>
          </div>
        </div>
      )}

      <button
        onClick={handleEnrich}
        disabled={loading}
        className="w-full px-4 py-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 border border-purple-500/50 rounded-lg text-white font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <RefreshCw className="w-5 h-5 animate-spin" />
            Enriching with AI...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            Enrich Lead with AI
          </>
        )}
      </button>
    </div>
  )
}

