"use client"

import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

async function fetchLeads() {
  const res = await fetch(`/api/builder/leads`)
  if (!res.ok) throw new Error('Failed')
  const j = await res.json()
  return j.items as any[]
}

const COLUMNS = [
  { key: 'new', title: 'New' },
  { key: 'contacted', title: 'Contacted' },
  { key: 'site_visit', title: 'Site Visit' },
  { key: 'negotiation', title: 'Negotiation' },
  { key: 'closed_won', title: 'Closed Won' },
]

export default function LeadsPipelinePage(){
  const { data: leads = [], isLoading } = useQuery({ queryKey: ['leads-pipeline'], queryFn: fetchLeads })
  const grouped = useMemo(() => {
    const m: Record<string, any[]> = {}
    for (const col of COLUMNS) m[col.key] = []
    for (const l of leads) {
      const k = COLUMNS.find(c => c.key === l.status)?.key || 'new'
      m[k].push(l)
    }
    return m
  }, [leads])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Leads Pipeline</h1>
        <p className="text-gray-600 mt-1">Drag and drop coming soon</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {COLUMNS.map(col => (
          <div key={col.key} className="bg-white rounded-xl border border-gray-200 p-3">
            <div className="font-semibold text-gray-800 mb-2">{col.title} <span className="text-xs text-gray-500">({grouped[col.key]?.length||0})</span></div>
            <div className="space-y-3">
              {isLoading && <div className="text-xs text-gray-500">Loading…</div>}
              {grouped[col.key]?.map((l) => (
                <div key={l.id} className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                  <div className="text-sm font-medium text-gray-900">{l.name}</div>
                  <div className="text-xs text-gray-500">{l.email}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
