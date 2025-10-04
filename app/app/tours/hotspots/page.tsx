"use client"

import * as React from 'react'

function Hotspot({ x, y, label }: { x: number; y: number; label: string }){
  return (
    <button className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold text-plum text-xs px-2 py-1" style={{ left: `${x}%`, top: `${y}%` }}>
      {label}
    </button>
  )
}

export default function HotspotsPage(){
  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <h1 className="text-2xl font-bold text-plum mb-2">360 hotspots</h1>
      <div className="rounded-xl border border-plum/10 bg-black relative overflow-hidden" style={{ aspectRatio: '16/9' }}>
        <img src="https://images.unsplash.com/photo-1505691723518-36a9f0f7da3a?q=80&w=2000&auto=format&fit=crop" alt="360" className="w-full h-full object-cover opacity-90" />
        <Hotspot x={25} y={40} label="Kitchen" />
        <Hotspot x={70} y={55} label="Balcony" />
        <Hotspot x={50} y={30} label="Wardrobe" />
      </div>
      <p className="text-xs text-plum/60 mt-2">Prototype overlay hotspots. Replace with 360 viewer integration for production.</p>
    </main>
  )
}
