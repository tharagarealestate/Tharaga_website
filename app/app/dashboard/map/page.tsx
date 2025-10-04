"use client"

import * as React from 'react'

type Prop = { id: string; title: string; city: string; locality?: string | null }

const CITY_TO_COORD: Record<string, { lat: number; lng: number }> = {
  Bengaluru: { lat: 12.9716, lng: 77.5946 },
  Bangalore: { lat: 12.9716, lng: 77.5946 },
  Mumbai: { lat: 19.0760, lng: 72.8777 },
  Pune: { lat: 18.5204, lng: 73.8567 },
  Chennai: { lat: 13.0827, lng: 80.2707 },
  Hyderabad: { lat: 17.3850, lng: 78.4867 },
  Delhi: { lat: 28.6139, lng: 77.2090 },
}

export default function MapPage(){
  const mapRef = React.useRef<HTMLDivElement>(null)
  const [ready, setReady] = React.useState(false)
  const [propsData, setPropsData] = React.useState<Prop[]>([])

  React.useEffect(()=>{
    // Load Leaflet from CDN
    const css = document.createElement('link')
    css.rel = 'stylesheet'; css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    const js = document.createElement('script')
    js.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'; js.defer = true
    js.onload = ()=> setReady(true)
    document.head.appendChild(css); document.body.appendChild(js)
    return ()=> { css.remove(); js.remove() }
  }, [])

  React.useEffect(()=>{
    (async function(){
      try {
        const res = await fetch('/api/properties-list')
        const j = await res.json()
        if (Array.isArray(j)) setPropsData(j)
      } catch {}
    })()
  }, [])

  React.useEffect(()=>{
    if (!ready || !mapRef.current || !(window as any).L) return
    const L = (window as any).L
    const map = L.map(mapRef.current).setView([12.9716, 77.5946], 6)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OSM' }).addTo(map)

    propsData.forEach(p => {
      const coord = CITY_TO_COORD[p.city]
      if (!coord) return
      const m = L.marker([coord.lat, coord.lng]).addTo(map)
      m.bindPopup(`<strong>${p.title}</strong><br/>${[p.locality, p.city].filter(Boolean).join(', ')}`)
    })

    return ()=> map.remove()
  }, [ready, propsData])

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="text-2xl font-bold text-plum mb-4">Property map</h1>
      <div ref={mapRef} className="w-full rounded-xl border border-plum/10 overflow-hidden" style={{ height: 480 }} />
      <p className="text-xs text-plum/60 mt-2">Approximate city markers. Replace with precise coordinates when available.</p>
    </main>
  )
}
