'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle2, AlertTriangle, XCircle, TrendingUp, TrendingDown,
  ChevronDown, ChevronUp, Share2, Bookmark, HelpCircle, MapPin,
  Building2, Zap, Shield, BarChart3, Brain, Star, ArrowRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Helpers ────────────────────────────────────────────────────────────────────
export function fmtINR(n: number): string {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`
  return `₹${n.toLocaleString('en-IN')}`
}

function VerdictBadge({ verdict }: { verdict: string }) {
  const v = verdict?.toUpperCase()
  const cls =
    v === 'BUY' || v === 'EXCELLENT'
      ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
      : v === 'HOLD' || v === 'GOOD' || v === 'MODERATE'
      ? 'text-amber-400 bg-amber-500/10 border border-amber-500/20'
      : 'text-red-400 bg-red-500/10 border border-red-500/20'
  const Icon =
    v === 'BUY' || v === 'EXCELLENT'
      ? CheckCircle2
      : v === 'HOLD' || v === 'GOOD' || v === 'MODERATE'
      ? AlertTriangle
      : XCircle
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold', cls)}>
      <Icon size={14} />
      {v}
    </span>
  )
}

function MetricCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-3.5">
      <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mb-1">{label}</div>
      <div className="text-amber-400 font-bold tabular-nums text-base leading-tight">{value}</div>
      {sub && <div className="text-[11px] text-zinc-600 mt-0.5">{sub}</div>}
    </div>
  )
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">{children}</div>
  )
}

function BulletList({ items, color = 'amber' }: { items: string[]; color?: 'amber' | 'emerald' | 'red' | 'zinc' }) {
  const dotCls = {
    amber: 'bg-amber-400',
    emerald: 'bg-emerald-400',
    red: 'bg-red-400',
    zinc: 'bg-zinc-600',
  }[color]
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5 text-sm text-zinc-300">
          <span className={cn('mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0', dotCls)} />
          {item}
        </li>
      ))}
    </ul>
  )
}

function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5', className)}>
      {children}
    </div>
  )
}

// ── Amortization Table ─────────────────────────────────────────────────────────
function AmortizationTable({ loanAmount, interestRate, tenure }: {
  loanAmount: number; interestRate: number; tenure: number
}) {
  const [showAll, setShowAll] = useState(false)
  const monthlyRate = interestRate / 12 / 100
  const totalMonths = tenure * 12
  const emi = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
    (Math.pow(1 + monthlyRate, totalMonths) - 1)

  const rows: { year: number; principal: number; interest: number; balance: number }[] = []
  let balance = loanAmount
  for (let y = 1; y <= tenure; y++) {
    let yearPrincipal = 0; let yearInterest = 0
    for (let m = 0; m < 12; m++) {
      const int = balance * monthlyRate
      const prin = emi - int
      yearInterest += int; yearPrincipal += prin; balance -= prin
    }
    rows.push({ year: y, principal: Math.round(yearPrincipal), interest: Math.round(yearInterest), balance: Math.max(0, Math.round(balance)) })
  }
  const visible = showAll ? rows : rows.slice(0, 5)

  return (
    <div className="mt-4">
      <SectionHeader>Amortization Schedule (Yearly)</SectionHeader>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-zinc-600 border-b border-white/[0.05]">
              <th className="text-left pb-2 font-semibold">Year</th>
              <th className="text-right pb-2 font-semibold">Principal</th>
              <th className="text-right pb-2 font-semibold">Interest</th>
              <th className="text-right pb-2 font-semibold">Balance</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => (
              <tr key={r.year} className="border-b border-white/[0.03] text-zinc-400">
                <td className="py-1.5">Yr {r.year}</td>
                <td className="text-right text-emerald-400 tabular-nums">{fmtINR(r.principal)}</td>
                <td className="text-right text-red-400/80 tabular-nums">{fmtINR(r.interest)}</td>
                <td className="text-right tabular-nums">{fmtINR(r.balance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > 5 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-2 flex items-center gap-1 text-xs text-amber-400/70 hover:text-amber-400 transition-colors"
        >
          {showAll ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          {showAll ? 'Show less' : `Show all ${rows.length} years`}
        </button>
      )}
    </div>
  )
}

// ── ROI Sections ──────────────────────────────────────────────────────────────
function ROIPanel({ data }: { data: any }) {
  const r = data
  const verdict =
    r.investment_recommendation === 'excellent' ? 'BUY'
    : r.investment_recommendation === 'good' ? 'BUY'
    : r.investment_recommendation === 'moderate' ? 'HOLD'
    : 'AVOID'

  const score = r.investment_score ?? 72
  const ten = r.years_10 || {}
  const loanAmt = r.loan_amount ?? 0
  const interestRate = r.interest_rate ?? 8.5
  const tenure = r.loan_tenure_years ?? 20

  return (
    <div className="space-y-4">
      {/* 1. Verdict */}
      <Panel>
        <SectionHeader>Investment Verdict</SectionHeader>
        <div className="flex items-start gap-4 flex-wrap">
          <div>
            <VerdictBadge verdict={verdict} />
            <div className="mt-2 text-xs text-zinc-500">
              Confidence: <span className="text-amber-400 font-semibold">{r.market_forecast?.confidence_level ?? score}%</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm text-zinc-300 leading-relaxed">
              {verdict === 'BUY'
                ? `Strong investment case at ${r.rental_yield_percentage?.toFixed(1)}% yield. Market timing and fundamentals align for entry.`
                : verdict === 'HOLD'
                ? `Moderate returns expected. Consider negotiating price or waiting 3–6 months for better entry.`
                : `Risk factors outweigh returns at current pricing. Explore alternative localities or property types.`}
            </div>
          </div>
        </div>
        {/* Score bar */}
        <div className="mt-3">
          <div className="flex justify-between text-xs text-zinc-500 mb-1">
            <span>AI Investment Score</span>
            <span className="text-amber-400 font-bold">{score}/100</span>
          </div>
          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${score}%` }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
              className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full"
            />
          </div>
        </div>
      </Panel>

      {/* 2. Financial Breakdown */}
      <Panel>
        <SectionHeader>Financial Breakdown</SectionHeader>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-4">
          <MetricCard label="Monthly EMI" value={fmtINR(r.monthly_emi ?? 0)} />
          <MetricCard label="Net Yield" value={`${r.rental_yield_percentage?.toFixed(2)}%`} />
          <MetricCard
            label="10-yr Return"
            value={`${ten.annualized_roi ?? '--'}% pa`}
            sub="Annualized"
          />
          <MetricCard label="10-yr Value" value={fmtINR(ten.property_value ?? 0)} />
          <MetricCard label="10-yr Net Profit" value={fmtINR(ten.net_profit ?? 0)} />
          <MetricCard label="Interest Paid" value={fmtINR(ten.interest_paid ?? 0)} />
        </div>
        {loanAmt > 0 && (
          <AmortizationTable loanAmount={loanAmt} interestRate={interestRate} tenure={tenure} />
        )}
      </Panel>

      {/* 3. Risk Assessment */}
      <Panel>
        <SectionHeader>Risk Assessment</SectionHeader>
        <div className="flex items-center gap-2 mb-3">
          <span className={cn('px-2.5 py-1 rounded-lg text-xs font-semibold border',
            (r.market_forecast?.market_risk_score ?? 30) < 35
              ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
              : (r.market_forecast?.market_risk_score ?? 30) < 60
              ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
              : 'text-red-400 bg-red-500/10 border-red-500/20'
          )}>
            Risk Score: {r.market_forecast?.market_risk_score ?? 30}/100
          </span>
        </div>
        <BulletList items={r.risk_factors?.length ? r.risk_factors : ['Market volatility risk', 'Interest rate fluctuation', 'Liquidity risk for resale']} color="red" />
      </Panel>

      {/* 4. Locality Insights */}
      <Panel>
        <SectionHeader>Locality Insights</SectionHeader>
        <div className="flex flex-wrap gap-2 mb-3">
          {['Metro Access', 'IT Corridor', 'RERA Compliant', 'Growth Zone'].map(tag => (
            <span key={tag} className="px-2 py-0.5 rounded-md text-[11px] border border-white/[0.08] text-zinc-400 bg-white/[0.03]">
              {tag}
            </span>
          ))}
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-500">5-yr Appreciation</span>
          <span className="text-amber-400 font-bold">{r.market_forecast?.predicted_appreciation_5yr ?? 8}%</span>
        </div>
        <div className="flex items-center justify-between text-sm mt-1.5">
          <span className="text-zinc-500">10-yr Appreciation</span>
          <span className="text-amber-400 font-bold">{r.market_forecast?.predicted_appreciation_10yr ?? 10}%</span>
        </div>
        {r.comparable_investments?.length > 0 && (
          <div className="mt-3 space-y-2">
            <div className="text-[10px] text-zinc-600 uppercase tracking-wider font-semibold">Comparable Options</div>
            {r.comparable_investments.slice(0, 3).map((c: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">{c.property_type} — {c.location}</span>
                <span className="text-amber-400 font-semibold">{c.roi_comparison?.toFixed(1)}% ROI</span>
              </div>
            ))}
          </div>
        )}
      </Panel>

      {/* 5. Recommendations */}
      <Panel>
        <SectionHeader>Actionable Recommendations</SectionHeader>
        <ol className="space-y-2.5">
          {(r.opportunity_factors?.length ? r.opportunity_factors : [
            'Negotiate 3–5% below listed price using comparable data',
            'Consider pre-EMI rental to offset holding costs',
            'Explore Section 80C + 24B tax benefits of ₹3.5L/yr',
            'Lock in current interest rates with a fixed-rate plan',
          ]).map((rec: string, i: number) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-zinc-300">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              {rec}
            </li>
          ))}
        </ol>
      </Panel>

      {/* 6. Smart Questions */}
      <Panel>
        <SectionHeader>Smart Questions to Ask Your Builder</SectionHeader>
        <ul className="space-y-2">
          {[
            'What is the OC/CC status and expected possession date?',
            'Are there any pending RERA violations on this project?',
            'What is the maintenance corpus and monthly charges?',
            'Is the FSI/FAR within permissible limits?',
            'What is the resale history for units in this complex?',
          ].map((q, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-zinc-400">
              <HelpCircle size={13} className="text-amber-400/60 flex-shrink-0 mt-0.5" />
              {q}
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  )
}

// ── EMI Sections ───────────────────────────────────────────────────────────────
function EMIPanel({ data }: { data: any }) {
  const r = data
  return (
    <div className="space-y-4">
      <Panel>
        <SectionHeader>EMI Breakdown</SectionHeader>
        <div className="grid grid-cols-2 gap-2.5">
          <MetricCard label="Monthly EMI" value={fmtINR(r.monthly_emi ?? r.emi ?? 0)} />
          <MetricCard label="Total Interest" value={fmtINR(r.total_interest ?? 0)} />
          <MetricCard label="Loan Amount" value={fmtINR(r.loan_amount ?? r.loanAmount ?? 0)} />
          <MetricCard label="Total Payable" value={fmtINR(r.total_payable ?? 0)} />
        </div>
      </Panel>
      <Panel>
        <SectionHeader>Affordability Check</SectionHeader>
        <div className="space-y-2 text-sm text-zinc-300">
          {r.affordability_ratio && (
            <div className="flex justify-between">
              <span className="text-zinc-500">EMI-to-Income Ratio</span>
              <span className={cn('font-bold', r.affordability_ratio < 40 ? 'text-emerald-400' : r.affordability_ratio < 55 ? 'text-amber-400' : 'text-red-400')}>
                {r.affordability_ratio?.toFixed(1)}%
              </span>
            </div>
          )}
          {r.disposable_income && (
            <div className="flex justify-between">
              <span className="text-zinc-500">Monthly Disposable</span>
              <span className="text-amber-400 font-bold">{fmtINR(r.disposable_income)}</span>
            </div>
          )}
        </div>
      </Panel>
      {r.optimization_tips?.length > 0 && (
        <Panel>
          <SectionHeader>EMI Optimization Tips</SectionHeader>
          <BulletList items={r.optimization_tips} />
        </Panel>
      )}
      {r.prepayment_benefit && (
        <Panel>
          <SectionHeader>Prepayment Analysis</SectionHeader>
          <div className="text-sm text-zinc-300 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-zinc-500">Interest saved (₹5L prepay)</span>
              <span className="text-emerald-400 font-bold">{fmtINR(r.prepayment_benefit)}</span>
            </div>
          </div>
        </Panel>
      )}
      {r.bank_comparisons?.length > 0 && (
        <Panel>
          <SectionHeader>Bank Comparisons</SectionHeader>
          <div className="space-y-2">
            {r.bank_comparisons.slice(0, 5).map((b: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">{b.bank}</span>
                <div className="flex gap-3">
                  <span className="text-amber-400 font-semibold">{b.rate}%</span>
                  <span className="text-zinc-500">{fmtINR(b.emi)}/mo</span>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}
      {r.tax_benefits && (
        <Panel>
          <SectionHeader>Tax Benefits (per year)</SectionHeader>
          <div className="grid grid-cols-2 gap-2.5">
            <MetricCard label="Section 80C" value={fmtINR(r.tax_benefits.section_80c ?? 150000)} sub="Principal" />
            <MetricCard label="Section 24B" value={fmtINR(r.tax_benefits.section_24b ?? 200000)} sub="Interest" />
          </div>
        </Panel>
      )}
    </div>
  )
}

// ── Budget Sections ────────────────────────────────────────────────────────────
function BudgetPanel({ data }: { data: any }) {
  const r = data
  return (
    <div className="space-y-4">
      <Panel>
        <SectionHeader>Budget Summary</SectionHeader>
        <div className="grid grid-cols-2 gap-2.5">
          <MetricCard label="Max Property Budget" value={fmtINR(r.max_property_budget ?? r.affordable_property_value ?? 0)} />
          <MetricCard label="Max Loan Eligible" value={fmtINR(r.max_loan_eligible ?? r.maximum_loan_amount ?? 0)} />
          <MetricCard label="Down Payment Needed" value={fmtINR(r.down_payment_needed ?? 0)} />
          <MetricCard label="Monthly EMI" value={fmtINR(r.recommended_emi ?? r.monthly_emi ?? 0)} />
        </div>
      </Panel>
      {r.savings_plan && (
        <Panel>
          <SectionHeader>Savings Plan</SectionHeader>
          <div className="space-y-2 text-sm">
            {Object.entries(r.savings_plan).map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-zinc-500 capitalize">{k.replace(/_/g, ' ')}</span>
                <span className="text-emerald-400 font-bold">{typeof v === 'number' ? fmtINR(v) : String(v)}</span>
              </div>
            ))}
          </div>
        </Panel>
      )}
      {r.property_options?.length > 0 && (
        <Panel>
          <SectionHeader>Property Options in Range</SectionHeader>
          <div className="space-y-2">
            {r.property_options.map((p: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-zinc-300">{p.type} — {p.locality}</span>
                <span className="text-amber-400 font-semibold">{fmtINR(p.price)}</span>
              </div>
            ))}
          </div>
        </Panel>
      )}
      {r.recommendations?.length > 0 && (
        <Panel>
          <SectionHeader>Recommendations</SectionHeader>
          <BulletList items={r.recommendations} />
        </Panel>
      )}
    </div>
  )
}

// ── Loan Sections ──────────────────────────────────────────────────────────────
function LoanPanel({ data }: { data: any }) {
  const r = data
  return (
    <div className="space-y-4">
      <Panel>
        <SectionHeader>Loan Eligibility</SectionHeader>
        <div className="grid grid-cols-2 gap-2.5">
          <MetricCard label="Max Eligibility" value={fmtINR(r.max_loan_eligibility ?? r.eligible_loan_amount ?? 0)} />
          <MetricCard label="Approval Likelihood" value={`${r.approval_likelihood ?? r.approval_probability ?? 0}%`} />
          <MetricCard label="Best Interest Rate" value={`${r.best_rate ?? r.recommended_interest_rate ?? 8.5}%`} />
          <MetricCard label="Recommended EMI" value={fmtINR(r.recommended_emi ?? 0)} />
        </div>
      </Panel>
      {r.calculation_method && (
        <Panel>
          <SectionHeader>How This is Calculated</SectionHeader>
          <p className="text-sm text-zinc-400 leading-relaxed">{r.calculation_method}</p>
        </Panel>
      )}
      {r.improvement_tips?.length > 0 && (
        <Panel>
          <SectionHeader>How to Improve Eligibility</SectionHeader>
          <BulletList items={r.improvement_tips} />
        </Panel>
      )}
      {r.recommended_banks?.length > 0 && (
        <Panel>
          <SectionHeader>Recommended Banks</SectionHeader>
          <div className="space-y-2">
            {r.recommended_banks.slice(0, 5).map((b: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-zinc-300">{b.bank ?? b.name}</span>
                <div className="flex gap-3">
                  <span className="text-amber-400 font-semibold">{b.rate ?? b.interest_rate}%</span>
                  <span className={cn('text-xs px-1.5 py-0.5 rounded',
                    (b.match_score ?? 80) >= 80 ? 'text-emerald-400 bg-emerald-500/10' : 'text-zinc-500 bg-white/[0.03]'
                  )}>
                    {b.match_score ?? 80}% match
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  )
}

// ── Locality Sections ──────────────────────────────────────────────────────────
function LocalityPanel({ data }: { data: any }) {
  const r = data
  const score = r.livability_score ?? r.overall_score ?? r.infrastructure_score ?? 75
  return (
    <div className="space-y-4">
      <Panel>
        <SectionHeader>Locality Overview</SectionHeader>
        <div className="flex items-center gap-4">
          {/* Score ring */}
          <div className="flex-shrink-0">
            <svg width="72" height="72" viewBox="0 0 72 72">
              <circle cx="36" cy="36" r="30" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
              <motion.circle
                cx="36" cy="36" r="30"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 30}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 30 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 30 * (1 - score / 100) }}
                transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
                transform="rotate(-90 36 36)"
              />
              <text x="36" y="41" textAnchor="middle" fill="#f59e0b" fontSize="14" fontWeight="bold">{score}</text>
            </svg>
          </div>
          <div>
            <div className="text-base font-bold text-zinc-100 mb-1">{r.locality_name ?? 'Selected Area'}</div>
            <div className="text-xs text-zinc-500">Livability Score</div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {(r.tags ?? ['Growth Zone', 'Good Connectivity']).map((tag: string) => (
                <span key={tag} className="px-2 py-0.5 rounded-md text-[11px] border border-white/[0.08] text-zinc-400 bg-white/[0.03]">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Panel>
      {r.infrastructure_breakdown && (
        <Panel>
          <SectionHeader>Infrastructure Score</SectionHeader>
          <div className="space-y-2">
            {Object.entries(r.infrastructure_breakdown).map(([key, val]) => (
              <div key={key} className="flex items-center gap-3">
                <span className="text-xs text-zinc-500 w-28 capitalize">{key.replace(/_/g, ' ')}</span>
                <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400/60 rounded-full" style={{ width: `${Number(val)}%` }} />
                </div>
                <span className="text-xs text-amber-400 w-8 text-right font-semibold">{String(val)}</span>
              </div>
            ))}
          </div>
        </Panel>
      )}
      {r.investment_potential && (
        <Panel>
          <SectionHeader>Investment Potential</SectionHeader>
          <div className="grid grid-cols-2 gap-2.5">
            <MetricCard label="Avg Price/sqft" value={`₹${r.investment_potential.avg_price_sqft ?? '--'}`} />
            <MetricCard label="Expected Appreciation" value={`${r.investment_potential.expected_appreciation ?? '--'}%`} />
          </div>
        </Panel>
      )}
      {(r.green_flags?.length > 0 || r.red_flags?.length > 0) && (
        <Panel>
          <div className="grid grid-cols-2 gap-4">
            {r.green_flags?.length > 0 && (
              <div>
                <SectionHeader>Green Flags</SectionHeader>
                <BulletList items={r.green_flags} color="emerald" />
              </div>
            )}
            {r.red_flags?.length > 0 && (
              <div>
                <SectionHeader>Red Flags</SectionHeader>
                <BulletList items={r.red_flags} color="red" />
              </div>
            )}
          </div>
        </Panel>
      )}
      {r.comparables?.length > 0 && (
        <Panel>
          <SectionHeader>Comparable Localities</SectionHeader>
          <div className="space-y-2">
            {r.comparables.slice(0, 4).map((c: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-zinc-300">{c.name}</span>
                <span className="text-amber-400 font-semibold">{c.score ?? c.livability_score}/100</span>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  )
}

// ── Valuation Sections ─────────────────────────────────────────────────────────
function ValuationPanel({ data }: { data: any }) {
  const r = data
  return (
    <div className="space-y-4">
      <Panel>
        <SectionHeader>Market Value Estimate</SectionHeader>
        <div className="grid grid-cols-2 gap-2.5">
          <MetricCard label="Estimated Value" value={fmtINR(r.estimated_value ?? r.market_value ?? 0)} />
          <MetricCard label="Price per Sqft" value={`₹${r.price_per_sqft?.toLocaleString('en-IN') ?? '--'}`} />
          <MetricCard label="Low Estimate" value={fmtINR(r.value_range?.low ?? r.low_estimate ?? 0)} />
          <MetricCard label="High Estimate" value={fmtINR(r.value_range?.high ?? r.high_estimate ?? 0)} />
        </div>
      </Panel>
      {r.value_breakdown && (
        <Panel>
          <SectionHeader>Value Breakdown</SectionHeader>
          <div className="space-y-2 text-sm">
            {Object.entries(r.value_breakdown).map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-zinc-500 capitalize">{k.replace(/_/g, ' ')}</span>
                <span className="text-zinc-300 font-medium">{typeof v === 'number' ? fmtINR(v) : String(v)}</span>
              </div>
            ))}
          </div>
        </Panel>
      )}
      {r.negotiation_strategy && (
        <Panel>
          <SectionHeader>Negotiation Strategy</SectionHeader>
          <div className="space-y-2">
            {r.negotiation_strategy.recommended_offer && (
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Recommended Offer</span>
                <span className="text-emerald-400 font-bold">{fmtINR(r.negotiation_strategy.recommended_offer)}</span>
              </div>
            )}
            {r.negotiation_strategy.tips?.length > 0 && (
              <div className="mt-2">
                <BulletList items={r.negotiation_strategy.tips} />
              </div>
            )}
          </div>
        </Panel>
      )}
      {r.rera_status !== undefined && (
        <Panel>
          <SectionHeader>RERA Status</SectionHeader>
          <div className={cn('flex items-center gap-2 text-sm font-semibold',
            r.rera_status ? 'text-emerald-400' : 'text-red-400'
          )}>
            {r.rera_status
              ? <><CheckCircle2 size={14} /> RERA Registered</>
              : <><XCircle size={14} /> Not RERA Registered</>
            }
          </div>
          {r.rera_note && <p className="text-xs text-zinc-500 mt-2">{r.rera_note}</p>}
        </Panel>
      )}
    </div>
  )
}

// ── Main Export ────────────────────────────────────────────────────────────────
export type ToolType = 'roi' | 'emi' | 'budget' | 'loan' | 'locality' | 'valuation'

interface AIAnalysisPanelProps {
  tool: ToolType
  data: any
}

export function AIAnalysisPanel({ tool, data }: AIAnalysisPanelProps) {
  const [copied, setCopied] = useState(false)

  function handleShare() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const toolLabel: Record<ToolType, string> = {
    roi: 'ROI Analysis',
    emi: 'EMI Analysis',
    budget: 'Budget Analysis',
    loan: 'Loan Eligibility',
    locality: 'Locality Analysis',
    valuation: 'Property Valuation',
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${tool}-panel`}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-amber-400 opacity-50" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
            </span>
            <span className="text-xs font-bold text-zinc-300 uppercase tracking-widest">
              AI {toolLabel[tool]}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 border border-white/[0.07] hover:border-white/[0.12] bg-white/[0.03] transition-all"
            >
              <Share2 size={11} />
              {copied ? 'Copied!' : 'Share'}
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 border border-white/[0.07] hover:border-white/[0.12] bg-white/[0.03] transition-all">
              <Bookmark size={11} />
              Save
            </button>
          </div>
        </div>

        {/* Tool-specific content */}
        {tool === 'roi' && <ROIPanel data={data} />}
        {tool === 'emi' && <EMIPanel data={data} />}
        {tool === 'budget' && <BudgetPanel data={data} />}
        {tool === 'loan' && <LoanPanel data={data} />}
        {tool === 'locality' && <LocalityPanel data={data} />}
        {tool === 'valuation' && <ValuationPanel data={data} />}
      </motion.div>
    </AnimatePresence>
  )
}
