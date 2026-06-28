'use client'

import { useState, useRef } from 'react'
import { MapPin, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AIAnalysisPanel, fmtINR } from './AIAnalysisPanel'

const CHENNAI_LOCALITIES = [
  'Anna Nagar', 'Adyar', 'Velachery', 'Porur', 'Tambaram', 'Perambur',
  'Kodambakkam', 'Nungambakkam', 'T Nagar', 'Mylapore', 'Sholinganallur',
  'OMR', 'ECR', 'Perungudi', 'Guindy', 'Chromepet', 'Pallavaram',
  'Poonamallee', 'Avadi', 'Ambattur', 'Mogappair', 'KK Nagar',
]

const PROPERTY_TYPES = ['Apartment', 'Villa', 'Plot', 'Commercial']
const PRIORITIES = [
  { value: 'appreciation', label: 'Appreciation' },
  { value: 'rental', label: 'Rental Yield' },
  { value: 'lifestyle', label: 'Lifestyle' },
]

function Skeleton() {
  return (
    <div className="space-y-3 mt-4 animate-pulse">
      {[80, 60, 90].map((w, i) => (
        <div key={i} className="h-3 bg-white/[0.05] rounded-full" style={{ width: `${w}%` }} />
      ))}
    </div>
  )
}

const INPUT_CLS = 'w-full px-3 py-2.5 bg-zinc-900/80 border border-zinc-800 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-amber-500/40'
const LABEL_CLS = 'text-[11px] text-zinc-500 uppercase tracking-wider font-semibold mb-1.5 block'

export function LocalityTool() {
  const resultsRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<any>(null)

  const [form, setForm] = useState({
    locality: 'Velachery',
    propertyType: 'Apartment',
    budget: 8000000,
    priority: 'appreciation',
  })

  async function analyze() {
    setLoading(true); setError(null); setResult(null)
    try {
      const res = await fetch('/api/tools/locality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primary_priorities: [form.priority],
          family_type: 'couple',
          city: 'Chennai',
          preferred_localities: [form.locality],
          work_location: 'Chennai CBD',
        }),
      })
      if (!res.ok) throw new Error(`API error ${res.status}`)
      const json = await res.json()
      const merged = {
        locality_name: form.locality,
        livability_score: 78,
        tags: ['Growth Zone', 'Metro Nearby', 'IT Corridor'],
        green_flags: ['Good connectivity', 'RERA compliant projects', 'Rising property values'],
        red_flags: ['Traffic congestion', 'Limited parking'],
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
      {/* Form */}
      <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <MapPin size={14} className="text-purple-400" />
          <span className="text-xs font-bold text-zinc-300 uppercase tracking-widest">Locality Parameters</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Locality dropdown */}
          <div>
            <label className={LABEL_CLS}>Locality (Chennai)</label>
            <select
              className={INPUT_CLS}
              value={form.locality}
              onChange={e => setForm(f => ({ ...f, locality: e.target.value }))}
            >
              {CHENNAI_LOCALITIES.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          {/* Property Type */}
          <div>
            <label className={LABEL_CLS}>Property Type</label>
            <div className="flex flex-wrap gap-2">
              {PROPERTY_TYPES.map(pt => (
                <button
                  key={pt}
                  onClick={() => setForm(f => ({ ...f, propertyType: pt }))}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all',
                    form.propertyType === pt
                      ? 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                      : 'border-white/[0.08] text-zinc-500 hover:text-zinc-300',
                  )}
                >
                  {pt}
                </button>
              ))}
            </div>
          </div>

          {/* Budget slider */}
          <div className="sm:col-span-2">
            <label className={LABEL_CLS}>Budget — {fmtINR(form.budget)}</label>
            <input
              type="range"
              min={2000000} max={50000000} step={500000}
              value={form.budget}
              onChange={e => setForm(f => ({ ...f, budget: Number(e.target.value) }))}
              className="w-full accent-purple-500 h-1.5 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-zinc-600 mt-1">
              <span>₹20 L</span>
              <span>₹5 Cr</span>
            </div>
          </div>

          {/* Priority */}
          <div className="sm:col-span-2">
            <label className={LABEL_CLS}>Investment Priority</label>
            <div className="flex gap-2">
              {PRIORITIES.map(p => (
                <button
                  key={p.value}
                  onClick={() => setForm(f => ({ ...f, priority: p.value }))}
                  className={cn(
                    'flex-1 py-2 rounded-xl text-xs font-semibold border transition-all',
                    form.priority === p.value
                      ? 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                      : 'border-white/[0.08] text-zinc-500 hover:text-zinc-300',
                  )}
                >
                  {p.label}
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
            ? <span className="flex items-center justify-center gap-2"><RefreshCw size={14} className="animate-spin" />Analyzing Locality…</span>
            : 'Analyze Locality'
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
          <AIAnalysisPanel tool="locality" data={result} />
        </div>
      )}
    </div>
  )
}
