"use client"
import React from 'react'

export type PoiResult = {
  name: string
  lat: number
  lng: number
  distanceMeters?: number
  durationText?: string
}

export type DistanceSummary = {
  work?: { distanceMeters?: number; durationText?: string }
  school?: PoiResult | null
  metro?: PoiResult | null
  airport?: PoiResult | null
}

export function InteractiveMap({
  lat,
  lng,
  workplace,
  zoom = 14,
}: {
  lat?: number | null
  lng?: number | null
  workplace?: { lat: number; lng: number } | null
  zoom?: number
}) {
  const ref = React.useRef<HTMLDivElement | null>(null)
  const [summary, setSummary] = React.useState<DistanceSummary>({})
  const [loaded, setLoaded] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [mapReady, setMapReady] = React.useState(false)

  React.useEffect(() => {
    if (!lat || !lng) return
    let cancelled = false
    ;(async () => {
      try {
        await ensureGoogleMapsLoaded()
        if (cancelled) return
        setLoaded(true)
      } catch (e: any) {
        setError('Map failed to load')
      }
    })()
    return () => { cancelled = true }
  }, [lat, lng])

  React.useEffect(() => {
    if (!loaded || !ref.current || !lat || !lng) return
    const center = { lat, lng }
    const map = new (window as any).google.maps.Map(ref.current, { center, zoom, mapId: 'thg_property_map' })
    new (window as any).google.maps.Marker({ position: center, map, title: 'Property', icon: makePin('#eab308') })
    setMapReady(true)

    // Nearby search for POIs within 2km
    const service = new (window as any).google.maps.places.PlacesService(map)
    const requests: Array<{ type: string; color: string; key: keyof DistanceSummary }> = [
      { type: 'school', color: '#3b82f6', key: 'school' },
      { type: 'hospital', color: '#ef4444', key: 'school' as any }, // we'll just mark on map, summary later
      { type: 'subway_station', color: '#a855f7', key: 'metro' },
      { type: 'shopping_mall', color: '#22c55e', key: 'airport' as any }, // map markers
    ]

    const bounds = new (window as any).google.maps.Circle({ center, radius: 2000 }).getBounds()

    function nearby(type: string, color: string) {
      return new Promise<PoiResult | null>((resolve) => {
        service.nearbySearch({ location: center, radius: 2000, type: [type] as any }, (results: any[], status: string) => {
          if (status !== (window as any).google.maps.places.PlacesServiceStatus.OK || !results?.length) return resolve(null)
          const nearest = results[0]
          const loc = nearest.geometry?.location
          if (!loc) return resolve(null)
          const point = { lat: loc.lat(), lng: loc.lng() }
          new (window as any).google.maps.Marker({ position: point, map, title: nearest.name, icon: makePin(color) })
          resolve({ name: nearest.name, lat: point.lat, lng: point.lng })
        })
      })
    }

    ;(async () => {
      const [school, metro] = await Promise.all([
        nearby('school', '#3b82f6'),
        nearby('subway_station', '#a855f7'),
      ])
      const airport = await nearby('airport', '#111827')
      const ds: DistanceSummary = { school, metro, airport }

      // Distance matrix from workplace if provided
      try {
        const work = workplace || readWorkLocation()
        if (work) {
          const dm = new (window as any).google.maps.DistanceMatrixService()
          const origin = new (window as any).google.maps.LatLng(work.lat, work.lng)
          const destination = new (window as any).google.maps.LatLng(lat, lng)
          dm.getDistanceMatrix({
            origins: [origin],
            destinations: [destination],
            travelMode: (window as any).google.maps.TravelMode.DRIVING,
          }, (resp: any, status: string) => {
            try {
              if (status === 'OK') {
                const row = resp.rows?.[0]?.elements?.[0]
                if (row?.distance) ds.work = { distanceMeters: row.distance.value, durationText: row.duration?.text }
                setSummary(ds)
              } else {
                setSummary(ds)
              }
            } catch { setSummary(ds) }
          })
        } else {
          setSummary(ds)
        }
      } catch { setSummary(ds) }
    })()

    return () => {}
  }, [loaded, lat, lng, zoom, workplace])

  if (!lat || !lng) return <div className="rounded border p-3 text-sm text-gray-600">Map unavailable</div>

  return (
    <div className="space-y-3">
      <div ref={ref} className="w-full h-96 rounded border" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <div className="rounded border p-3">Work: {summary.work?.durationText || '—'}</div>
        <div className="rounded border p-3">School: {summary.school?.name || 'Nearest'}</div>
        <div className="rounded border p-3">Metro: {summary.metro?.name || 'Nearest'}</div>
        <div className="rounded border p-3">Airport: {summary.airport?.name || 'Nearest'}</div>
      </div>
    </div>
  )
}

function readWorkLocation(): { lat: number; lng: number } | null {
  try {
    const s = localStorage.getItem('thg_work_location')
    if (!s) return null
    const j = JSON.parse(s)
    if (typeof j?.lat === 'number' && typeof j?.lng === 'number') return { lat: j.lat, lng: j.lng }
    return null
  } catch { return null }
}

function makePin(color: string){
  return {
    path: "M12 2C8.134 2 5 5.134 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.866-3.134-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z",
    fillColor: color,
    fillOpacity: 1,
    strokeWeight: 0,
    scale: 1.5,
    anchor: new (window as any).google.maps.Point(12, 22),
  }
}

async function ensureGoogleMapsLoaded(){
  if ((window as any).google?.maps?.places) return
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || ''
  if (!key) throw new Error('Missing NEXT_PUBLIC_GOOGLE_MAPS_KEY')
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Google Maps failed'))
    document.head.appendChild(script)
  })
}
