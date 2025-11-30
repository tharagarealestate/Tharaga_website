"use client"
import React from 'react'

export function EMICalculator({ defaultPrincipal }: { defaultPrincipal: number }){
  const [amount, setAmount] = React.useState(Math.max(1_00_00_000, defaultPrincipal || 1_00_00_000)) // ₹1 Cr min
  const [rate, setRate] = React.useState(10)
  const [tenure, setTenure] = React.useState(20)

  const monthlyRate = rate / 12 / 100
  const n = tenure * 12
  const emi = Math.round((amount * monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1))
  const totalAmount = emi * n
  const totalInterest = totalAmount - amount

  function formatINR(n?: number | null){
    if (!n) return '—'
    return `₹${Math.round(n).toLocaleString('en-IN')}`
  }

  function track(){ try { (window as any).thgTrack && (window as any).thgTrack('emi_adjust', { amount, rate, tenure }) } catch {} }

  return (
    <div className="space-y-3">
      <div className="text-sm text-gray-600">EMI Calculator</div>
      <div>
        <div className="flex items-center justify-between text-sm"><span>Loan Amount</span><span className="font-medium">{formatINR(amount)}</span></div>
        <input type="range" min={1_00_00_000} max={Math.max(1_00_00_000, defaultPrincipal || 2_40_00_000)} step={50_000} value={amount} onChange={e=>{ setAmount(Number(e.target.value)); track() }} className="w-full" />
      </div>
      <div>
        <div className="flex items-center justify-between text-sm"><span>Interest Rate</span><span className="font-medium">{rate}%</span></div>
        <input type="range" min={8} max={12} step={0.1} value={rate} onChange={e=>{ setRate(Number(e.target.value)); track() }} className="w-full" />
      </div>
      <div>
        <div className="flex items-center justify-between text-sm"><span>Tenure</span><span className="font-medium">{tenure} years</span></div>
        <input type="range" min={5} max={30} step={1} value={tenure} onChange={e=>{ setTenure(Number(e.target.value)); track() }} className="w-full" />
      </div>
      <hr className="my-2" />
      <div className="space-y-1">
        <Row label="Monthly EMI" value={formatINR(emi)} bold />
        <Row label="Total Interest" value={formatINR(totalInterest)} />
        <Row label="Total Amount" value={formatINR(totalAmount)} />
      </div>
    </div>
  )
}

function Row({ label, value, bold }: { label: string; value: React.ReactNode; bold?: boolean }){
  return (
    <div className="flex items-center justify-between py-1">
      <div className="text-gray-600">{label}</div>
      <div className={bold ? 'font-semibold text-gray-900' : 'text-gray-900'}>{value}</div>
    </div>
  )
}
