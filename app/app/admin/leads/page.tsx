"use client"
import { useEffect, useState } from 'react'

type Lead = { id: string, created_at: string, property_id: string, name: string, email: string, phone: string, message: string }

export default function AdminLeadsPage(){
  const [rows, setRows] = useState<Lead[]>([])
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string|null>(null)

  async function load(){
    setBusy(true)
    try{
      const res = await fetch('/api/admin/leads', { headers: { 'x-admin-token': process.env.NEXT_PUBLIC_ADMIN_TOKEN || '' } })
      const j = await res.json(); setRows(j.items || [])
    } catch(e:any){ setMsg(e?.message || 'Load failed') }
    finally{ setBusy(false) }
  }
  useEffect(()=>{ load() },[])

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <h1 className="text-2xl font-bold text-plum mb-2">Admin · Leads</h1>
      {msg && <div className="mb-4 rounded-lg border border-plum/10 bg-white p-3 text-sm text-plum/80">{msg}</div>}
      {busy && <div className="text-sm text-plum/70">Loading…</div>}
      <div className="overflow-auto rounded-lg border border-plum/10 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-plum/5">
            <tr>
              <th className="px-3 py-2 text-left">When</th>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">Contact</th>
              <th className="px-3 py-2 text-left">Property</th>
              <th className="px-3 py-2 text-left">Message</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} className="border-t border-plum/10">
                <td className="px-3 py-2 whitespace-nowrap">{new Date(r.created_at).toLocaleString()}</td>
                <td className="px-3 py-2">{r.name || '-'}</td>
                <td className="px-3 py-2">
                  <div>{r.email || '-'}</div>
                  <div>{r.phone || '-'}</div>
                </td>
                <td className="px-3 py-2">{r.property_id}</td>
                <td className="px-3 py-2">{r.message || '-'}</td>
              </tr>
            ))}
            {(!rows.length && !busy) && (
              <tr><td className="px-3 py-4" colSpan={5}>No leads yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  )
}

