"use client"
import { useEffect, useState } from 'react'

export default function Analytics(){
  const [rows, setRows] = useState<any[]>([])
  useEffect(()=>{ fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/analytics/conversion`).then(r=>r.json()).then(d=>setRows(d.rows||[])).catch(()=>{}) },[])
  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <h1 className="text-2xl font-bold mb-4">Conversion insights</h1>
      <div className="overflow-auto border border-border rounded">
        <table className="min-w-[720px] w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="p-2 text-left">Org</th>
              <th className="p-2 text-left">Tier</th>
              <th className="p-2 text-left">Leads</th>
              <th className="p-2 text-left">High‑intent</th>
              <th className="p-2 text-left">High‑intent rate</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r,i)=> (
              <tr key={i} className="border-t border-border">
                <td className="p-2">{r.name}</td>
                <td className="p-2">{r.tier}</td>
                <td className="p-2">{r.leads}</td>
                <td className="p-2">{r.high_intent}</td>
                <td className="p-2">{r.high_intent_rate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}
