"use client"

import * as React from 'react'

type Fees = {
  stampDutyPct: number
  registrationPct: number
  gstPct: number
  otherFeesINR: number
}

function formatINR(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
}

export default function CostCalculatorPage() {
  const [priceINR, setPriceINR] = React.useState<number>(10000000)
  const [fees, setFees] = React.useState<Fees>({ stampDutyPct: 5.5, registrationPct: 1.0, gstPct: 0, otherFeesINR: 50000 })
  const [underConstruction, setUnderConstruction] = React.useState(false)

  const stamp = Math.round(priceINR * (fees.stampDutyPct / 100))
  const reg = Math.round(priceINR * (fees.registrationPct / 100))
  const gst = underConstruction ? Math.round(priceINR * (fees.gstPct / 100)) : 0
  const total = priceINR + stamp + reg + gst + fees.otherFeesINR

  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="text-2xl font-bold text-plum mb-4">Cost calculator</h1>
      <div className="rounded-xl border border-plum/10 bg-brandWhite p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Agreement value (INR)</label>
            <input type="number" value={priceINR} onChange={(e)=>setPriceINR(Number(e.target.value||0))} className="w-full rounded-lg border px-3 py-2"/>
          </div>
          <div className="flex items-end gap-3">
            <input id="uc" type="checkbox" checked={underConstruction} onChange={(e)=>setUnderConstruction(e.target.checked)} />
            <label htmlFor="uc" className="text-sm">Under construction (GST applies)</label>
          </div>
          <div>
            <label className="block text-sm mb-1">Stamp duty %</label>
            <input type="number" step="0.1" value={fees.stampDutyPct} onChange={(e)=>setFees(f=>({...f, stampDutyPct: Number(e.target.value||0)}))} className="w-full rounded-lg border px-3 py-2"/>
          </div>
          <div>
            <label className="block text-sm mb-1">Registration %</label>
            <input type="number" step="0.1" value={fees.registrationPct} onChange={(e)=>setFees(f=>({...f, registrationPct: Number(e.target.value||0)}))} className="w-full rounded-lg border px-3 py-2"/>
          </div>
          <div>
            <label className="block text-sm mb-1">GST % (only UC)</label>
            <input type="number" step="0.1" value={fees.gstPct} onChange={(e)=>setFees(f=>({...f, gstPct: Number(e.target.value||0)}))} className="w-full rounded-lg border px-3 py-2"/>
          </div>
          <div>
            <label className="block text-sm mb-1">Other fees (INR)</label>
            <input type="number" value={fees.otherFeesINR} onChange={(e)=>setFees(f=>({...f, otherFeesINR: Number(e.target.value||0)}))} className="w-full rounded-lg border px-3 py-2"/>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Metric label="Stamp duty" value={formatINR(stamp)} />
          <Metric label="Registration" value={formatINR(reg)} />
          <Metric label="GST" value={formatINR(gst)} />
          <Metric label="Other fees" value={formatINR(fees.otherFeesINR)} />
        </div>
        <div className="rounded-lg bg-plum/5 border border-plum/10 p-4 flex items-center justify-between">
          <div>
            <div className="text-sm text-plum/70">All-in cost</div>
            <div className="text-xl font-bold">{formatINR(total)}</div>
          </div>
          <a className="rounded-lg border px-3 py-2" href="/tools/currency-risk">Assess currency risk</a>
        </div>
      </div>
    </main>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-plum/10 p-3">
      <div className="text-xs text-plum/60">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  )
}
