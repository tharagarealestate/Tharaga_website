"use client"

import React, { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Minus, MapPin, Lightbulb, Building2, AlertCircle, Loader2 } from 'lucide-react'
import { getMarketAnalysis } from '@/lib/ai/enhanced-search'

interface MarketAnalysisData {
  area: string
  averagePricePerSqft?: number
  priceGrowthRate?: number
  demandLevel?: 'high' | 'medium' | 'low'
  futurePotential?: number
  nearbyDevelopments?: string[]
  investmentAdvice?: string
}

interface MarketAnalysisProps {
  area: string
  propertyId?: string
  className?: string
}

export function MarketAnalysis({ area, propertyId, className = '' }: MarketAnalysisProps) {
  const [data, setData] = useState<MarketAnalysisData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!area) {
      setLoading(false)
      return
    }

    async function fetchAnalysis() {
      try {
        setLoading(true)
        setError(null)
        const result = await getMarketAnalysis(area)
        if (result && result.success !== false) {
          // Handle API response which may include success field
          const analysisData: MarketAnalysisData = {
            area: result.area || area,
            averagePricePerSqft: result.averagePricePerSqft,
            priceGrowthRate: result.priceGrowthRate,
            demandLevel: result.demandLevel,
            futurePotential: result.futurePotential,
            nearbyDevelopments: result.nearbyDevelopments,
            investmentAdvice: result.investmentAdvice
          }
          setData(analysisData)
        } else {
          setError('Market data not available')
        }
      } catch (err: any) {
        console.error('Market analysis error:', err)
        setError(err.message || 'Failed to load market analysis')
      } finally {
        setLoading(false)
      }
    }

    fetchAnalysis()
  }, [area])

  if (loading) {
    return (
      <div className={`rounded-xl border-2 border-amber-300 bg-slate-900/95 p-6 ${className}`}>
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="h-5 w-5 text-amber-300" />
          <h2 className="text-2xl font-semibold text-white">Market Analysis</h2>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 text-amber-300 animate-spin" />
          <span className="ml-3 text-slate-300">Analyzing market trends...</span>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className={`rounded-xl border-2 border-amber-300 bg-slate-900/95 p-6 ${className}`}>
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="h-5 w-5 text-amber-300" />
          <h2 className="text-2xl font-semibold text-white">Market Analysis</h2>
        </div>
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span>{error || 'Market data not available for this area'}</span>
          </div>
        </div>
      </div>
    )
  }

  const growthIcon = data.priceGrowthRate > 7 ? (
    <TrendingUp className="h-5 w-5 text-emerald-400" />
  ) : data.priceGrowthRate > 3 ? (
    <Minus className="h-5 w-5 text-yellow-400" />
  ) : (
    <TrendingDown className="h-5 w-5 text-red-400" />
  )

  const demandColor = data.demandLevel === 'high' 
    ? 'text-emerald-400' 
    : data.demandLevel === 'medium' 
    ? 'text-yellow-400' 
    : 'text-red-400'

  const potentialColor = data.futurePotential >= 70
    ? 'text-emerald-400'
    : data.futurePotential >= 50
    ? 'text-yellow-400'
    : 'text-red-400'

  return (
    <div className={`rounded-xl border-2 border-amber-300 bg-slate-900/95 p-6 text-white ${className}`}>
      <div className="flex items-center gap-3 mb-6">
        <TrendingUp className="h-5 w-5 text-amber-300" />
        <h2 className="text-2xl font-semibold text-white">Market Analysis</h2>
        <div className="ml-auto flex items-center gap-2 text-sm text-slate-300">
          <MapPin className="h-4 w-4" />
          <span>{data.area}</span>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Price per Sqft */}
        <MetricCard
          label="Avg. Price/sqft"
          value={`₹${data.averagePricePerSqft?.toLocaleString('en-IN') || 'N/A'}`}
          icon={<Building2 className="h-4 w-4 text-amber-300" />}
        />

        {/* Growth Rate */}
        <MetricCard
          label="Annual Growth"
          value={`${data.priceGrowthRate?.toFixed(1) || 'N/A'}%`}
          icon={growthIcon}
          highlight={data.priceGrowthRate > 7}
        />

        {/* Demand Level */}
        <MetricCard
          label="Demand Level"
          value={data.demandLevel?.charAt(0).toUpperCase() + data.demandLevel?.slice(1) || 'N/A'}
          icon={<TrendingUp className={`h-4 w-4 ${demandColor}`} />}
          highlight={data.demandLevel === 'high'}
        />
      </div>

      {/* Future Potential */}
      <div className="mb-6 rounded-lg border border-amber-300/30 bg-slate-800/50 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-300">Future Investment Potential</span>
          <span className={`text-lg font-bold ${potentialColor}`}>
            {data.futurePotential || 0}/100
          </span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2.5">
          <div
            className={`h-2.5 rounded-full ${
              data.futurePotential >= 70
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                : data.futurePotential >= 50
                ? 'bg-gradient-to-r from-yellow-500 to-amber-500'
                : 'bg-gradient-to-r from-red-500 to-orange-500'
            }`}
            style={{ width: `${data.futurePotential || 0}%` }}
          />
        </div>
        <p className="text-xs text-slate-400 mt-2">
          Based on market trends, infrastructure development, and growth indicators
        </p>
      </div>

      {/* Investment Advice */}
      {data.investmentAdvice && (
        <div className="mb-6 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
          <div className="flex items-start gap-3">
            <Lightbulb className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-emerald-200 mb-1">AI Investment Insight</h3>
              <p className="text-sm text-emerald-100 leading-relaxed">{data.investmentAdvice}</p>
            </div>
          </div>
        </div>
      )}

      {/* Nearby Developments */}
      {data.nearbyDevelopments && data.nearbyDevelopments.length > 0 && (
        <div className="rounded-lg border border-amber-300/30 bg-slate-800/50 p-4">
          <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-amber-300" />
            Upcoming Developments
          </h3>
          <ul className="space-y-2">
            {data.nearbyDevelopments.slice(0, 3).map((dev, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                <span className="text-amber-300 mt-1">•</span>
                <span>{dev}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Market Trend Indicator */}
      <div className="mt-4 pt-4 border-t border-amber-300/20">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Market data powered by AI analysis</span>
          <span>Last updated: {new Date().toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  )
}

function MetricCard({
  label,
  value,
  icon,
  highlight = false,
}: {
  label: string
  value: string
  icon: React.ReactNode
  highlight?: boolean
}) {
  return (
    <div
      className={`rounded-lg border p-4 ${
        highlight
          ? 'border-emerald-500/50 bg-emerald-500/10'
          : 'border-amber-300/30 bg-slate-800/50'
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs text-slate-400 uppercase tracking-wide">{label}</span>
      </div>
      <div className={`text-xl font-bold ${highlight ? 'text-emerald-300' : 'text-white'}`}>
        {value}
      </div>
    </div>
  )
}

