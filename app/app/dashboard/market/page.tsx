"use client"

import * as React from 'react'

function formatINR(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
}

const demo = [
  { city: 'Bengaluru', avgPsf: 9800, yoy: 6.1, inventoryMonths: 6.5, rentYield: 3.8 },
  { city: 'Mumbai', avgPsf: 28700, yoy: 5.0, inventoryMonths: 8.2, rentYield: 3.0 },
  { city: 'Chennai', avgPsf: 9000, yoy: 4.6, inventoryMonths: 7.1, rentYield: 3.1 },
]

export default function MarketDashboard(){
  const [rows] = React.useState(demo)
  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <h1 className="text-2xl font-bold text-plum mb-4">Market intelligence</h1>
      <div className="rounded-xl border border-plum/10 bg-brandWhite p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {rows.map((r)=> (
            <Sparky key={r.city} label={`${r.city} YoY`} values={Array.from({length:12},(_,i)=> r.yoy + Math.sin(i)*0.8)} suffix="%" />
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-plum/70">
                <th className="px-3 py-2">City</th>
                <th className="px-3 py-2">Avg price/sqft</th>
                <th className="px-3 py-2">YoY price</th>
                <th className="px-3 py-2">Inventory (months)</th>
                <th className="px-3 py-2">Rent yield</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r,i)=> (
                <tr key={i} className="border-t border-plum/10">
                  <td className="px-3 py-2 font-medium">{r.city}</td>
                  <td className="px-3 py-2">₹{r.avgPsf.toLocaleString('en-IN')}/sqft</td>
                  <td className="px-3 py-2">{r.yoy.toFixed(1)}%</td>
                  <td className="px-3 py-2">{r.inventoryMonths.toFixed(1)}</td>
                  <td className="px-3 py-2">{r.rentYield.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 text-xs text-plum/60">Sample data for UX; wire to real API later.</div>
      </div>
    </main>
  )
}

function Sparky({ label, values, suffix }: { label: string; values: number[]; suffix?: string }){
  const min = Math.min(...values)
  const max = Math.max(...values)
  const pts = values.map((v,i)=>{
    const x = (i/(values.length-1))*100
    const y = 100 - ((v - min) / Math.max(1e-6, max - min)) * 100
    return `${x},${y}`
  }).join(' ')
  const last = values[values.length-1]
  return (
    <div className="rounded-lg border border-plum/10 p-3">
      <div className="text-xs text-plum/60">{label}</div>
      <div className="flex items-center gap-3">
        <svg viewBox="0 0 100 30" className="w-40 h-10">
          <polyline fill="none" stroke="#6e0d25" strokeWidth="2" points={pts.replace(/,(\d+)/g, (m,p)=>','+ (Number(p)/3).toFixed(2))} />
        </svg>
        <div className="text-sm font-semibold">{last.toFixed(1)}{suffix||''}</div>
      </div>
    </div>
  )
}
