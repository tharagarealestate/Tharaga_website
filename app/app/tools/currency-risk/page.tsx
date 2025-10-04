"use client"

import * as React from 'react'

const FX: Record<string, number> = { USD: 0.012, AED: 0.044, GBP: 0.0095, EUR: 0.011 }

function fmt(n: number, code: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: code, maximumFractionDigits: 0 }).format(n)
}

export default function CurrencyRiskPage() {
  const [amountINR, setAmountINR] = React.useState(10000000)
  const [fx, setFx] = React.useState('USD')
  const [driftPct, setDriftPct] = React.useState(4)
  const [horizonY, setHorizonY] = React.useState(3)

  const now = (amountINR * (FX[fx] || 0.012))
  const best = now * Math.pow(1 + driftPct / 100, horizonY)
  const worst = now * Math.pow(1 - driftPct / 100, horizonY)

  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="text-2xl font-bold text-plum mb-4">Currency risk (NRI)</h1>
      <div className="rounded-xl border border-plum/10 bg-brandWhite p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm mb-1">Investment (INR)</label>
            <input type="number" value={amountINR} onChange={(e)=>setAmountINR(Number(e.target.value||0))} className="w-full rounded-lg border px-3 py-2"/>
          </div>
          <div>
            <label className="block text-sm mb-1">Currency</label>
            <select value={fx} onChange={(e)=>setFx(e.target.value)} className="w-full rounded-lg border px-3 py-2">
              {Object.keys(FX).map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Annual drift ±%</label>
            <input type="number" step="0.5" value={driftPct} onChange={(e)=>setDriftPct(Number(e.target.value||0))} className="w-full rounded-lg border px-3 py-2"/>
          </div>
          <div>
            <label className="block text-sm mb-1">Horizon (years)</label>
            <input type="number" value={horizonY} onChange={(e)=>setHorizonY(Number(e.target.value||0))} className="w-full rounded-lg border px-3 py-2"/>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card label="Current value" value={fmt(now, fx)} />
          <Card label="Best case" value={fmt(best, fx)} />
          <Card label="Worst case" value={fmt(worst, fx)} />
        </div>
        <p className="text-xs text-plum/60">This is a simple scenario analysis. For exact planning, consult a financial advisor.</p>
      </div>
    </main>
  )
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-plum/10 p-3">
      <div className="text-xs text-plum/60">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  )
}
