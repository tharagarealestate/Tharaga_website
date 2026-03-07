'use client'

import { useState, useEffect } from 'react'
import ClientInteractiveMap from './ClientInteractiveMap'
import { getSupabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

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

const METRICS = [
  { key: 'connectivity_score',   label: 'Connectivity'    },
  { key: 'infrastructure_score', label: 'Infrastructure'  },
  { key: 'safety_score',         label: 'Safety'          },
  { key: 'green_space_score',    label: 'Green Spaces'    },
] as const

function scoreColor(score: number) {
  if (score >= 7.5) return { bar: 'bg-emerald-500', text: 'text-emerald-400' }
  if (score >= 5)   return { bar: 'bg-amber-500',   text: 'text-amber-400'   }
  return              { bar: 'bg-red-500',     text: 'text-red-400'     }
}

export default function LocationInsights({ propertyId, lat, lng }: LocationInsightsProps) {
  const [data, setData] = useState<LocationData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchData() }, [propertyId])

  async function fetchData() {
    try {
      setLoading(true)
      const supabase = getSupabase()
      const { data: row } = await supabase
        .from('property_location_data')
        .select('connectivity_score, infrastructure_score, safety_score, green_space_score')
        .eq('property_id', propertyId)
        .maybeSingle()
      if (row) setData(row)
    } catch {}
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-5">
      {/* Map */}
      <div className="rounded-2xl overflow-hidden border border-white/[0.07]">
        <ClientInteractiveMap lat={lat} lng={lng} workplace={null} />
      </div>

      {/* Score chips */}
      {loading ? (
        <div className="flex items-center gap-2">
          <div className="h-3.5 w-3.5 rounded-full border-2 border-amber-500/30 border-t-amber-400 animate-spin" />
          <span className="text-xs text-zinc-500">Loading location scores…</span>
        </div>
      ) : data ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {METRICS.map(({ key, label }) => {
            const raw  = data[key]
            const score = Math.round(raw * 10) / 10
            const { bar, text } = scoreColor(score)
            return (
              <div key={key} className="bg-white/[0.04] border border-white/[0.07] rounded-xl p-3.5">
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2">{label}</p>
                <p className={cn('text-lg font-black leading-none mb-2', text)}>{score}<span className="text-[10px] text-zinc-600 font-normal">/10</span></p>
                <div className="h-0.5 w-full bg-white/[0.05] rounded-full overflow-hidden">
                  <div className={cn('h-full rounded-full opacity-70', bar)} style={{ width: `${score * 10}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="text-xs text-zinc-600">Location intelligence will be available soon for this property.</p>
      )}
    </div>
  )
}
