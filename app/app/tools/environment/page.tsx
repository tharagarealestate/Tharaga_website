"use client"

import * as React from 'react'
import Breadcrumb from '@/components/Breadcrumb'
import { PageWrapper } from '@/components/ui/PageWrapper'
import { PageHeader } from '@/components/ui/PageHeader'
import { SectionWrapper } from '@/components/ui/SectionWrapper'
import { GlassCard } from '@/components/ui/glass-card'
import { PremiumButton } from '@/components/ui/premium-button'
import { DESIGN_TOKENS } from '@/lib/design-system'

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
    <PageWrapper>
      <Breadcrumb items={[
        { label: 'Home', href: '/' },
        { label: 'Tools', href: '/sitemap' },
        { label: 'Environment Intelligence' }
      ]} />
      
      <PageHeader
        title="Environment Intelligence"
        description="Get air quality, flood risk, and climate data for your property location"
        className="text-center mb-8"
      />

      <SectionWrapper noPadding>
        <GlassCard variant="dark" glow border className="p-6 sm:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
          <PremiumButton variant="secondary" size="sm" onClick={get}>
            Use my location
          </PremiumButton>
          {coords && <div className={`text-sm ${DESIGN_TOKENS.colors.text.secondary}`}>lat {coords.lat.toFixed(4)}, lng {coords.lng.toFixed(4)}</div>}
        </div>
        {data && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Card label="Air quality (AQI)" value={String(data.aqi)} />
            <Card label="Flood risk" value={(data.floodRisk*100).toFixed(0)+'%'} />
            <Card label="Climate score" value={String(Math.round(data.climateScore))+'/100'} />
          </div>
        )}
        {msg && <div className={`text-sm ${DESIGN_TOKENS.colors.text.secondary}`}>{msg}</div>}
        </GlassCard>
      </SectionWrapper>
    </PageWrapper>
  )
}

function Card({ label, value }: { label: string; value: string }){
  return (
    <div className={`rounded-lg border ${DESIGN_TOKENS.colors.border.default} p-3`}>
      <div className={`text-xs ${DESIGN_TOKENS.colors.text.muted}`}>{label}</div>
      <div className={`font-semibold ${DESIGN_TOKENS.colors.text.primary}`}>{value}</div>
    </div>
  )
}
