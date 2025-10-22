"use client"

import * as React from 'react'

export default function RadialFilters(){
  const [city, setCity] = React.useState('Bengaluru')
  const [budget, setBudget] = React.useState('₹75L–₹1Cr')
  const [ptype, setPtype] = React.useState('Apartment')

  function apply(){
    location.href = `/property-listing/?city=${encodeURIComponent(city)}&budget=${encodeURIComponent(budget)}&ptype=${encodeURIComponent(ptype)}`
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="text-2xl font-bold text-plum mb-4">Radial filters (prototype)</h1>
      <div className="rounded-xl border border-plum/10 bg-brandWhite p-6 flex items-center justify-center">
        <div className="relative" style={{ width: 320, height: 320 }}>
          <div className="absolute inset-0 rounded-full glass flex items-center justify-center">
            <button id="filter-button" className="rounded-full bg-gold text-plum px-4 py-2" onClick={apply}>Apply</button>
          </div>
          <Knob label="City" value={city} onChange={setCity} x={160} y={0} opts={["Bengaluru","Mumbai","Chennai","Pune"]} />
          <Knob label="Budget" value={budget} onChange={setBudget} x={0} y={80} opts={["₹50L–₹75L","₹75L–₹1Cr","₹1Cr–₹1.5Cr","₹1.5Cr–₹2Cr"]} />
          <Knob label="Type" value={ptype} onChange={setPtype} x={320} y={80} opts={["Apartment","Villa","Plot"]} />
        </div>
      </div>
    </main>
  )
}

function Knob({ label, value, onChange, x, y, opts }: { label: string; value: string; onChange: (v:string)=>void; x:number; y:number; opts:string[] }){
  const [open, setOpen] = React.useState(false)
  return (
    <div className="absolute -translate-x-1/2" style={{ left: x, top: y }}>
      <button className="rounded-full border px-3 py-2 bg-white/70 backdrop-blur" onClick={()=>setOpen(o=>!o)}>{label}: {value}</button>
      {open && (
        <div className="mt-2 rounded-lg border bg-white shadow-subtle">
          {opts.map(o => (
            <button key={o} className="block text-left w-full px-3 py-2 hover:bg-plum/5" onClick={()=>{onChange(o); setOpen(false)}}>{o}</button>
          ))}
        </div>
      )}
    </div>
  )
}
