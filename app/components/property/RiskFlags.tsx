'use client'

import { useState, useEffect } from 'react'
import { AlertCircle, AlertTriangle, Info, ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react'
import { getSupabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

interface RiskFlagsProps {
  propertyId: string
  priceINR?: number | null
  sqft?: number | null
  reraId?: string | null
}

interface RiskFlag {
  id: string
  flag_type: string
  severity: 'low' | 'medium' | 'high'
  title: string
  description?: string
  actionable_steps?: string
  resolved: boolean
}

const SEV = {
  high:   { icon: AlertCircle,   text: 'text-red-400',   bg: 'bg-red-500/[0.08]',    border: 'border-red-500/20',    chip: 'bg-red-500/10 border-red-500/20 text-red-400'   },
  medium: { icon: AlertTriangle, text: 'text-amber-400', bg: 'bg-amber-500/[0.08]',  border: 'border-amber-500/20',  chip: 'bg-amber-500/10 border-amber-500/20 text-amber-400' },
  low:    { icon: Info,          text: 'text-blue-400',  bg: 'bg-blue-500/[0.06]',   border: 'border-blue-500/15',   chip: 'bg-blue-500/10 border-blue-500/20 text-blue-400'  },
}

export default function RiskFlags({ propertyId, priceINR, sqft, reraId }: RiskFlagsProps) {
  const [flags, setFlags] = useState<RiskFlag[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  useEffect(() => { loadFlags() }, [propertyId, priceINR, sqft, reraId])

  async function loadFlags() {
    try {
      setLoading(true)
      const supabase = getSupabase()
      const { data } = await supabase
        .from('property_risk_flags')
        .select('*')
        .eq('property_id', propertyId)
        .eq('resolved', false)
        .order('severity', { ascending: false })
        .order('flagged_at', { ascending: false })

      if (data?.length) { setFlags(data); setLoading(false); return }

      // Instant compute via fraud score
      await computeInstant()
    } catch { setLoading(false) }
  }

  async function computeInstant() {
    try {
      const { getFraudScore } = await import('@/lib/api')
      const fraudData = await getFraudScore({
        price_inr: priceINR || undefined,
        sqft: sqft || undefined,
        has_rera_id: !!reraId,
        has_title_docs: false,
        seller_type: 'builder',
        listed_days_ago: 30,
      })

      const computed: RiskFlag[] = []
      const score = fraudData.risk_score || 0

      if (score >= 70) {
        computed.push({ id: 'risk-high', flag_type: 'fraud_score', severity: 'high',
          title: 'High Risk Score Detected',
          description: `Risk score ${score}/100. ${fraudData.reasons?.join('. ')}`,
          actionable_steps: fraudData.recommended_actions?.join('\n'), resolved: false })
      } else if (score >= 40) {
        computed.push({ id: 'risk-med', flag_type: 'fraud_score', severity: 'medium',
          title: 'Moderate Risk Score',
          description: `Risk score ${score}/100. ${fraudData.reasons?.slice(0, 2).join('. ')}`,
          actionable_steps: fraudData.recommended_actions?.slice(0, 2).join('\n'), resolved: false })
      }

      fraudData.reasons?.forEach((reason: string, i: number) => {
        if (reason.includes('RERA'))
          computed.push({ id: `rera-${i}`, flag_type: 'rera_missing', severity: 'high',
            title: 'RERA Registration Missing', description: reason,
            actionable_steps: 'Verify RERA registration number or request manual verification', resolved: false })
        else if (reason.includes('title'))
          computed.push({ id: `title-${i}`, flag_type: 'title_docs', severity: 'high',
            title: 'Title Documents Missing', description: reason,
            actionable_steps: 'Request title deed and Encumbrance Certificate', resolved: false })
        else if (reason.includes('Price'))
          computed.push({ id: `price-${i}`, flag_type: 'pricing_anomaly', severity: score >= 60 ? 'high' : 'medium',
            title: 'Pricing Anomaly Detected', description: reason,
            actionable_steps: 'Compare with market rates and verify pricing accuracy', resolved: false })
      })

      setFlags(computed)
    } catch { setFlags([]) }
    finally { setLoading(false) }
  }

  function toggle(id: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  /* ── Header label ── */
  const header = (
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-widest">Risk Assessment</h3>
      {!loading && flags.length > 0 && (
        <div className="flex items-center gap-1.5">
          {flags.filter(f => f.severity === 'high').length > 0 && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400">
              {flags.filter(f => f.severity === 'high').length} High
            </span>
          )}
          {flags.filter(f => f.severity === 'medium').length > 0 && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400">
              {flags.filter(f => f.severity === 'medium').length} Med
            </span>
          )}
        </div>
      )}
    </div>
  )

  if (loading) {
    return (
      <div>
        {header}
        <div className="flex items-center gap-2">
          <div className="h-3.5 w-3.5 rounded-full border-2 border-amber-500/30 border-t-amber-400 animate-spin" />
          <span className="text-xs text-zinc-500">Assessing risks…</span>
        </div>
      </div>
    )
  }

  if (!flags.length) {
    return (
      <div>
        {header}
        <div className="bg-emerald-500/[0.07] border border-emerald-500/15 rounded-xl p-3">
          <div className="flex items-center gap-2">
            <ShieldCheck size={13} className="text-emerald-400" />
            <p className="text-xs font-semibold text-emerald-400">No Risk Flags Detected</p>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
            No major risk flags identified. Review documents for complete assessment.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {header}
      <div className="space-y-2">
        {flags.map((flag) => {
          const cfg = SEV[flag.severity]
          const Icon = cfg.icon
          const isOpen = expanded.has(flag.id)

          return (
            <div
              key={flag.id}
              className={cn('border rounded-xl p-3 cursor-pointer transition-colors', cfg.bg, cfg.border)}
              onClick={() => toggle(flag.id)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  <Icon size={13} className={cn(cfg.text, 'flex-shrink-0 mt-0.5')} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn('text-xs font-semibold', cfg.text)}>{flag.title}</span>
                      <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded border', cfg.chip)}>
                        {flag.severity.toUpperCase()}
                      </span>
                    </div>

                    {isOpen && (
                      <div className="mt-2 space-y-2">
                        {flag.description && (
                          <p className={cn('text-[11px] leading-relaxed', cfg.text, 'opacity-80')}>{flag.description}</p>
                        )}
                        {flag.actionable_steps && (
                          <div className="bg-white/[0.04] border border-white/[0.06] rounded-lg p-2.5">
                            <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-1">Recommended Actions</p>
                            <p className="text-[11px] text-zinc-400 whitespace-pre-line leading-relaxed">{flag.actionable_steps}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                {isOpen
                  ? <ChevronUp size={12} className={cn(cfg.text, 'flex-shrink-0 mt-0.5')} />
                  : <ChevronDown size={12} className={cn(cfg.text, 'flex-shrink-0 mt-0.5')} />}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
