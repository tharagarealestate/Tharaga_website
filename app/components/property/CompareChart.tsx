"use client"
import React, { useEffect, useState } from 'react'

export function CompareChart({ items }: { items: Array<{ title: string; pricePerSqftINR?: number|null }> }){
  const [R, setR] = useState<any>(null)
  useEffect(() => { let mounted=true; (async()=>{ try{ const mod = await import('recharts'); if(mounted) setR(mod) }catch{} })(); return ()=>{ mounted=false } }, [])
  const data = (items||[]).slice(0, 6).map((it, i)=>({
    name: it.title?.slice(0, 12) || `P${i+1}`,
    pps: it.pricePerSqftINR || 0,
  }))
  if (!data.length) return null
  if (!R) return <div className="h-60" />
  return (
    <div className="h-60">
      <R.ResponsiveContainer width="100%" height="100%">
        <R.AreaChart data={data} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
          <defs>
            <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#eab308" stopOpacity={0.6}/>
              <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <R.XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <R.YAxis tickFormatter={(n: any)=>`₹${n}`}
            tick={{ fontSize: 12 }}
            domain={[0, (max)=> Math.max(1000, Math.ceil((max as number)*1.2))]}
          />
          <R.Tooltip formatter={(v: any)=>`₹${Number(v).toLocaleString('en-IN')}/sqft`} labelClassName="text-xs" contentStyle={{ fontSize: 12 }} />
          <R.Area type="monotone" dataKey="pps" stroke="#eab308" fill="url(#g)" strokeWidth={2} />
        </R.AreaChart>
      </R.ResponsiveContainer>
    </div>
  )
}
