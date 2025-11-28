"use client"
import { useEffect, useState } from 'react'
import Breadcrumb from '@/components/Breadcrumb'

type Row = { id: string, title: string, city: string, locality: string, listed_at: string }

export default function AdminVerifyPage(){
  const [rows, setRows] = useState<Row[]>([])
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string|null>(null)

  async function load(){
    setBusy(true)
    try{
      const res = await fetch('/api/admin/properties?unverified=1', { headers: { 'x-admin-token': process.env.NEXT_PUBLIC_ADMIN_TOKEN || '' } })
      const j = await res.json()
      setRows(j.items || [])
    } catch(e:any){ setMsg(e?.message || 'Load failed') }
    finally{ setBusy(false) }
  }
  useEffect(()=>{ load() },[])

  async function loadMetrics(){
    try{
      const res = await fetch('/api/admin/metrics', { headers: { 'x-admin-token': process.env.NEXT_PUBLIC_ADMIN_TOKEN || '' } })
      const j = await res.json();
      if (j?.ok) setMsg(`7d: new ${j.newProps}, verified ${j.verifiedLast7}, leads ${j.leads}`)
    } catch {}
  }
  useEffect(()=>{ loadMetrics() },[])

  async function verify(id: string){
    setBusy(true)
    try{
      const res = await fetch('/api/admin/verify', { method:'POST', headers:{ 'Content-Type':'application/json', 'x-admin-token': process.env.NEXT_PUBLIC_ADMIN_TOKEN || '' }, body: JSON.stringify({ id, verified:true, listing_status:'active' }) })
      const j = await res.json(); if (j?.ok) { setMsg('Verified ✔'); load() } else { setMsg(j?.error || 'Failed') }
    } catch(e:any){ setMsg(e?.message || 'Failed') } finally { setBusy(false) }
  }

  return (
    <>
      <Breadcrumb items={[
        { label: 'Home', href: '/' },
        { label: 'Admin', href: '/admin' },
        { label: 'Verify Properties' }
      ]} />
      <main className="mx-auto max-w-3xl px-6 py-8">
        <h1 className="text-2xl font-bold text-plum mb-2">Admin · Verify properties</h1>
      {msg && <div className="mb-4 rounded-lg border border-plum/10 bg-white p-3 text-sm text-plum/80">{msg}</div>}
      {busy && <div className="text-sm text-plum/70">Loading…</div>}
      <div className="space-y-2">
        {rows.map(r => (
          <div key={r.id} className="rounded-lg border border-plum/10 bg-white p-3 flex items-center justify-between">
            <div>
              <div className="font-semibold text-plum">{r.title}</div>
              <div className="text-xs text-plum/70">{[r.locality, r.city].filter(Boolean).join(', ')}</div>
            </div>
            <button onClick={()=>verify(r.id)} className="rounded-lg bg-gold text-plum px-3 py-1 text-sm border border-transparent hover:brightness-105">Verify</button>
          </div>
        ))}
        {!rows.length && !busy && <div className="text-sm text-plum/70">No pending properties.</div>}
      </div>
      </main>
    </>
  )
}

