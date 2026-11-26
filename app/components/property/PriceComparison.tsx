'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { getSupabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

interface PriceComparisonProps {
  propertyId: string
  pricePerSqft: number | null
  locality: string | null
  city: string | null
}

export default function PriceComparison({ propertyId, pricePerSqft, locality, city }: PriceComparisonProps) {
  const [avgPrice, setAvgPrice] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchAveragePrice() }, [locality, city])

  async function fetchAveragePrice() {
    if (!locality || !pricePerSqft) { setLoading(false); return }
    try {
      setLoading(true)
      const supabase = getSupabase()
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
      if (data?.length) {
        const valid = data.map(p => {
          const area = p.carpet_area || p.sqft || p.super_built_up_area
          return (area && p.price_inr && area > 0) ? p.price_inr / area : null
        }).filter((x): x is number => x !== null)
        if (valid.length) setAvgPrice(Math.round(valid.reduce((a, b) => a + b, 0) / valid.length))
      }
    } catch {}
    finally { setLoading(false) }
  }

  if (!pricePerSqft) return null

  const diff = avgPrice ? pricePerSqft - avgPrice : null
  const pct  = avgPrice && diff ? Math.round((diff / avgPrice) * 100) : null
  const above = diff !== null && diff > 0
  const below = diff !== null && diff < 0

  return (
    <div className="space-y-4">
      {/* Price comparison row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/[0.04] border border-white/[0.07] rounded-xl p-4">
          <p className="text-[10px] text-zinc-600 uppercase tracking-widest mb-1">This Property</p>
          <p className="text-xl font-black text-amber-400">₹{pricePerSqft.toLocaleString('en-IN')}</p>
          <p className="text-[10px] text-zinc-600 mt-0.5">per sqft</p>
        </div>

        <div className="bg-white/[0.04] border border-white/[0.07] rounded-xl p-4">
          <p className="text-[10px] text-zinc-600 uppercase tracking-widest mb-1">
            {locality ? `Avg in ${locality}` : 'Area Average'}
          </p>
          {loading ? (
            <div className="flex items-center gap-2 pt-1">
              <div className="h-3.5 w-3.5 rounded-full border-2 border-amber-500/30 border-t-amber-400 animate-spin" />
              <span className="text-xs text-zinc-600">Loading…</span>
            </div>
          ) : avgPrice ? (
            <>
              <p className="text-xl font-black text-zinc-200">₹{avgPrice.toLocaleString('en-IN')}</p>
              <p className="text-[10px] text-zinc-600 mt-0.5">per sqft</p>
            </>
          ) : (
            <p className="text-sm text-zinc-500 pt-1">Insufficient data</p>
          )}
        </div>
      </div>

      {/* Comparison verdict */}
      {pct !== null && (
        <div className={cn(
          'flex items-center gap-2.5 px-4 py-3 rounded-xl border',
          above
            ? 'bg-red-500/[0.06] border-red-500/15'
            : below
            ? 'bg-emerald-500/[0.06] border-emerald-500/15'
            : 'bg-white/[0.04] border-white/[0.07]',
        )}>
          {above && <TrendingUp size={14} className="text-red-400 flex-shrink-0" />}
          {below && <TrendingDown size={14} className="text-emerald-400 flex-shrink-0" />}
          {!above && !below && <Minus size={14} className="text-zinc-500 flex-shrink-0" />}
          <span className={cn(
            'text-sm font-semibold',
            above ? 'text-red-400' : below ? 'text-emerald-400' : 'text-zinc-400',
          )}>
            {above
              ? `${Math.abs(pct)}% above area average`
              : below
              ? `${Math.abs(pct)}% below area average — good value`
              : 'At area average price'}
          </span>
        </div>
      )}
    </div>
  )
}
