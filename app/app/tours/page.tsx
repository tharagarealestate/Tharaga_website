"use client"

import * as React from 'react'

function IframeTour({ src }: { src: string }) {
  return (
    <div className="aspect-video w-full overflow-hidden rounded-xl border border-plum/10 bg-black">
      <iframe src={src} className="w-full h-full" allow="xr-spatial-tracking; gyroscope; accelerometer; vr; fullscreen" allowFullScreen />
    </div>
  )
}

function sanitizeTour(url: string): string | null {
  try {
    const u = new URL(url)
    const allowed = [
      'my.matterport.com',
      'kuula.co',
      'kuula.co',
      'momento360.com',
    ]
    if (!allowed.includes(u.hostname)) return null
    return u.toString()
  } catch { return null }
}

export default function ToursPage(){
  const [raw, setRaw] = React.useState('https://my.matterport.com/show/?m=xxxxxxxxxxx')
  const safe = sanitizeTour(raw)
  const [mode, setMode] = React.useState<'normal'|'day'|'night'|'monsoon'>('normal')
  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <h1 className="text-2xl font-bold text-plum mb-4">AR/VR property tours</h1>
      <div className="rounded-xl border border-plum/10 bg-brandWhite p-4 space-y-4">
        <div>
          <label className="block text-sm mb-1">360/3D tour URL (Matterport, Kuula, or compatible)</label>
          <input type="url" value={raw} onChange={(e)=>setRaw(e.target.value)} className="w-full rounded-lg border px-3 py-2"/>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-plum/70">Lighting:</span>
          {(['normal','day','night','monsoon'] as const).map(m => (
            <button key={m} onClick={()=>setMode(m)} className={`rounded-lg border px-2 py-1 ${mode===m? 'bg-plum text-white' : ''}`}>{m}</button>
          ))}
        </div>
        <div className={`relative ${mode!=='normal' ? 'transition-colors' : ''}`}>
          {safe ? <IframeTour src={safe} /> : <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">Unsupported provider URL.</div>}
          {mode==='night' && <div className="absolute inset-0 pointer-events-none mix-blend-multiply" style={{background:'radial-gradient(circle at 20% 10%, rgba(0,0,0,0.1), transparent 40%), linear-gradient(180deg, rgba(0,0,0,0.35), rgba(0,0,0,0.65))'}}/>}
          {mode==='day' && <div className="absolute inset-0 pointer-events-none mix-blend-screen" style={{background:'linear-gradient(180deg, rgba(255,244,214,0.35), rgba(255,255,255,0))'}}/>}
          {mode==='monsoon' && (
            <div className="absolute inset-0 pointer-events-none" style={{background:'linear-gradient(180deg, rgba(0,20,40,0.25), rgba(0,0,0,0.45))'}}/>
          )}
        </div>
        <p className="text-xs text-plum/60">Paste a share link. Many providers support WebXR or device motion for immersive view.</p>
        <div className="flex flex-wrap gap-2 text-sm">
          <a className="rounded-lg border px-3 py-2" href="/tours/ar-staging">AR furniture staging</a>
          <a className="rounded-lg border px-3 py-2" href="/tours/hotspots">360 hotspots</a>
        </div>
      </div>
    </main>
  )
}
