'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, TrendingFlat, ChevronDown, ChevronUp, Info, Sparkles } from 'lucide-react'
import { getSupabase } from '@/lib/supabase'

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

const LEGAL_DISCLAIMER = "Legal disclaimer: The information and verification artifacts provided on this page are automated snapshots of public records and uploaded documents as of the timestamp shown. These artifacts are intended for informational purposes only and do not constitute legal advice, title insurance, or a guarantee of property ownership or transferability. For formal legal confirmation and title transfer, consult a licensed property lawyer or the appropriate government registry."

export default function AppreciationPrediction({ propertyId }: AppreciationPredictionProps) {
  const [prediction, setPrediction] = useState<AppreciationBand | null>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)
  const [loadingPrediction, setLoadingPrediction] = useState(false)

  useEffect(() => {
    loadPrediction()
  }, [propertyId])

  async function loadPrediction() {
    try {
      setLoading(true)
      const supabase = getSupabase()
      const { data, error } = await supabase
        .from('property_appreciation_bands')
        .select('*')
        .eq('property_id', propertyId)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') throw error
      if (data) {
        setPrediction(data as any)
      }
    } catch (error: any) {
      console.error('Error loading prediction:', error)
    } finally {
      setLoading(false)
    }
  }

  async function generatePrediction() {
    try {
      setLoadingPrediction(true)
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await fetch(`${backendUrl}/api/properties/${propertyId}/predict-appreciation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to generate prediction')
      }

      const result = await response.json()
      setPrediction(result)
    } catch (error: any) {
      console.error('Error generating prediction:', error)
    } finally {
      setLoadingPrediction(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-600">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400"></div>
        <span>Loading appreciation prediction...</span>
      </div>
    )
  }

  if (!prediction) {
    return (
      <div className="bg-white/70 backdrop-blur-xl border border-gray-200/50 rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-primary-900 to-primary-700 bg-clip-text text-transparent">
              Appreciation Prediction
            </h3>
            <p className="text-sm text-gray-600 mt-1">Explainable ML-based appreciation bands</p>
          </div>
          <button
            onClick={generatePrediction}
            disabled={loadingPrediction}
            className="px-4 py-2 bg-gradient-to-r from-gold-600 to-gold-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {loadingPrediction ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Prediction</span>
              </>
            )}
          </button>
        </div>
      </div>
    )
  }

  const bandColors = {
    HIGH: {
      bg: 'from-emerald-500 to-emerald-600',
      text: 'text-emerald-700',
      border: 'border-emerald-300',
      icon: TrendingUp,
    },
    MEDIUM: {
      bg: 'from-amber-500 to-amber-600',
      text: 'text-amber-700',
      border: 'border-amber-300',
      icon: TrendingFlat,
    },
    LOW: {
      bg: 'from-red-500 to-red-600',
      text: 'text-red-700',
      border: 'border-red-300',
      icon: TrendingDown,
    },
  }

  const confidenceColors = {
    HIGH: 'bg-emerald-100 text-emerald-700',
    MEDIUM: 'bg-amber-100 text-amber-700',
    LOW: 'bg-gray-100 text-gray-700',
  }

  const bandColor = bandColors[prediction.appreciation_band]
  const Icon = bandColor.icon
  const confidenceColor = confidenceColors[prediction.confidence_label]

  return (
    <div className="space-y-6">
      <div className="bg-white/70 backdrop-blur-xl border border-gray-200/50 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-primary-900 to-primary-700 bg-clip-text text-transparent">
              Appreciation Prediction
            </h3>
            <p className="text-sm text-gray-600 mt-1">Explainable ML-based appreciation bands (Low / Medium / High)</p>
          </div>
          {prediction.training_data_provenance === 'SYNTHETIC' && (
            <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">
              SYNTHETIC DATA
            </span>
          )}
        </div>

        {/* Prediction Display - Similar to Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className={`bg-gradient-to-br ${bandColor.bg} rounded-xl p-6 border-2 ${bandColor.border} shadow-lg`}>
            <div className="flex items-center gap-3 mb-3">
              <Icon className="w-8 h-8 text-white" />
              <div>
                <div className="text-sm text-white/90 font-medium">Prediction</div>
                <div className="text-3xl font-bold text-white">{prediction.appreciation_band}</div>
              </div>
            </div>
            <div className="text-sm text-white/90">
              Based on infrastructure, flood risk, price trends, rental yield, and safety indicators
            </div>
          </div>

          <div className={`bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border-2 border-gray-200`}>
            <div className="mb-3">
              <div className="text-sm text-gray-600 font-medium mb-1">Confidence</div>
              <div className={`text-2xl font-bold ${bandColor.text} mb-2`}>{prediction.confidence_label}</div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${confidenceColor}`}>
                {prediction.confidence_label} Confidence
              </span>
            </div>
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-3 text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              {expanded ? (
                <>
                  Hide explanations <ChevronUp className="w-4 h-4" />
                </>
              ) : (
                <>
                  Why this prediction? <ChevronDown className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Feature Explanations */}
        {expanded && prediction.top_features && prediction.top_features.length > 0 && (
          <div className="mt-4 bg-gray-50 rounded-xl p-4 border border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-3">Top Factors Influencing Prediction</h4>
            <div className="space-y-3">
              {prediction.top_features.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${bandColor.bg} flex items-center justify-center flex-shrink-0`}>
                    <span className="text-white font-bold text-sm">{idx + 1}</span>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{feature.feature_name}</div>
                    <div className="text-sm text-gray-600 mt-1">{feature.explanation}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Impact score: {feature.impact_score > 0 ? '+' : ''}{feature.impact_score.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Methodology Link */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <a
            href="/model-methodology"
            className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
          >
            <Info className="w-4 h-4" />
            View Model Methodology →
          </a>
          {prediction.model_limitations && (
            <p className="text-xs text-gray-600 mt-2 italic">{prediction.model_limitations}</p>
          )}
        </div>
      </div>

      {/* Legal Disclaimer */}
      <div className="bg-gray-50 border-l-4 border-gray-400 p-4 rounded-lg">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs text-gray-700 leading-relaxed">{LEGAL_DISCLAIMER}</p>
            <p className="text-xs text-gray-600 mt-2 italic">
              <strong>Note:</strong> This prediction does not show numerical accuracy metrics. 
              See Model Methodology page for data sources and limitations.
            </p>
            <a href="/how-verification-works" className="text-primary-600 hover:text-primary-700 text-xs mt-2 inline-block">
              How verification works →
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}









