'use client'

import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import ClientInteractiveMap from './ClientInteractiveMap'
import { getSupabase } from '@/lib/supabase'

interface LocationInsightsProps {
  propertyId: string
  lat: number | null
  lng: number | null
}

interface LocationData {
  connectivity_score: number
  infrastructure_score: number
  safety_score: number
  green_space_score: number
}

export default function LocationInsights({ propertyId, lat, lng }: LocationInsightsProps) {
  const [locationData, setLocationData] = useState<LocationData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLocationData()
  }, [propertyId])

  async function fetchLocationData() {
    try {
      setLoading(true)
      const supabase = getSupabase()
      const { data, error } = await supabase
        .from('property_location_data')
        .select('connectivity_score, infrastructure_score, safety_score, green_space_score')
        .eq('property_id', propertyId)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') throw error

      if (data) {
        setLocationData(data)
      }
    } catch (error: any) {
      console.error('Error fetching location data:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-slate-800/95 glow-border rounded-lg p-6">
      <h2 className="text-2xl font-bold text-white mb-4">Location Insights</h2>
      <ClientInteractiveMap lat={lat} lng={lng} workplace={null} />

      {loading ? (
        <div className="mt-4 flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 text-amber-300 animate-spin" />
          <span className="ml-3 text-white">Loading location insights...</span>
        </div>
      ) : locationData ? (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <MetricCard label="Connectivity" value={locationData.connectivity_score} />
          <MetricCard label="Social Infrastructure" value={locationData.infrastructure_score} />
          <MetricCard label="Safety" value={locationData.safety_score} />
          <MetricCard label="Green Spaces" value={locationData.green_space_score} />
        </div>
      ) : (
        <div className="mt-4 text-center py-4">
          <p className="text-white text-sm">Location insights will be available soon</p>
        </div>
      )}
    </div>
  )
}

function MetricCard({ label, value }: { label: string; value: number }) {
  const score = Math.round(value * 10) / 10
  return (
    <div className="bg-slate-700/50 border border-amber-300/30 rounded-lg p-3">
      <div className="text-xs uppercase font-semibold mb-1 text-white">{label}</div>
      <div className="text-white font-bold">{score}/10</div>
    </div>
  )
}
