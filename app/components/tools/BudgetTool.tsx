'use client'

import { useState, useRef } from 'react'
import { PiggyBank, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AIAnalysisPanel, fmtINR } from './AIAnalysisPanel'

const LOCALITIES = [
  'Anna Nagar', 'Adyar', 'Velachery', 'Porur', 'Tambaram',
  'OMR', 'Sholinganallur', 'Perungudi', 'Ambattur', 'Avadi',
]

const PROPERTY_TYPES = ['1BHK', '2BHK', '3BHK', 'Villa']
const TIMELINES = [
  { value: '6m', label: '6 Months' },
  { value: '1yr', label: '1 Year' },
  { value: '2yr', label: '2 Years' },
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

const INPUT_CLS = 'w-full px-3 py-2.5 bg-zinc-900/80 border border-zinc-800 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-amber-500/40 tabular-nums'
const LABEL_CLS = 'text-[11px] text-zinc-500 uppercase tracking-wider font-semibold mb-1.5 block'

export function BudgetTool() {
  const resultsRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<any>(null)

  const [form, setForm] = useState({
    monthlyIncome: 150000,
    currentSavings: 2000000,
    monthlyExpenses: 60000,
    propertyType: '2BHK',
    timeline: '1yr',
    localities: ['Velachery', 'OMR'] as string[],
  })

  function toggleLocality(loc: string) {
    setForm(f => ({
      ...f,
      localities: f.localities.includes(loc)
        ? f.localities.filter(l => l !== loc)
        : [...f.localities, loc],
    }))
  }

  // Quick budget preview: 50x monthly income or 5x annual income
  const estBudget = form.monthlyIncome * 50
  const maxEMI = Math.round(form.monthlyIncome * 0.4)

  async function analyze() {
    setLoading(true); setError(null); setResult(null)
    try {
      const res = await fetch('/api/tools/budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primary_income_monthly: form.monthlyIncome,
          monthly_expenses: form.monthlyExpenses,
          savings_available: form.currentSavings,
          city: 'Chennai',
          family_type: 'couple',
        }),
      })
      if (!res.ok) throw new Error(`API error ${res.status}`)
      const json = await res.json()
      const merged = {
        max_property_budget: estBudget,
        max_loan_eligible: Math.round(estBudget * 0.8),
        down_payment_needed: Math.round(estBudget * 0.2),
        recommended_emi: maxEMI,
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
      {/* Preview strip */}
      <div className="grid grid-cols-3 gap-2.5">
        {[
          { label: 'Est. Budget', val: fmtINR(estBudget) },
          { label: 'Max EMI', val: fmtINR(maxEMI) },
          { label: 'Down Payment', val: fmtINR(form.currentSavings) },
        ].map(({ label, val }) => (
          <div key={label} className="bg-amber-500/[0.07] border border-amber-500/20 rounded-xl p-3 text-center">
            <div className="text-[10px] text-amber-400/70 uppercase tracking-wider mb-0.5">{label}</div>
            <div className="text-sm font-bold text-amber-400 tabular-nums">{val}</div>
          </div>
        ))}
      </div>

      {/* Form */}
      <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <PiggyBank size={14} className="text-emerald-400" />
          <span className="text-xs font-bold text-zinc-300 uppercase tracking-widest">Budget Parameters</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={LABEL_CLS}>Monthly Income</label>
            <input type="number" className={INPUT_CLS} value={form.monthlyIncome}
              onChange={e => setForm(f => ({ ...f, monthlyIncome: Number(e.target.value) }))} />
            <div className="text-[11px] text-zinc-600 mt-1">{fmtINR(form.monthlyIncome)}/mo</div>
          </div>

          <div>
            <label className={LABEL_CLS}>Current Savings</label>
            <input type="number" className={INPUT_CLS} value={form.currentSavings}
              onChange={e => setForm(f => ({ ...f, currentSavings: Number(e.target.value) }))} />
            <div className="text-[11px] text-zinc-600 mt-1">{fmtINR(form.currentSavings)}</div>
          </div>

          <div>
            <label className={LABEL_CLS}>Monthly Expenses</label>
            <input type="number" className={INPUT_CLS} value={form.monthlyExpenses}
              onChange={e => setForm(f => ({ ...f, monthlyExpenses: Number(e.target.value) }))} />
          </div>

          {/* Property Type */}
          <div>
            <label className={LABEL_CLS}>Property Type</label>
            <div className="flex gap-2 flex-wrap">
              {PROPERTY_TYPES.map(pt => (
                <button
                  key={pt}
                  onClick={() => setForm(f => ({ ...f, propertyType: pt }))}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all',
                    form.propertyType === pt
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'border-white/[0.08] text-zinc-500 hover:text-zinc-300',
                  )}
                >
                  {pt}
                </button>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div>
            <label className={LABEL_CLS}>Purchase Timeline</label>
            <div className="flex gap-2">
              {TIMELINES.map(t => (
                <button
                  key={t.value}
                  onClick={() => setForm(f => ({ ...f, timeline: t.value }))}
                  className={cn(
                    'flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all',
                    form.timeline === t.value
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'border-white/[0.08] text-zinc-500 hover:text-zinc-300',
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Localities */}
          <div className="sm:col-span-2">
            <label className={LABEL_CLS}>Target Localities (select multiple)</label>
            <div className="flex flex-wrap gap-2">
              {LOCALITIES.map(loc => (
                <button
                  key={loc}
                  onClick={() => toggleLocality(loc)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-xs border transition-all',
                    form.localities.includes(loc)
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'border-white/[0.08] text-zinc-500 hover:text-zinc-300',
                  )}
                >
                  {loc}
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
            ? <span className="flex items-center justify-center gap-2"><RefreshCw size={14} className="animate-spin" />Analyzing Budget…</span>
            : 'Analyze Budget'
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
          <AIAnalysisPanel tool="budget" data={result} />
        </div>
      )}
    </div>
  )
}
