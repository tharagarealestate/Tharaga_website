'use client'

import { useState, useRef } from 'react'
import { BarChart3, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AIAnalysisPanel, fmtINR } from './AIAnalysisPanel'

const CHENNAI_LOCALITIES = [
  'Anna Nagar', 'Adyar', 'Velachery', 'Porur', 'Tambaram', 'Perambur',
  'Kodambakkam', 'Nungambakkam', 'T Nagar', 'Mylapore', 'Sholinganallur',
  'OMR', 'ECR', 'Perungudi', 'Guindy', 'Chromepet', 'Pallavaram',
  'Poonamallee', 'Avadi', 'Ambattur', 'Mogappair', 'KK Nagar',
]

const PROPERTY_TYPES = [
  { value: 'apartment', label: 'Apartment' },
  { value: 'villa', label: 'Villa' },
  { value: 'plot', label: 'Plot' },
]

const FACING_OPTIONS = ['North', 'South', 'East', 'West', 'North-East', 'North-West']

const AMENITY_OPTIONS = [
  'Gym', 'Swimming Pool', 'Clubhouse', 'Children Play Area',
  'Security', 'Power Backup', 'Lift', 'Car Parking',
]

// Rate per sqft by locality — rough indicative values
const LOCALITY_RATE: Record<string, number> = {
  'Adyar': 14000, 'Anna Nagar': 12500, 'Nungambakkam': 15000, 'T Nagar': 13000,
  'Mylapore': 11500, 'Velachery': 9000, 'Sholinganallur': 8500, 'OMR': 7000,
  'Perungudi': 9500, 'Guindy': 10000, 'Porur': 7500, 'Tambaram': 5500,
  'Chromepet': 5800, 'Pallavaram': 6000, 'Ambattur': 5500, 'Mogappair': 7000,
  'KK Nagar': 8000, 'Poonamallee': 5000, 'Avadi': 4500, 'ECR': 8000,
  'Perambur': 6500, 'Kodambakkam': 9500,
}

function Skeleton() {
  return (
    <div className="space-y-3 mt-4 animate-pulse">
      {[80, 60, 90].map((w, i) => (
        <div key={i} className="h-3 bg-white/[0.05] rounded-full" style={{ width: `${w}%` }} />
      ))}
    </div>
  )
}

const INPUT_CLS = 'w-full px-3 py-2.5 bg-zinc-900/80 border border-zinc-800 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-amber-500/40 tabular-nums'
const LABEL_CLS = 'text-[11px] text-zinc-500 uppercase tracking-wider font-semibold mb-1.5 block'

