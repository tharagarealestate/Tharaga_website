"use client"

import * as React from 'react'
import Breadcrumb from '@/components/Breadcrumb'

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
  const [stateCode, setStateCode] = React.useState('KA')
  const [buyerType, setBuyerType] = React.useState<'male'|'female'|'joint'>('joint')
  const [underConstruction, setUnderConstruction] = React.useState(false)

  React.useEffect(()=>{
    const slabs: Record<string, { stamp: number; reg: number; gst: number }> = {
      KA: { stamp: 5.6, reg: 1.0, gst: 0 },
      TN: { stamp: 7.0, reg: 4.0, gst: 0 },
      MH: { stamp: 6.0, reg: 1.0, gst: 0 },
      DL: { stamp: 6.0, reg: 1.0, gst: 0 },
    }
    const s = slabs[stateCode] || slabs['KA']
    let stamp = s.stamp
    if (buyerType === 'female') stamp = Math.max(0, stamp - 1)
    setFees(f => ({ ...f, stampDutyPct: stamp, registrationPct: s.reg, gstPct: underConstruction ? (priceINR <= 4500000 ? 1 : 5) : 0 }))
  }, [stateCode, buyerType, underConstruction, priceINR])

  const stamp = Math.round(priceINR * (fees.stampDutyPct / 100))
  const reg = Math.round(priceINR * (fees.registrationPct / 100))
  const gst = underConstruction ? Math.round(priceINR * (fees.gstPct / 100)) : 0
  const total = priceINR + stamp + reg + gst + fees.otherFeesINR

  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      <Breadcrumb items={[
        { label: 'Home', href: '/' },
        { label: 'Tools', href: '/tools' },
        { label: 'Cost Calculator' }
      ]} />
      <h1 className="text-2xl font-bold text-fg mb-4">Cost calculator</h1>
      <div className="rounded-xl border border-border bg-canvas p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">State</label>
            <select value={stateCode} onChange={(e)=>setStateCode(e.target.value)} className="w-full rounded-lg border border-border bg-canvas px-3 py-2">
              {['KA','TN','MH','DL'].map(s=>(<option key={s} value={s}>{s}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Buyer</label>
            <select value={buyerType} onChange={(e)=>setBuyerType(e.target.value as any)} className="w-full rounded-lg border border-border bg-canvas px-3 py-2">
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="joint">Joint</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Agreement value (INR)</label>
            <input type="number" value={priceINR} onChange={(e)=>setPriceINR(Number(e.target.value||0))} className="w-full rounded-lg border border-border bg-canvas px-3 py-2"/>
          </div>
          <div className="flex items-end gap-3">
            <input id="uc" type="checkbox" checked={underConstruction} onChange={(e)=>setUnderConstruction(e.target.checked)} />
            <label htmlFor="uc" className="text-sm">Under construction (GST applies)</label>
          </div>
          <div>
            <label className="block text-sm mb-1">Stamp duty %</label>
            <input type="number" step="0.1" value={fees.stampDutyPct} onChange={(e)=>setFees(f=>({...f, stampDutyPct: Number(e.target.value||0)}))} className="w-full rounded-lg border border-border bg-canvas px-3 py-2"/>
          </div>
          <div>
            <label className="block text-sm mb-1">Registration %</label>
            <input type="number" step="0.1" value={fees.registrationPct} onChange={(e)=>setFees(f=>({...f, registrationPct: Number(e.target.value||0)}))} className="w-full rounded-lg border border-border bg-canvas px-3 py-2"/>
          </div>
          <div>
            <label className="block text-sm mb-1">GST % (only UC)</label>
            <input type="number" step="0.1" value={fees.gstPct} onChange={(e)=>setFees(f=>({...f, gstPct: Number(e.target.value||0)}))} className="w-full rounded-lg border border-border bg-canvas px-3 py-2"/>
          </div>
          <div>
            <label className="block text-sm mb-1">Other fees (INR)</label>
            <input type="number" value={fees.otherFeesINR} onChange={(e)=>setFees(f=>({...f, otherFeesINR: Number(e.target.value||0)}))} className="w-full rounded-lg border border-border bg-canvas px-3 py-2"/>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Metric label="Stamp duty" value={formatINR(stamp)} />
          <Metric label="Registration" value={formatINR(reg)} />
          <Metric label="GST" value={formatINR(gst)} />
          <Metric label="Other fees" value={formatINR(fees.otherFeesINR)} />
        </div>
        <div className="rounded-lg bg-accent/5 border border-border p-4 flex items-center justify-between">
          <div>
            <div className="text-sm text-fgMuted">All-in cost</div>
            <div className="text-xl font-bold">{formatINR(total)}</div>
          </div>
          <div className="flex gap-2">
            <a className="rounded-lg border border-border px-3 py-2" href="/tools/currency-risk">Assess currency risk</a>
            <button className="rounded-lg border border-border px-3 py-2" onClick={()=>{
              const blob = new Blob([`Tharaga Cost Breakdown\nState: ${stateCode}\nBuyer: ${buyerType}\nPrice: ${priceINR}\nStamp: ${stamp}\nReg: ${reg}\nGST: ${gst}\nOther: ${fees.otherFeesINR}\nTotal: ${total}`], { type: 'text/plain' })
              const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download=`tharaga-cost-${Date.now()}.txt`; a.click(); URL.revokeObjectURL(url)
            }}>Export</button>
          </div>
        </div>
      </div>
    </main>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="text-xs text-fgMuted">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  )
}
