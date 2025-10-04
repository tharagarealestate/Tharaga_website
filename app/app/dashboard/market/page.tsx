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
