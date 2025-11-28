"use client"
import { useEffect, useState } from 'react'
import Breadcrumb from '@/components/Breadcrumb'

type Builder = { id: string, name: string, email: string, phone: string, whatsapp: string }

export default function AdminSettingsPage(){
  const [rows, setRows] = useState<Builder[]>([])
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string|null>(null)

  async function load(){
    setBusy(true)
    try{
      const res = await fetch('/api/admin/builders', { headers: { 'x-admin-token': process.env.NEXT_PUBLIC_ADMIN_TOKEN || '' } })
      const j = await res.json(); setRows(j.items || [])
    } catch(e:any){ setMsg(e?.message || 'Load failed') }
    finally{ setBusy(false) }
  }
  useEffect(()=>{ load() },[])

  async function save(b: Builder){
    setBusy(true)
    try{
      const res = await fetch('/api/admin/builder-update', { method:'POST', headers:{ 'Content-Type':'application/json', 'x-admin-token': process.env.NEXT_PUBLIC_ADMIN_TOKEN || '' }, body: JSON.stringify(b) })
      const j = await res.json(); setMsg(j?.ok ? 'Saved ✔' : (j?.error || 'Failed'))
    } catch(e:any){ setMsg(e?.message || 'Failed') } finally { setBusy(false) }
  }

  return (
    <>
      <Breadcrumb items={[
        { label: 'Home', href: '/' },
        { label: 'Admin', href: '/admin' },
        { label: 'Settings' }
      ]} />
      <main className="mx-auto max-w-4xl px-6 py-8">
        <h1 className="text-2xl font-bold text-deepBlue mb-2">Admin · Builder settings</h1>
      {msg && <div className="mb-4 rounded-lg border border-deepBlue/10 bg-white p-3 text-sm text-deepBlue/80">{msg}</div>}
      {busy && <div className="text-sm text-deepBlue/70">Working…</div>}
      <div className="space-y-3">
        {rows.map((r, idx)=> (
          <div key={r.id} className="rounded-lg border border-deepBlue/10 bg-white p-3 grid grid-cols-5 gap-2 items-center">
            <input className="col-span-1 rounded-lg border px-2 py-1" value={r.name||''} onChange={e=>setRows(s => s.map((x,i)=> i===idx?{...x,name:e.target.value}:x))} />
            <input className="col-span-2 rounded-lg border px-2 py-1" placeholder="email" value={r.email||''} onChange={e=>setRows(s => s.map((x,i)=> i===idx?{...x,email:e.target.value}:x))} />
            <input className="col-span-1 rounded-lg border px-2 py-1" placeholder="phone" value={r.phone||''} onChange={e=>setRows(s => s.map((x,i)=> i===idx?{...x,phone:e.target.value}:x))} />
            <div className="col-span-1 flex gap-2 justify-end">
              <button className="rounded-lg border px-3 py-1 text-sm" onClick={()=>save(rows[idx])}>Save</button>
            </div>
          </div>
        ))}
        {(!rows.length && !busy) && <div className="text-sm text-deepBlue/70">No builders yet.</div>}
      </div>
      </main>
    </>
  )
}