export function ValuationTool() {
  const resultsRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<any>(null)

  const [form, setForm] = useState({
    propertyType: 'apartment',
    area: 1200,
    locality: 'Velachery',
    age: 3,
    floor: 5,
    facing: 'East',
    reraRegistered: true,
    amenities: ['Gym', 'Lift', 'Car Parking', 'Security'] as string[],
  })

  function toggleAmenity(a: string) {
    setForm(f => ({
      ...f,
      amenities: f.amenities.includes(a)
        ? f.amenities.filter(x => x !== a)
        : [...f.amenities, a],
    }))
  }

  // Live estimate preview
  const baseRate = LOCALITY_RATE[form.locality] ?? 7000
  const ageFactor = Math.max(0.7, 1 - form.age * 0.02)
  const amenityFactor = 1 + form.amenities.length * 0.01
  const reraFactor = form.reraRegistered ? 1.03 : 1
  const facingFactor = ['North-East', 'East'].includes(form.facing) ? 1.02 : 1
  const pricePsqft = Math.round(baseRate * ageFactor * amenityFactor * reraFactor * facingFactor)
  const estValue = pricePsqft * form.area

  async function analyze() {
    setLoading(true); setError(null); setResult(null)
    try {
      const res = await fetch('/api/tools/valuation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property_type: form.propertyType,
          bhk_config: form.area > 1500 ? '3BHK' : form.area > 1000 ? '2BHK' : '1BHK',
          total_area_sqft: form.area,
          locality: form.locality,
          city: 'Chennai',
          property_age_years: form.age,
          furnishing: 'unfurnished',
        }),
      })
      if (!res.ok) throw new Error(`API error ${res.status}`)
      const json = await res.json()
      const merged = {
        estimated_value: estValue,
        price_per_sqft: pricePsqft,
        value_range: { low: Math.round(estValue * 0.93), high: Math.round(estValue * 1.07) },
        rera_status: form.reraRegistered,
        rera_note: form.reraRegistered
          ? 'Project is RERA registered — buyers have statutory protection.'
          : 'Not RERA registered — verify with Tamil Nadu RERA portal.',
        negotiation_strategy: {
          recommended_offer: Math.round(estValue * 0.95),
          tips: [
            'Quote comparable sales in the same complex',
            'Highlight maintenance cost liabilities',
            'Check OC/CC status as a negotiation lever',
          ],
        },
        ...(json.results ?? json),
      }
      setResult(merged)
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
    } catch (e: any) {
      setError(e.message ?? 'Analysis failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Live estimate strip */}
      <div className="grid grid-cols-3 gap-2.5">
        {[
          { label: 'Estimated Value', val: fmtINR(estValue) },
          { label: '₹/sqft', val: `₹${pricePsqft.toLocaleString('en-IN')}` },
          { label: 'Range', val: `${fmtINR(estValue * 0.93)}–${fmtINR(estValue * 1.07)}` },
        ].map(({ label, val }) => (
          <div key={label} className="bg-amber-500/[0.07] border border-amber-500/20 rounded-xl p-3 text-center">
            <div className="text-[10px] text-amber-400/70 uppercase tracking-wider mb-0.5">{label}</div>
            <div className="text-sm font-bold text-amber-400 tabular-nums leading-tight">{val}</div>
          </div>
        ))}
      </div>

      {/* Form */}
      <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 size={14} className="text-amber-400" />
          <span className="text-xs font-bold text-zinc-300 uppercase tracking-widest">Property Details</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Property Type */}
          <div>
            <label className={LABEL_CLS}>Property Type</label>
            <div className="flex gap-2">
              {PROPERTY_TYPES.map(pt => (
                <button
                  key={pt.value}
                  onClick={() => setForm(f => ({ ...f, propertyType: pt.value }))}
                  className={cn(
                    'flex-1 py-2 rounded-xl text-xs font-semibold border transition-all',
                    form.propertyType === pt.value
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                      : 'border-white/[0.08] text-zinc-500 hover:text-zinc-300',
                  )}
                >
                  {pt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Locality */}
          <div>
            <label className={LABEL_CLS}>Locality</label>
            <select
              className={INPUT_CLS}
              value={form.locality}
              onChange={e => setForm(f => ({ ...f, locality: e.target.value }))}
            >
              {CHENNAI_LOCALITIES.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          {/* Area */}
          <div>
            <label className={LABEL_CLS}>Area (sqft)</label>
            <input type="number" className={INPUT_CLS} value={form.area}
              onChange={e => setForm(f => ({ ...f, area: Number(e.target.value) }))} />
          </div>

          {/* Age */}
          <div>
            <label className={LABEL_CLS}>Property Age (years)</label>
            <input type="number" className={INPUT_CLS} min={0} max={40} value={form.age}
              onChange={e => setForm(f => ({ ...f, age: Number(e.target.value) }))} />
          </div>

          {/* Floor */}
          <div>
            <label className={LABEL_CLS}>Floor Number</label>
            <input type="number" className={INPUT_CLS} min={0} max={40} value={form.floor}
              onChange={e => setForm(f => ({ ...f, floor: Number(e.target.value) }))} />
          </div>

          {/* Facing */}
          <div>
            <label className={LABEL_CLS}>Facing</label>
            <select
              className={INPUT_CLS}
              value={form.facing}
              onChange={e => setForm(f => ({ ...f, facing: e.target.value }))}
            >
              {FACING_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          {/* RERA toggle */}
          <div>
            <label className={LABEL_CLS}>RERA Registered</label>
            <button
              onClick={() => setForm(f => ({ ...f, reraRegistered: !f.reraRegistered }))}
              className={cn(
                'w-full py-2.5 rounded-xl text-sm font-semibold border transition-all',
                form.reraRegistered
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'border-white/[0.08] text-zinc-500',
              )}
            >
              {form.reraRegistered ? 'Yes — RERA Registered' : 'No — Not Registered'}
            </button>
          </div>

          {/* Amenities */}
          <div className="sm:col-span-2">
            <label className={LABEL_CLS}>Amenities Available</label>
            <div className="flex flex-wrap gap-2">
              {AMENITY_OPTIONS.map(a => (
                <button
                  key={a}
                  onClick={() => toggleAmenity(a)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-xs border transition-all',
                    form.amenities.includes(a)
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                      : 'border-white/[0.08] text-zinc-500 hover:text-zinc-300',
                  )}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={analyze}
          disabled={loading}
          className={cn(
            'mt-5 w-full px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm transition-all',
            loading && 'opacity-60 cursor-not-allowed',
          )}
        >
          {loading
            ? <span className="flex items-center justify-center gap-2"><RefreshCw size={14} className="animate-spin" />Analyzing Valuation…</span>
            : 'Get AI Valuation'
          }
        </button>

        {loading && <Skeleton />}
        {error && (
          <div className="mt-4 flex items-center justify-between px-3 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
            {error}
            <button onClick={analyze} className="text-xs underline ml-2">Retry</button>
          </div>
        )}
      </div>

      {result && (
        <div ref={resultsRef}>
          <AIAnalysisPanel tool="valuation" data={result} />
        </div>
      )}
    </div>
  )
}
