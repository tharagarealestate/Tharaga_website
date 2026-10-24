'use client'

import { useState, useRef } from 'react'
import { Building2, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AIAnalysisPanel, fmtINR } from './AIAnalysisPanel'

const EMPLOYMENT_TYPES = [
  { value: 'salaried', label: 'Salaried' },
  { value: 'self_employed', label: 'Self-Employed' },
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

export function LoanTool() {
  const resultsRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<any>(null)

  const [form, setForm] = useState({
    monthlyIncome: 120000,
    age: 32,
    existingEMIs: 0,
    employmentType: 'salaried',
    creditScore: 750,
    coApplicantIncome: 0,
  })

  function set(k: keyof typeof form, v: number | string) {
    setForm(f => ({ ...f, [k]: v }))
  }

  // Quick eligibility estimate: 60x monthly income rule
  const totalIncome = form.monthlyIncome + (form.coApplicantIncome || 0)
  const estimatedEligibility = Math.round((totalIncome - form.existingEMIs) * 0.5 * 12 * Math.min(30, 60 - form.age))
  const approval = form.creditScore >= 750 ? 92 : form.creditScore >= 700 ? 75 : 55

  async function analyze() {
    setLoading(true); setError(null); setResult(null)
    try {
      const res = await fetch('/api/tools/loan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monthly_income: form.monthlyIncome,
          existing_loans_emi: form.existingEMIs,
          property_price: estimatedEligibility / 0.8,
          preferred_tenure_years: Math.min(30, 60 - form.age),
          cibil_score: form.creditScore,
          employment_type: form.employmentType,
          city: 'Chennai',
        }),
      })
      if (!res.ok) throw new Error(`API error ${res.status}`)
      const json = await res.json()
      const merged = {
        max_loan_eligibility: estimatedEligibility,
        approval_likelihood: approval,
        best_rate: 8.5,
        recommended_emi: Math.round(totalIncome * 0.4),
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
      {/* Eligibility preview */}
      <div className="bg-blue-500/[0.07] border border-blue-500/20 rounded-2xl p-4 text-center">
        <div className="text-[11px] text-blue-400/70 uppercase tracking-widest font-semibold mb-1">Estimated Eligibility</div>
        <div className="text-3xl font-black text-blue-400 tabular-nums">{fmtINR(estimatedEligibility)}</div>
        <div className="text-xs text-zinc-500 mt-1">
          Approval likelihood: <span className={cn('font-semibold', approval >= 80 ? 'text-emerald-400' : approval >= 60 ? 'text-amber-400' : 'text-red-400')}>{approval}%</span>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Building2 size={14} className="text-blue-400" />
          <span className="text-xs font-bold text-zinc-300 uppercase tracking-widest">Applicant Details</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={LABEL_CLS}>Monthly Income</label>
            <input type="number" className={INPUT_CLS} value={form.monthlyIncome}
              onChange={e => set('monthlyIncome', Number(e.target.value))} />
            <div className="text-[11px] text-zinc-600 mt-1">{fmtINR(form.monthlyIncome)}/mo</div>
          </div>

          <div>
            <label className={LABEL_CLS}>Age</label>
            <input type="number" className={INPUT_CLS} min={21} max={65} value={form.age}
              onChange={e => set('age', Number(e.target.value))} />
            <div className="text-[11px] text-zinc-600 mt-1">Max tenure: {Math.min(30, 60 - form.age)} years</div>
          </div>

          <div>
            <label className={LABEL_CLS}>Credit Score (CIBIL)</label>
            <input type="number" className={INPUT_CLS} min={300} max={900} value={form.creditScore}
              onChange={e => set('creditScore', Number(e.target.value))} />
            <div className={cn('text-[11px] mt-1', form.creditScore >= 750 ? 'text-emerald-400' : form.creditScore >= 700 ? 'text-amber-400' : 'text-red-400')}>
              {form.creditScore >= 750 ? 'Excellent' : form.creditScore >= 700 ? 'Good' : 'Needs improvement'}
            </div>
          </div>

          <div>
            <label className={LABEL_CLS}>Existing Monthly EMIs</label>
            <input type="number" className={INPUT_CLS} value={form.existingEMIs}
              onChange={e => set('existingEMIs', Number(e.target.value))} />
          </div>

          {/* Employment type */}
          <div>
            <label className={LABEL_CLS}>Employment Type</label>
            <div className="flex gap-2">
              {EMPLOYMENT_TYPES.map(t => (
                <button
                  key={t.value}
                  onClick={() => set('employmentType', t.value)}
                  className={cn(
                    'flex-1 py-2 rounded-xl text-xs font-semibold border transition-all',
                    form.employmentType === t.value
                      ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                      : 'border-white/[0.08] text-zinc-500 hover:text-zinc-300',
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={LABEL_CLS}>Co-Applicant Income (optional)</label>
            <input type="number" className={INPUT_CLS} value={form.coApplicantIncome}
              onChange={e => set('coApplicantIncome', Number(e.target.value))} />
            {form.coApplicantIncome > 0 && (
              <div className="text-[11px] text-emerald-400 mt-1">
                Combined: {fmtINR(form.monthlyIncome + form.coApplicantIncome)}/mo
              </div>
            )}
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
            ? <span className="flex items-center justify-center gap-2"><RefreshCw size={14} className="animate-spin" />Checking Eligibility…</span>
            : 'Check Loan Eligibility'
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
          <AIAnalysisPanel tool="loan" data={result} />
        </div>
      )}
    </div>
  )
}
