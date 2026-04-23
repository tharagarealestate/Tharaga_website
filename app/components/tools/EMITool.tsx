'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Calculator, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AIAnalysisPanel, fmtINR } from './AIAnalysisPanel'

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

// Quick EMI computation for preview
function calcEMI(loan: number, rate: number, years: number) {
  const r = rate / 12 / 100
  const n = years * 12
  if (r === 0) return loan / n
  return (loan * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
}

export function EMITool() {
  const resultsRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<any>(null)

  const [form, setForm] = useState({
    loanAmount: 10000000,
    interestRate: 9.0,
    loanTenure: 20,
    monthlyIncome: 150000,
    existingEMIs: 0,
  })

  function set(k: keyof typeof form, v: number) {
    setForm(f => ({ ...f, [k]: v }))
  }

  const previewEMI = Math.round(calcEMI(form.loanAmount, form.interestRate, form.loanTenure))
  const emiRatio = form.monthlyIncome > 0 ? ((previewEMI + form.existingEMIs) / form.monthlyIncome * 100).toFixed(1) : '—'

  async function analyze() {
    setLoading(true); setError(null); setResult(null)
    try {
      const res = await fetch('/api/tools/emi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property_price: form.loanAmount / 0.8, // assume 80% LTV
          down_payment_percentage: 20,
          loan_tenure_years: form.loanTenure,
          interest_rate: form.interestRate,
          monthly_income: form.monthlyIncome,
          existing_loans_emi: form.existingEMIs,
        }),
      })
      if (!res.ok) throw new Error(`API error ${res.status}`)
      const json = await res.json()
      // Merge computed values for fallback display
      const merged = {
        monthly_emi: previewEMI,
        loan_amount: form.loanAmount,
        total_interest: Math.round(previewEMI * form.loanTenure * 12 - form.loanAmount),
        total_payable: Math.round(previewEMI * form.loanTenure * 12),
        affordability_ratio: parseFloat(emiRatio as string) || 0,
        disposable_income: form.monthlyIncome - previewEMI - form.existingEMIs,
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
      {/* Live EMI Preview */}
      <div className="bg-amber-500/[0.07] border border-amber-500/20 rounded-2xl p-4 text-center">
        <div className="text-[11px] text-amber-400/70 uppercase tracking-widest font-semibold mb-1">Live EMI Preview</div>
        <div className="text-3xl font-black text-amber-400 tabular-nums">{fmtINR(previewEMI)}</div>
        <div className="text-xs text-zinc-500 mt-1">per month · EMI-to-income: <span className={cn('font-semibold', Number(emiRatio) < 40 ? 'text-emerald-400' : Number(emiRatio) < 55 ? 'text-amber-400' : 'text-red-400')}>{emiRatio}%</span></div>
      </div>

      {/* Input Form */}
      <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Calculator size={14} className="text-amber-400" />
          <span className="text-xs font-bold text-zinc-300 uppercase tracking-widest">Loan Parameters</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={LABEL_CLS}>Loan Amount</label>
            <input type="number" className={INPUT_CLS} value={form.loanAmount}
              onChange={e => set('loanAmount', Number(e.target.value))} />
            <div className="text-[11px] text-zinc-600 mt-1">{fmtINR(form.loanAmount)}</div>
          </div>

          <div>
            <label className={LABEL_CLS}>Monthly Income</label>
            <input type="number" className={INPUT_CLS} value={form.monthlyIncome}
              onChange={e => set('monthlyIncome', Number(e.target.value))} />
          </div>

          <div>
            <label className={LABEL_CLS}>Interest Rate — {form.interestRate}%</label>
            <input type="range" min={7} max={14} step={0.25}
              value={form.interestRate}
              onChange={e => set('interestRate', Number(e.target.value))}
              className="w-full accent-amber-500 h-1.5 cursor-pointer" />
          </div>

          <div>
            <label className={LABEL_CLS}>Loan Tenure — {form.loanTenure} years</label>
            <input type="range" min={5} max={30} step={1}
              value={form.loanTenure}
              onChange={e => set('loanTenure', Number(e.target.value))}
              className="w-full accent-amber-500 h-1.5 cursor-pointer" />
          </div>

          <div className="sm:col-span-2">
            <label className={LABEL_CLS}>Existing Monthly EMIs</label>
            <input type="number" className={INPUT_CLS} value={form.existingEMIs}
              onChange={e => set('existingEMIs', Number(e.target.value))} />
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
            ? <span className="flex items-center justify-center gap-2"><RefreshCw size={14} className="animate-spin" />Analyzing…</span>
            : 'Analyze EMI'
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
          <AIAnalysisPanel tool="emi" data={result} />
        </div>
      )}
    </div>
  )
}
