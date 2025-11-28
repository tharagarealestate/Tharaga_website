"use client"
export const runtime = 'edge'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import Breadcrumb from '@/components/Breadcrumb'
import { FeatureGate } from '@/components/ui/FeatureGate'

export default function Microsite({ params }: { params: { id: string }}){
  const [data, setData] = useState<any | null>(null)
  useEffect(()=>{ fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/microsite/${params.id}`).then(r=>r.json()).then(setData).catch(()=>{}) },[params.id])
  const [leadMsg, setLeadMsg] = useState<string>('')

  async function onLeadSubmit(e: React.FormEvent){
    e.preventDefault()
    const fd = new FormData(e.target as HTMLFormElement)
    const payload = Object.fromEntries(fd.entries()) as any
    payload.property_id = params.id
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/leads`, { method:'POST', headers:{'Content-Type':'application/json'}, credentials:'include', body: JSON.stringify(payload) })
    const j = await res.json().catch(()=>({}))
    setLeadMsg(j.overLimit ? 'Received (upgrade recommended: lead limit reached)' : 'Thanks! We will contact you shortly.')
  }

  if (!data) return (<main className="mx-auto max-w-5xl px-6 py-8">Loading…</main>)
  return (
    <>
      <Breadcrumb items={[
        { label: 'Home', href: '/' },
        { label: 'Builder Microsite' },
        { label: data.title || 'Property' }
      ]} />
      <main className="mx-auto max-w-5xl px-6 py-8 space-y-4">
        <h1 className="text-2xl font-bold">{data.title}</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2 space-y-3">
          {Array.isArray(data.images) && data.images.length>0 && (
            <Image src={data.images[0]} alt="" width={1280} height={720} className="w-full rounded" placeholder="blur" blurDataURL="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==" />
          )}
          <p className="text-fgMuted text-sm">{data.seo_summary}</p>
          <FeatureGate feature="microsite3D" fallback={<div className="text-fgMuted">3D floor plan is a Growth+ feature.</div>}>
            <div className="border border-border rounded p-3">[3D floor plan placeholder]</div>
          </FeatureGate>
          <FeatureGate feature="emiCalc" fallback={<div className="text-fgMuted">EMI calculator is a Growth+ feature.</div>}>
            <div className="border border-border rounded p-3">[EMI calculator placeholder]</div>
          </FeatureGate>
        </div>
        <div className="space-y-3">
          <form onSubmit={onLeadSubmit} className="border border-border rounded p-3 space-y-2">
            <div className="font-semibold">Request details</div>
            <input className="border rounded p-2 w-full" name="name" placeholder="Name" />
            <input className="border rounded p-2 w-full" name="email" placeholder="Email" />
            <input className="border rounded p-2 w-full" name="phone" placeholder="Phone" />
            <textarea className="border rounded p-2 w-full" name="message" placeholder="Your message" />
            <FeatureGate feature="voiceTranscription" fallback={<div className="text-xs text-fgMuted">Voice note transcription available on Pro.</div>}>
              <textarea className="border rounded p-2 w-full" name="voice_transcript" placeholder="Paste voice transcript (Pro)" />
            </FeatureGate>
            <button className="btn w-full">Send</button>
            {leadMsg && <div className="text-xs text-fgMuted">{leadMsg}</div>}
          </form>
          <FeatureGate feature="calendarSync" fallback={<a className="btn w-full" href="#" onClick={async(e)=>{e.preventDefault();const iso=new Date(Date.now()+86400000).toISOString();const r=await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/calendar/ics`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title:`Visit: ${data.title}`,startISO:iso,location:data.city})});const b=await r.text();const blob=new Blob([b],{type:'text/calendar'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='site-visit.ics';a.click();URL.revokeObjectURL(url);}}>Download calendar invite</a>}>
            <div className="text-xs text-fgMuted">Calendar sync is enabled.</div>
          </FeatureGate>
        </div>
      </div>
      </main>
    </>
  )
}
