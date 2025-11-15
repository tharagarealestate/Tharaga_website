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

export default function RiskFlags({ propertyId }: RiskFlagsProps) {
  const [flags, setFlags] = useState<RiskFlag[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedFlags, setExpandedFlags] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadRiskFlags()
  }, [propertyId])

  async function loadRiskFlags() {
    try {
      setLoading(true)
      const supabase = getSupabase()
      const { data, error } = await supabase
        .from('property_risk_flags')
        .select('*')
        .eq('property_id', propertyId)
        .eq('resolved', false)
        .order('severity', { ascending: false })
        .order('flagged_at', { ascending: false })

      if (error) throw error
      
      // Auto-compute risk flags if none exist
      if (!data || data.length === 0) {
        await computeRiskFlags()
      } else {
        setFlags(data || [])
      }
    } catch (error: any) {
      console.error('Error loading risk flags:', error)
    } finally {
      setLoading(false)
    }
  }

  async function computeRiskFlags() {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await fetch(`${backendUrl}/api/properties/${propertyId}/compute-risk-flags`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to compute risk flags')
      }

      // Reload flags after computation
      const supabase = getSupabase()
      const { data, error } = await supabase
        .from('property_risk_flags')
        .select('*')
        .eq('property_id', propertyId)
        .eq('resolved', false)
        .order('severity', { ascending: false })
        .order('flagged_at', { ascending: false })

      if (error) throw error
      setFlags(data || [])
    } catch (error: any) {
      console.error('Error computing risk flags:', error)
      // Continue even if computation fails - just show empty state
      setFlags([])
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
      <div className="flex items-center gap-2 text-gray-600">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400"></div>
        <span>Loading risk assessment...</span>
      </div>
    )
  }

  if (flags.length === 0) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-emerald-800">
          <Shield className="w-5 h-5" />
          <span className="font-medium">No Risk Flags Detected</span>
        </div>
        <p className="text-sm text-emerald-700 mt-2">
          No major risk flags have been identified for this property. Review documents and insights for complete assessment.
        </p>
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

  return (
    <div className="space-y-4">
      <div className="bg-white/70 backdrop-blur-xl border border-gray-200/50 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-primary-900 to-primary-700 bg-clip-text text-transparent">
              Risk Assessment
            </h3>
            <p className="text-sm text-gray-600 mt-1">Automated risk flags with actionable recommendations</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm font-medium">
              {flags.filter(f => f.severity === 'high').length} High
            </div>
            <div className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-sm font-medium">
              {flags.filter(f => f.severity === 'medium').length} Medium
            </div>
          </div>
        </div>

        {/* Risk Flags Grid - Similar to Pricing Cards */}
        <div className="grid grid-cols-1 gap-3">
          {flags.map((flag) => {
            const severity = severityColors[flag.severity]
            const Icon = severity.icon
            const isExpanded = expandedFlags.has(flag.id)

            return (
              <div
                key={flag.id}
                className={`${severity.bg} ${severity.border} border-2 rounded-xl p-4 transition-all cursor-pointer hover:shadow-md`}
                onClick={() => toggleExpand(flag.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <Icon className={`w-5 h-5 ${severity.text} flex-shrink-0 mt-0.5`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className={`font-semibold ${severity.text}`}>{flag.title}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${severity.border} ${severity.text} border`}>
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
                            <div className={`mt-3 p-3 rounded-lg bg-white/50 ${severity.text}`}>
                              <p className="text-xs font-semibold mb-1">Recommended Actions:</p>
                              <p className="text-sm">{flag.actionable_steps}</p>
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
      </div>

      {/* Legal Disclaimer */}
      <div className="bg-gray-50 border-l-4 border-gray-400 p-4 rounded-lg">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs text-gray-700 leading-relaxed">{LEGAL_DISCLAIMER}</p>
            <a href="/how-verification-works" className="text-primary-600 hover:text-primary-700 text-xs mt-2 inline-block">
              How verification works →
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}


