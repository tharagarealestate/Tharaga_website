'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp } from 'lucide-react'
import { getSupabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

interface AppreciationPredictionProps {
  propertyId: string
}

interface AppreciationBand {
  appreciation_band: 'LOW' | 'MEDIUM' | 'HIGH'
  confidence_label: 'LOW' | 'MEDIUM' | 'HIGH'
  top_features: Array<{
    feature_name: string
    impact_score: number
    explanation: string
  }>
  methodology_version: string
  model_type: string
  training_data_provenance: string
  model_limitations: string
}

const BAND_CONFIG = {
  HIGH: {
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    bar: 'bg-emerald-500',
    icon: TrendingUp,
    label: 'High Appreciation',
  },
  MEDIUM: {
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    bar: 'bg-amber-500',
    icon: Minus,
    label: 'Moderate Appreciation',
  },
  LOW: {
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    bar: 'bg-red-500',
    icon: TrendingDown,
    label: 'Low Appreciation',
  },
}

const CONFIDENCE_WIDTH = { HIGH: '90%', MEDIUM: '55%', LOW: '25%' }

export default function AppreciationPrediction({ propertyId }: AppreciationPredictionProps) {
  const [prediction, setPrediction] = useState<AppreciationBand | null>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => { loadPrediction() }, [propertyId])

  async function loadPrediction() {
    try {
      setLoading(true)
      const supabase = getSupabase()
      const { data } = await supabase
        .from('property_appreciation_bands')
        .select('*')
        .eq('property_id', propertyId)
        .maybeSingle()
      if (data) setPrediction(data as any)
    } catch {}
    finally { setLoading(false) }
  }

  // No data → silent null (no broken "Generate" button)
  if (loading) {
    return (
      <div className="flex items-center gap-2.5 py-4">
        <div className="h-3.5 w-3.5 rounded-full border-2 border-amber-500/40 border-t-amber-400 animate-spin" />
        <span className="text-xs text-zinc-500">Fetching appreciation forecast…</span>
      </div>
    )
  }

  if (!prediction) return null

  const cfg = BAND_CONFIG[prediction.appreciation_band]
  const Icon = cfg.icon
  const isSynthetic = prediction.training_data_provenance === 'SYNTHETIC'

  return (
    <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-5 space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Appreciation Forecast</p>
          {isSynthetic && (
            <span className="text-[10px] bg-zinc-800 border border-white/[0.06] text-zinc-500 px-1.5 py-0.5 rounded-full">
              Synthetic
            </span>
          )}
        </div>
        {/* Band chip */}
        <div className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold',
          cfg.bg, cfg.border, cfg.color,
        )}>
          <Icon size={12} />
          {cfg.label}
        </div>
      </div>

      {/* Confidence bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-zinc-600 uppercase tracking-widest">Model Confidence</span>
          <span className="text-[10px] font-semibold text-zinc-400">{prediction.confidence_label}</span>
        </div>
        <div className="h-1 w-full bg-white/[0.05] rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all', cfg.bar, 'opacity-60')}
            style={{ width: CONFIDENCE_WIDTH[prediction.confidence_label] }}
          />
        </div>
      </div>

      {/* Expand for factors */}
      {prediction.top_features?.length > 0 && (
        <>
          <button
            onClick={() => setExpanded(v => !v)}
            className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {expanded ? 'Hide factors' : 'View influencing factors'}
          </button>

          {expanded && (
            <div className="space-y-2 pt-1">
              {prediction.top_features.map((f, i) => (
                <div key={i} className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-3">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-xs font-medium text-zinc-300">{f.feature_name}</span>
                    <span className={cn(
                      'text-[10px] font-bold flex-shrink-0',
                      f.impact_score > 0 ? 'text-emerald-400' : 'text-red-400',
                    )}>
                      {f.impact_score > 0 ? '+' : ''}{f.impact_score.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 leading-relaxed">{f.explanation}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {prediction.model_limitations && (
        <p className="text-[10px] text-zinc-600 italic leading-relaxed">{prediction.model_limitations}</p>
      )}
    </div>
  )
}
