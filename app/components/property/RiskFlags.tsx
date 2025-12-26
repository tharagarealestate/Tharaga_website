'use client'

import { useState, useEffect } from 'react'
import { AlertCircle, AlertTriangle, Info, ChevronDown, ChevronUp, Shield } from 'lucide-react'
import { getSupabase } from '@/lib/supabase'

interface RiskFlagsProps {
  propertyId: string
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

const LEGAL_DISCLAIMER = "Legal disclaimer: The information and verification artifacts provided on this page are automated snapshots of public records and uploaded documents as of the timestamp shown. These artifacts are intended for informational purposes only and do not constitute legal advice, title insurance, or a guarantee of property ownership or transferability. For formal legal confirmation and title transfer, consult a licensed property lawyer or the appropriate government registry."

export default function RiskFlags({ propertyId, priceINR, sqft, reraId }: RiskFlagsProps) {
  const [flags, setFlags] = useState<RiskFlag[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedFlags, setExpandedFlags] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadRiskFlags()
  }, [propertyId, priceINR, sqft, reraId])

  async function loadRiskFlags() {
    try {
      setLoading(true)
      
      // First check Supabase for existing flags
      const supabase = getSupabase()
      const { data: existingFlags } = await supabase
        .from('property_risk_flags')
        .select('*')
        .eq('property_id', propertyId)
        .eq('resolved', false)
        .order('severity', { ascending: false })
        .order('flagged_at', { ascending: false })

      if (existingFlags && existingFlags.length > 0) {
        setFlags(existingFlags)
        setLoading(false)
        return
      }

      // If no flags exist, compute instantly using fraud score API
      await computeRiskFlagsInstantly()
    } catch (error: any) {
      console.error('Error loading risk flags:', error)
      setLoading(false)
    }
  }

  async function computeRiskFlagsInstantly() {
    try {
      // Use fraud score API for instant risk assessment
      const { getFraudScore } = await import('@/lib/api')
      const fraudData = await getFraudScore({
        price_inr: priceINR || undefined,
        sqft: sqft || undefined,
        has_rera_id: !!reraId,
        has_title_docs: false, // Can be enhanced later
        seller_type: 'builder',
        listed_days_ago: 30
      })

      // Convert fraud score to risk flags format
      const computedFlags: RiskFlag[] = []
      const riskLevel = fraudData.risk_level as 'low' | 'medium' | 'high'
      const riskScore = fraudData.risk_score || 0

      if (riskScore >= 70) {
        computedFlags.push({
          id: 'risk-assessment-high',
          flag_type: 'fraud_score',
          severity: 'high',
          title: 'High Risk Score Detected',
          description: `This property has a risk score of ${riskScore}/100. ${fraudData.reasons?.join('. ')}`,
          actionable_steps: fraudData.recommended_actions?.join('\n'),
          resolved: false
        })
      } else if (riskScore >= 40) {
        computedFlags.push({
          id: 'risk-assessment-medium',
          flag_type: 'fraud_score',
          severity: 'medium',
          title: 'Moderate Risk Score',
          description: `This property has a risk score of ${riskScore}/100. ${fraudData.reasons?.slice(0, 2).join('. ')}`,
          actionable_steps: fraudData.recommended_actions?.slice(0, 2).join('\n'),
          resolved: false
        })
      }

      // Add specific flags based on reasons
      fraudData.reasons?.forEach((reason: string, index: number) => {
        if (reason.includes('RERA')) {
          computedFlags.push({
            id: `rera-${index}`,
            flag_type: 'rera_missing',
            severity: 'high',
            title: 'RERA Registration Missing',
            description: reason,
            actionable_steps: 'Verify RERA registration number or request manual verification',
            resolved: false
          })
        } else if (reason.includes('title')) {
          computedFlags.push({
            id: `title-${index}`,
            flag_type: 'title_docs',
            severity: 'high',
            title: 'Title Documents Missing',
            description: reason,
            actionable_steps: 'Request title deed and Encumbrance Certificate for verification',
            resolved: false
          })
        } else if (reason.includes('Price')) {
          computedFlags.push({
            id: `price-${index}`,
            flag_type: 'pricing_anomaly',
            severity: riskScore >= 60 ? 'high' : 'medium',
            title: 'Pricing Anomaly Detected',
            description: reason,
            actionable_steps: 'Compare with market rates and verify pricing accuracy',
            resolved: false
          })
        }
      })

      setFlags(computedFlags)
    } catch (error: any) {
      console.error('Error computing risk flags:', error)
      // Show empty state on error
      setFlags([])
    } finally {
      setLoading(false)
    }
  }

  function toggleExpand(flagId: string) {
    const newExpanded = new Set(expandedFlags)
    if (newExpanded.has(flagId)) {
      newExpanded.delete(flagId)
    } else {
      newExpanded.add(flagId)
    }
    setExpandedFlags(newExpanded)
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3">
        <div className="animate-spin rounded-full h-5 w-5 border-2 border-amber-300 border-t-transparent"></div>
        <span className="text-slate-300">Assessing risks...</span>
      </div>
    )
  }

  if (flags.length === 0) {
    return (
      <div>
        <h3 className="text-xl font-bold text-white mb-4">Risk Assessment</h3>
        <div className="bg-emerald-500/20 border border-emerald-300/50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-emerald-300">
            <Shield className="w-5 h-5" />
            <span className="font-bold">No Risk Flags Detected</span>
          </div>
          <p className="text-sm text-emerald-200 mt-2">
            No major risk flags have been identified for this property. Review documents and insights for complete assessment.
          </p>
        </div>
      </div>
    )
  }

  const severityColors = {
    high: {
      bg: 'bg-red-100',
      border: 'border-red-300',
      text: 'text-red-800',
      icon: AlertCircle,
    },
    medium: {
      bg: 'bg-amber-100',
      border: 'border-amber-300',
      text: 'text-amber-800',
      icon: AlertTriangle,
    },
    low: {
      bg: 'bg-blue-100',
      border: 'border-blue-300',
      text: 'text-blue-800',
      icon: Info,
    },
  }

  const severityColors = {
    high: {
      bg: 'bg-red-500/20',
      border: 'border-red-300',
      text: 'text-red-300',
      icon: AlertCircle,
    },
    medium: {
      bg: 'bg-amber-500/20',
      border: 'border-amber-300',
      text: 'text-amber-300',
      icon: AlertTriangle,
    },
    low: {
      bg: 'bg-blue-500/20',
      border: 'border-blue-300',
      text: 'text-blue-300',
      icon: Info,
    },
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-white">Risk Assessment</h3>
          <p className="text-sm text-slate-300 mt-1">Real-time risk analysis with actionable recommendations</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 rounded-full bg-red-500/20 border border-red-300 text-red-300 text-sm font-bold">
            {flags.filter(f => f.severity === 'high').length} High
          </div>
          <div className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-300 text-amber-300 text-sm font-bold">
            {flags.filter(f => f.severity === 'medium').length} Medium
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {flags.map((flag) => {
          const severity = severityColors[flag.severity]
          const Icon = severity.icon
          const isExpanded = expandedFlags.has(flag.id)

          return (
            <div
              key={flag.id}
              className={`${severity.bg} ${severity.border} border-2 rounded-lg p-4 transition-all cursor-pointer hover:shadow-lg hover:shadow-amber-300/10`}
              onClick={() => toggleExpand(flag.id)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <Icon className={`w-5 h-5 ${severity.text} flex-shrink-0 mt-0.5`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className={`font-bold ${severity.text}`}>{flag.title}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${severity.border} ${severity.text} border`}>
                        {flag.severity.toUpperCase()}
                      </span>
                    </div>
                    {isExpanded && (
                      <div className="mt-3 space-y-2">
                        {flag.description && (
                          <p className={`text-sm ${severity.text} opacity-90`}>
                            {flag.description}
                          </p>
                        )}
                        {flag.actionable_steps && (
                          <div className={`mt-3 p-3 rounded-lg bg-slate-800/50 border ${severity.border}/50`}>
                            <p className="text-xs font-bold mb-1 text-slate-300">Recommended Actions:</p>
                            <p className="text-sm text-slate-200 whitespace-pre-line">{flag.actionable_steps}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp className={`w-5 h-5 ${severity.text} flex-shrink-0`} />
                ) : (
                  <ChevronDown className={`w-5 h-5 ${severity.text} flex-shrink-0`} />
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Legal Disclaimer */}
      <div className="bg-slate-700/50 border-l-4 border-amber-300/50 p-4 rounded-lg">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-amber-300 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs text-slate-300 leading-relaxed">{LEGAL_DISCLAIMER}</p>
            <a href="/how-verification-works" className="text-amber-300 hover:text-amber-400 text-xs mt-2 inline-block transition-colors">
              How verification works →
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}


