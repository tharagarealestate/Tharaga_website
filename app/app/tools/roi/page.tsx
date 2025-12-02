"use client"

import * as React from 'react'
import Breadcrumb from '@/components/Breadcrumb'

function fmtINR(n: number){
  return new Intl.NumberFormat('en-IN', { style:'currency', currency:'INR', maximumFractionDigits:0 }).format(n)
}

export default function RoiPage(){
  const [price, setPrice] = React.useState(10000000)
  const [downPct, setDownPct] = React.useState(20)
  const [rate, setRate] = React.useState(9)
  const [rent, setRent] = React.useState(30000)
  const [growth, setGrowth] = React.useState(5)
  const [years, setYears] = React.useState(5)

  const down = Math.round(price * downPct / 100)
  const loan = price - down
  const r = rate / 1200
  const n = years * 12
  const emi = Math.round(loan * r * Math.pow(1+r, n) / (Math.pow(1+r, n) - 1))

  const rentAnnual = rent * 12
  const taxShield = Math.round(Math.min(200000, Math.max(0, emi * 12 * 0.2)))
  const netCash = rentAnnual + taxShield - emi * 12
  const estValue = Math.round(price * Math.pow(1 + growth/100, years))
  const totalOutflow = down + emi * 12 * years
  const totalInflow = estValue + rentAnnual * years + taxShield * years
  const roi = Math.round(((totalInflow - totalOutflow) / totalOutflow) * 100)

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 relative overflow-hidden">
      {/* Animated Background Elements - EXACT from pricing page */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-96 h-96 bg-gold-500 rounded-full blur-3xl animate-pulse-slow" />
        <div
          className="absolute bottom-20 right-10 w-[600px] h-[600px] bg-emerald-500 rounded-full blur-3xl animate-pulse-slow"
          style={{ animationDelay: '1s' }}
        />
      </div>

      <div className="relative z-10">
        <main className="mx-auto max-w-3xl px-6 py-8">
      <Breadcrumb items={[
        { label: 'Home', href: '/' },
        { label: 'ROI Calculator' }
      ]} />
      <h1 className="text-2xl font-bold text-plum mb-4">Investment ROI calculator</h1>
      <div className="rounded-xl border border-plum/10 bg-brandWhite p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="text-sm">Price <input type="number" className="w-full rounded-lg border px-3 py-2" value={price} onChange={(e)=>setPrice(Number(e.target.value||0))} /></label>
          <label className="text-sm">Down payment % <input type="number" className="w-full rounded-lg border px-3 py-2" value={downPct} onChange={(e)=>setDownPct(Number(e.target.value||0))} /></label>
          <label className="text-sm">Loan rate % <input type="number" className="w-full rounded-lg border px-3 py-2" value={rate} onChange={(e)=>setRate(Number(e.target.value||0))} /></label>
          <label className="text-sm">Monthly rent <input type="number" className="w-full rounded-lg border px-3 py-2" value={rent} onChange={(e)=>setRent(Number(e.target.value||0))} /></label>
          <label className="text-sm">Annual growth % <input type="number" className="w-full rounded-lg border px-3 py-2" value={growth} onChange={(e)=>setGrowth(Number(e.target.value||0))} /></label>
          <label className="text-sm">Years <input type="number" className="w-full rounded-lg border px-3 py-2" value={years} onChange={(e)=>setYears(Number(e.target.value||0))} /></label>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Metric label="Down payment" value={fmtINR(down)} />
          <Metric label="Monthly EMI" value={fmtINR(emi)} />
          <Metric label="Annual rent" value={fmtINR(rentAnnual)} />
          <Metric label="Tax shield (est)" value={fmtINR(taxShield)} />
          <Metric label="Est. property value" value={fmtINR(estValue)} />
          <Metric label="Net cashflow/yr" value={fmtINR(netCash)} />
        </div>
        <div className="rounded-lg border border-plum/10 p-4 flex items-center justify-between">
          <div>
            <div className="text-sm text-plum/70">Total ROI over {years}y</div>
            <div className="text-xl font-bold">{roi}%</div>
          </div>
          <a className="rounded-lg border px-3 py-2" href="/tools/currency-risk">Assess FX impact</a>
        </div>
      </div>
        </main>
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }){
  return (
    <div className="rounded-lg border border-plum/10 p-3">
      <div className="text-xs text-plum/60">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  )
}
