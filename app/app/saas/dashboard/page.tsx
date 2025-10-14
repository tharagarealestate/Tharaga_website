"use client"
import { useEffect, useState } from 'react'
import { useEntitlements } from '@/components/ui/FeatureGate'

export default function Dashboard(){
  const { tier } = useEntitlements()
  const [usage, setUsage] = useState<any[]>([])
  useEffect(()=>{
    fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/admin/usage`).then(r=>r.json()).then(d=>setUsage(d.rows||[])).catch(()=>{})
  },[])
  return (
    <main className="mx-auto max-w-6xl px-6 py-8 space-y-4">
      <h1 className="text-2xl font-bold">Builder Dashboard</h1>
      <div className="text-sm text-fgMuted">Current tier: <b className="text-fg">{tier}</b></div>
      <section>
        <h2 className="font-semibold mb-2">Recent usage</h2>
        <div className="overflow-auto border border-border rounded">
          <table className="min-w-[720px] w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="p-2 text-left">Org</th>
                <th className="p-2 text-left">Tier</th>
                <th className="p-2 text-left">Month</th>
                <th className="p-2 text-left">Leads</th>
                <th className="p-2 text-left">Listings</th>
              </tr>
            </thead>
            <tbody>
              {usage.map((u,i)=> (
                <tr key={i} className="border-t border-border">
                  <td className="p-2">{u.name}</td>
                  <td className="p-2">{u.tier}</td>
                  <td className="p-2">{new Date(u.period_month).toLocaleDateString()}</td>
                  <td className="p-2">{u.leads_count}</td>
                  <td className="p-2">{u.listings_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}
