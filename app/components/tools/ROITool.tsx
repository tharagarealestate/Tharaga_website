'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AIAnalysisPanel, fmtINR } from './AIAnalysisPanel'

const CHENNAI_LOCALITIES = [
  'Anna Nagar', 'Adyar', 'Velachery', 'Porur', 'Tambaram', 'Perambur',
  'Kodambakkam', 'Nungambakkam', 'T Nagar', 'Mylapore', 'Sholinganallur',
  'OMR', 'ECR', 'Perungudi', 'Guindy', 'Chromepet', 'Pallavaram',
  'Poonamallee', 'Avadi', 'Ambattur', 'Mogappair', 'KK Nagar',
]

function Skeleton() {
  return (
    <div className="space-y-3 mt-4 animate-pulse">
      {[80, 60, 90].map((w, i) => (
        <div key={i} className={`h-3 bg-white/[0.05] rounded-full`} style={{ width: `${w}%` }} />
      ))}
    </div>
  )
}

const INPUT_CLS = 'w-full px-3 py-2.5 bg-zinc-900/80 border border-zinc-800 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-amber-500/40 tabular-nums'
const LABEL_CLS = 'text-[11px] text-zinc-500 uppercase tracking-wider font-semibold mb-1.5 block'

export function ROITool() {
  const resultsRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<any>(null)

  const [form, setForm] = useState({
    propertyPrice: 15000000,
    downPaymentPct: 20,
    interestRate: 9.5,
    loanTenure: 20,
    expectedRent: 35000,
    maintenanceCost: 5000,
    propertyTax: 30000,
    appreciationRate: 8,
    locality: 'Velachery',
    monthlyIncome: 150000,
  })

  function set(k: keyof typeof form, v: number | string) {
    setForm(f => ({ ...f, [k]: v }))
  }

  const loanAmt = form.propertyPrice * (1 - form.downPaymentPct / 100)

  async function analyze() {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/api/tools/roi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property_price: form.propertyPrice,
          down_payment_percentage: form.downPaymentPct,
          expected_rental_income: form.expectedRent,
          city: 'Chennai',
          locality: form.locality,
          property_type: 'apartment',
        }),
      })
      if (!res.ok) throw new Error(`API error ${res.status}`)
      const json = await res.json()
      setResult(json.results ?? json)
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
    } catch (e: any) {
      setError(e.message ?? 'Analysis failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Input Form */}
      <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={14} className="text-amber-400" />
          <span className="text-xs font-bold text-zinc-300 uppercase tracking-widest">Investment Parameters</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Property Price */}
          <div>
            <label className={LABEL_CLS}>Property Price</label>
            <input
              type="number"
              className={INPUT_CLS}
              value={form.propertyPrice}
              onChange={e => set('propertyPrice', Number(e.target.value))}
            />
            <div className="text-[11px] text-zinc-600 mt-1">{fmtINR(form.propertyPrice)}</div>
          </div>

          {/* Locality */}
          <div>
            <label className={LABEL_CLS}>Locality (Chennai)</label>
            <select
              className={INPUT_CLS}
              value={form.locality}
              onChange={e => set('locality', e.target.value)}
            >
              {CHENNAI_LOCALITIES.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          {/* Down Payment */}
          <div>
            <label className={LABEL_CLS}>Down Payment — {form.downPaymentPct}% ({fmtINR(form.propertyPrice * form.downPaymentPct / 100)})</label>
            <input
              type="range" min={10} max={50} step={5}
              value={form.downPaymentPct}
              onChange={e => set('downPaymentPct', Number(e.target.value))}
              className="w-full accent-amber-500 h-1.5 cursor-pointer"
            />
            <div className="text-[11px] text-zinc-600 mt-1">Loan: {fmtINR(loanAmt)}</div>
          </div>

          {/* Interest Rate */}
          <div>
            <label className={LABEL_CLS}>Interest Rate — {form.interestRate}%</label>
            <input
              type="range" min={7} max={14} step={0.25}
              value={form.interestRate}
              onChange={e => set('interestRate', Number(e.target.value))}
              className="w-full accent-amber-500 h-1.5 cursor-pointer"
            />
          </div>

          {/* Loan Tenure */}
          <div>
            <label className={LABEL_CLS}>Loan Tenure — {form.loanTenure} years</label>
            <input
              type="range" min={5} max={30} step={1}
              value={form.loanTenure}
              onChange={e => set('loanTenure', Number(e.target.value))}
              className="w-full accent-amber-500 h-1.5 cursor-pointer"
            />
          </div>

          {/* Expected Rent */}
          <div>
            <label className={LABEL_CLS}>Expected Monthly Rent</label>
            <input
              type="number"
              className={INPUT_CLS}
              value={form.expectedRent}
              onChange={e => set('expectedRent', Number(e.target.value))}
            />
            <div className="text-[11px] text-zinc-600 mt-1">
              Yield: {((form.expectedRent * 12 / form.propertyPrice) * 100).toFixed(2)}%
            </div>
          </div>

          {/* Appreciation Rate */}
          <div>
            <label className={LABEL_CLS}>Appreciation Rate — {form.appreciationRate}% pa</label>
            <input
              type="range" min={5} max={20} step={0.5}
              value={form.appreciationRate}
              onChange={e => set('appreciationRate', Number(e.target.value))}
              className="w-full accent-amber-500 h-1.5 cursor-pointer"
            />
          </div>

          {/* Monthly Income */}
          <div>
            <label className={LABEL_CLS}>Monthly Income (optional)</label>
            <input
              type="number"
              className={INPUT_CLS}
              value={form.monthlyIncome}
              onChange={e => set('monthlyIncome', Number(e.target.value))}
            />
          </div>

          {/* Maintenance */}
          <div>
            <label className={LABEL_CLS}>Monthly Maintenance</label>
            <input
              type="number"
              className={INPUT_CLS}
              value={form.maintenanceCost}
              onChange={e => set('maintenanceCost', Number(e.target.value))}
            />
          </div>

          {/* Property Tax */}
          <div>
            <label className={LABEL_CLS}>Annual Property Tax</label>
            <input
              type="number"
              className={INPUT_CLS}
              value={form.propertyTax}
              onChange={e => set('propertyTax', Number(e.target.value))}
            />
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
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <RefreshCw size={14} className="animate-spin" />
              Analyzing Investment…
            </span>
          ) : (
            'Analyze ROI'
          )}
        </button>

        {loading && <Skeleton />}
        {error && (
          <div className="mt-4 flex items-center justify-between px-3 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
            {error}
            <button onClick={analyze} className="text-xs underline ml-2">Retry</button>
          </div>
        )}
      </div>

      {/* Results */}
      {result && (
        <div ref={resultsRef}>
          <AIAnalysisPanel tool="roi" data={result} />
        </div>
      )}
    </div>
  )
}
