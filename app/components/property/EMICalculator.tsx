"use client"
import React from 'react'

export function EMICalculator({ defaultPrincipal }: { defaultPrincipal: number }){
  const [amount, setAmount] = React.useState(Math.max(1_00_00_000, defaultPrincipal || 1_00_00_000)) // ₹1 Cr min
  const [rate, setRate] = React.useState(10.7)
  const [tenure, setTenure] = React.useState(26)

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
    <div className="space-y-4">
      <div className="text-sm font-bold text-white uppercase tracking-wide">EMI Calculator</div>
      <div>
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-slate-300 font-medium">Loan Amount</span>
          <span className="font-bold text-amber-300">{formatINR(amount)}</span>
        </div>
        <input 
          type="range" 
          min={1_00_00_000} 
          max={Math.max(2_40_00_000, (defaultPrincipal || 2_40_00_000) * 3)} 
          step={50_000} 
          value={amount} 
          onChange={e=>{ setAmount(Number(e.target.value)); track() }} 
          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider-amber"
        />
      </div>
      <div>
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-slate-300 font-medium">Interest Rate</span>
          <span className="font-bold text-amber-300">{rate.toFixed(1)}%</span>
        </div>
        <input 
          type="range" 
          min={8} 
          max={12} 
          step={0.1} 
          value={rate} 
          onChange={e=>{ setRate(Number(e.target.value)); track() }} 
          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider-amber"
        />
      </div>
      <div>
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-slate-300 font-medium">Tenure</span>
          <span className="font-bold text-amber-300">{tenure} years</span>
        </div>
        <input 
          type="range" 
          min={5} 
          max={30} 
          step={1} 
          value={tenure} 
          onChange={e=>{ setTenure(Number(e.target.value)); track() }} 
          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider-amber"
        />
      </div>
      <hr className="my-3 border-slate-600" />
      <div className="space-y-2">
        <Row label="Monthly EMI" value={formatINR(emi)} bold />
        <Row label="Total Interest" value={formatINR(totalInterest)} />
        <Row label="Total Amount" value={formatINR(totalAmount)} />
      </div>
      <style jsx>{`
        .slider-amber {
          -webkit-appearance: none;
          appearance: none;
          height: 8px;
          background: rgba(51, 65, 85, 0.8);
          border-radius: 4px;
          outline: none;
          cursor: pointer;
        }
        .slider-amber::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: rgb(252, 211, 77);
          cursor: pointer;
          box-shadow: 
            0 0 10px rgba(252, 211, 77, 0.6), 
            0 0 20px rgba(252, 211, 77, 0.4),
            0 0 30px rgba(252, 211, 77, 0.2);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: 2px solid rgb(251, 191, 36);
          position: relative;
        }
        .slider-amber::-webkit-slider-thumb:hover {
          transform: scale(1.25);
          box-shadow: 
            0 0 15px rgba(252, 211, 77, 0.8), 
            0 0 30px rgba(252, 211, 77, 0.6),
            0 0 45px rgba(252, 211, 77, 0.4);
        }
        .slider-amber::-webkit-slider-thumb:active {
          transform: scale(1.15);
        }
        .slider-amber::-webkit-slider-runnable-track {
          height: 8px;
          background: rgba(51, 65, 85, 0.8);
          border-radius: 4px;
        }
        .slider-amber::-moz-range-thumb {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: rgb(252, 211, 77);
          cursor: pointer;
          box-shadow: 
            0 0 10px rgba(252, 211, 77, 0.6), 
            0 0 20px rgba(252, 211, 77, 0.4),
            0 0 30px rgba(252, 211, 77, 0.2);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: 2px solid rgb(251, 191, 36);
          -moz-appearance: none;
        }
        .slider-amber::-moz-range-thumb:hover {
          transform: scale(1.25);
          box-shadow: 
            0 0 15px rgba(252, 211, 77, 0.8), 
            0 0 30px rgba(252, 211, 77, 0.6),
            0 0 45px rgba(252, 211, 77, 0.4);
        }
        .slider-amber::-moz-range-track {
          height: 8px;
          background: rgba(51, 65, 85, 0.8);
          border-radius: 4px;
        }
        .slider-amber::-moz-range-progress {
          height: 8px;
          background: linear-gradient(90deg, rgb(252, 211, 77), rgb(251, 191, 36));
          border-radius: 4px;
          box-shadow: 0 0 8px rgba(252, 211, 77, 0.5);
        }
      `}</style>
    </div>
  )
}

function Row({ label, value, bold }: { label: string; value: React.ReactNode; bold?: boolean }){
  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="text-slate-400 text-sm">{label}</div>
      <div className={bold ? 'font-bold text-white text-lg' : 'font-semibold text-white'}>{value}</div>
    </div>
  )
}
