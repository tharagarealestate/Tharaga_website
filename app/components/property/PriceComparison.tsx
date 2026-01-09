'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Minus, Loader2 } from 'lucide-react'
import { getSupabase } from '@/lib/supabase'

interface PriceComparisonProps {
  propertyId: string
  pricePerSqft: number | null
  locality: string | null
  city: string | null
}

export default function PriceComparison({ propertyId, pricePerSqft, locality, city }: PriceComparisonProps) {
  const [avgPrice, setAvgPrice] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAveragePrice()
  }, [locality, city])

  async function fetchAveragePrice() {
    if (!locality || !pricePerSqft) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const supabase = getSupabase()
      
      // Calculate average price per sqft for the locality
      const { data, error } = await supabase
        .from('properties')
        .select('price_inr, sqft, carpet_area, super_built_up_area')
        .eq('city', city || 'Chennai')
        .eq('locality', locality)
        .not('price_inr', 'is', null)
        .not('sqft', 'is', null)
        .neq('id', propertyId)
        .limit(50)

      if (error) throw error

      if (data && data.length > 0) {
        // Calculate price per sqft for each property and get average
        const validPrices = data
          .map(p => {
            const area = p.carpet_area || p.sqft || p.super_built_up_area
            const price = p.price_inr
            if (!area || !price || area <= 0) return null
            return price / area
          })
          .filter((p): p is number => p !== null)

        if (validPrices.length > 0) {
          const average = validPrices.reduce((a, b) => a + b, 0) / validPrices.length
          setAvgPrice(Math.round(average))
        }
      }
    } catch (error) {
      console.error('Error fetching average price:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!pricePerSqft) return null

  const difference = avgPrice ? pricePerSqft - avgPrice : null
  const percentage = avgPrice && difference ? Math.round((difference / avgPrice) * 100) : null
  const isAbove = difference !== null && difference > 0
  const isBelow = difference !== null && difference < 0

  return (
    <div className="bg-slate-800/95 glow-border rounded-lg p-6">
      <h2 className="text-2xl font-bold text-white mb-4">Price Comparison</h2>
      
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-slate-700/50 border border-amber-300/30 rounded-lg p-4">
          <div className="text-sm text-slate-400 mb-1">This Property</div>
          <div className="text-2xl font-bold text-amber-300">₹{pricePerSqft.toLocaleString('en-IN')}/sqft</div>
        </div>

        {loading ? (
          <div className="bg-slate-700/50 border border-amber-300/30 rounded-lg p-4 flex items-center justify-center">
            <Loader2 className="h-5 w-5 text-amber-300 animate-spin" />
          </div>
        ) : avgPrice ? (
          <div className="bg-slate-700/50 border border-amber-300/30 rounded-lg p-4">
            <div className="text-sm text-slate-400 mb-1">Average in {locality}</div>
            <div className="text-2xl font-bold text-white">₹{avgPrice.toLocaleString('en-IN')}/sqft</div>
          </div>
        ) : (
          <div className="bg-slate-700/50 border border-amber-300/30 rounded-lg p-4">
            <div className="text-sm text-slate-400 mb-1">Average in {locality}</div>
            <div className="text-lg text-white">Insufficient data</div>
          </div>
        )}
      </div>

      {percentage !== null && (
        <div className={`mt-4 p-4 rounded-lg border ${
          isAbove 
            ? 'bg-red-500/20 border-red-300/50' 
            : isBelow 
            ? 'bg-green-500/20 border-green-300/50' 
            : 'bg-blue-500/20 border-blue-300/50'
        }`}>
          <div className="flex items-center gap-2">
            {isAbove && <TrendingUp size={20} className="text-red-300" />}
            {isBelow && <TrendingDown size={20} className="text-green-300" />}
            {!isAbove && !isBelow && <Minus size={20} className="text-blue-300" />}
            <div className={`font-semibold ${
              isAbove ? 'text-red-300' : isBelow ? 'text-green-300' : 'text-blue-300'
            }`}>
              {isAbove ? `${Math.abs(percentage)}% above` : isBelow ? `${Math.abs(percentage)}% below` : 'At'} average price in this area
            </div>
          </div>
        </div>
      )}
    </div>
  )
}





