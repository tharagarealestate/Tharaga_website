"use client"

import * as React from 'react'
import Breadcrumb from '@/components/Breadcrumb'

export default function EnvironmentIntelPage(){
  const [coords, setCoords] = React.useState<{lat:number;lng:number}|null>(null)
  const [data, setData] = React.useState<any>(null)
  const [msg, setMsg] = React.useState<string|undefined>()

  async function load(lat:number, lng:number){
    try{
      const res = await fetch(`/api/env-intel?lat=${lat}&lng=${lng}`)
      const j = await res.json(); setData(j)
    }catch(e:any){ setMsg(e?.message||'Failed') }
  }

  function get(){
    if (!navigator.geolocation) { setMsg('Geolocation not supported'); return }
    navigator.geolocation.getCurrentPosition((pos)=>{
      const lat = pos.coords.latitude, lng = pos.coords.longitude
      setCoords({lat,lng}); load(lat,lng)
    }, ()=> setMsg('Location denied'))
  }

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
        { label: 'Environment Intelligence' }
      ]} />
      <h1 className="text-2xl font-bold text-plum mb-4">Environment intelligence</h1>
      <div className="rounded-xl border border-plum/10 bg-brandWhite p-4 space-y-4">
        <div className="flex gap-2">
          <button className="rounded-lg border px-3 py-2" onClick={get}>Use my location</button>
          {coords && <div className="text-sm text-plum/70">lat {coords.lat.toFixed(4)}, lng {coords.lng.toFixed(4)}</div>}
        </div>
        {data && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Card label="Air quality (AQI)" value={String(data.aqi)} />
            <Card label="Flood risk" value={(data.floodRisk*100).toFixed(0)+'%'} />
            <Card label="Climate score" value={String(Math.round(data.climateScore))+'/100'} />
          </div>
        )}
        {msg && <div className="text-sm text-plum/80">{msg}</div>}
      </div>
        </main>
      </div>
    </div>
  )
}

function Card({ label, value }: { label: string; value: string }){
  return (
    <div className="rounded-lg border border-plum/10 p-3">
      <div className="text-xs text-plum/60">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  )
}
