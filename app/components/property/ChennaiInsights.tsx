'use client'

import { useState, useEffect } from 'react'
import { MapPin, TrendingUp, Building2, Users, Shield, Sparkles, Info, ExternalLink } from 'lucide-react'
import { getSupabase } from '@/lib/supabase'

interface ChennaiInsightsProps {
  propertyId: string
  locality: string
}

interface InsightData {
  flood_score: number
  flood_score_source: string
  price_trend_data: Array<{ year: number; price_per_sqft: number }>
  price_trend_summary: string
  nearby_schools: Array<{ name: string; distance_km: number; type: string; source: string }>
  nearby_hospitals: Array<{ name: string; distance_km: number; source: string }>
  nearby_it_parks: Array<{ name: string; distance_km: number; source: string }>
  upcoming_transport: Array<{ project: string; completion_year: number; source: string }>
  rental_yield_min: number
  rental_yield_max: number
  rental_yield_formula: string
  rental_yield_source: string
  safety_indicator: 'Low' | 'Medium' | 'High'
  safety_provenance: string
  data_source: string
}

const LEGAL_DISCLAIMER = "Legal disclaimer: The information and verification artifacts provided on this page are automated snapshots of public records and uploaded documents as of the timestamp shown. These artifacts are intended for informational purposes only and do not constitute legal advice, title insurance, or a guarantee of property ownership or transferability. For formal legal confirmation and title transfer, consult a licensed property lawyer or the appropriate government registry."

export default function ChennaiInsights({ propertyId, locality }: ChennaiInsightsProps) {
  const [insights, setInsights] = useState<InsightData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadInsights()
  }, [propertyId])

  async function loadInsights() {
    try {
      setLoading(true)
      const supabase = getSupabase()
      const { data, error } = await supabase
        .from('chennai_locality_insights')
        .select('*')
        .eq('property_id', propertyId)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') throw error
      if (data) {
        setInsights(data as any)
      } else {
        // Create synthetic insights if not found
        await createSyntheticInsights()
      }
    } catch (error: any) {
      console.error('Error loading insights:', error)
    } finally {
      setLoading(false)
    }
  }

  async function createSyntheticInsights() {
    // Trigger backend to collect insights
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      await fetch(`${backendUrl}/api/properties/${propertyId}/collect-insights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locality })
      })
      loadInsights()
    } catch (error) {
      console.error('Error creating insights:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-600">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400"></div>
        <span>Loading locality insights...</span>
      </div>
    )
  }

  if (!insights) {
    return null
  }

  const isSynthetic = insights.data_source === 'SYNTHETIC'

  return (
    <div className="space-y-6">
      <div className="bg-white/70 backdrop-blur-xl border border-gray-200/50 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-primary-900 to-primary-700 bg-clip-text text-transparent">
              Chennai Locality Insights
            </h3>
            <p className="text-sm text-gray-600 mt-1">Multi-dimensional property insights for {locality}</p>
          </div>
          {isSynthetic && (
            <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">
              SYNTHETIC DATA
            </span>
          )}
        </div>

        {/* Insights Grid - Similar to Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Flood Score */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-blue-900">Flood Risk Score</span>
              </div>
              <span className="text-2xl font-bold text-blue-700">{insights.flood_score.toFixed(0)}</span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
              <div
                className={`h-2 rounded-full ${insights.flood_score >= 70 ? 'bg-red-500' : insights.flood_score >= 40 ? 'bg-amber-500' : 'bg-green-500'}`}
                style={{ width: `${insights.flood_score}%` }}
              />
            </div>
            <p className="text-xs text-blue-700">
              Source: {insights.flood_score_source}
              {insights.flood_score_provenance && ` • ${insights.flood_score_provenance}`}
            </p>
          </div>

          {/* Price Trend */}
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              <span className="font-semibold text-emerald-900">5-Year Price Trend</span>
            </div>
            {insights.price_trend_summary && (
              <p className="text-sm text-emerald-800 mb-2">{insights.price_trend_summary}</p>
            )}
            {insights.price_trend_data && insights.price_trend_data.length > 0 && (
              <div className="text-xs text-emerald-700">
                Current: ₹{insights.price_trend_data[insights.price_trend_data.length - 1].price_per_sqft.toLocaleString()}/sqft
              </div>
            )}
            <p className="text-xs text-emerald-700 mt-2">
              Source: {insights.price_trend_source}
            </p>
          </div>

          {/* Rental Yield */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <span className="font-semibold text-purple-900">Rental Yield Estimate</span>
            </div>
            <div className="text-2xl font-bold text-purple-700 mb-1">
              {insights.rental_yield_min}% - {insights.rental_yield_max}%
            </div>
            <p className="text-xs text-purple-700">
              {insights.rental_yield_formula}
            </p>
            <p className="text-xs text-purple-700 mt-1">
              Source: {insights.rental_yield_source}
            </p>
          </div>

          {/* Safety Indicator */}
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-4 border border-indigo-200">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-5 h-5 text-indigo-600" />
              <span className="font-semibold text-indigo-900">Safety Indicator</span>
            </div>
            <div className={`text-2xl font-bold mb-1 ${
              insights.safety_indicator === 'High' ? 'text-green-700' :
              insights.safety_indicator === 'Medium' ? 'text-amber-700' : 'text-red-700'
            }`}>
              {insights.safety_indicator}
            </div>
            <p className="text-xs text-indigo-700">
              {insights.safety_provenance}
            </p>
          </div>

          {/* Infrastructure Summary */}
          <div className="md:col-span-2 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="w-5 h-5 text-gray-600" />
              <span className="font-semibold text-gray-900">Infrastructure Summary</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Schools */}
              {insights.nearby_schools && insights.nearby_schools.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Nearby Schools</p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {insights.nearby_schools.slice(0, 3).map((school, idx) => (
                      <li key={idx}>
                        • {school.name} ({school.distance_km}km)
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Hospitals */}
              {insights.nearby_hospitals && insights.nearby_hospitals.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Nearby Hospitals</p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {insights.nearby_hospitals.slice(0, 3).map((hospital, idx) => (
                      <li key={idx}>
                        • {hospital.name} ({hospital.distance_km}km)
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Upcoming Transport */}
              {insights.upcoming_transport && insights.upcoming_transport.length > 0 && (
                <div className="md:col-span-2">
                  <p className="text-sm font-medium text-gray-700 mb-1">Upcoming Transport Projects</p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {insights.upcoming_transport.map((project, idx) => (
                      <li key={idx}>
                        • {project.project} (Expected {project.completion_year})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-600 mt-3">
              Source: {insights.infrastructure_source || 'SYNTHETIC'}
            </p>
          </div>
        </div>
      </div>

      {/* Legal Disclaimer */}
      <div className="bg-gray-50 border-l-4 border-gray-400 p-4 rounded-lg">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
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

