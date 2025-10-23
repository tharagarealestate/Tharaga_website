"use client"
export const runtime = 'edge'

import { useQuery } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Mail, Phone } from 'lucide-react'

async function fetchLead(id: string){
  const res = await fetch(`/api/builder/leads/${id}`)
  if (!res.ok) throw new Error('Not found')
  const j = await res.json()
  return j.item as any
}

export default function LeadDetailsPage(){
  const params = useParams() as { id: string }
  const id = params.id
  const { data: lead, isLoading, isError } = useQuery({ queryKey: ['lead', id], queryFn: () => fetchLead(id), enabled: !!id })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/builder/leads" className="inline-flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" /> Back to Leads
        </Link>
      </div>

      {isLoading && <div className="text-sm text-gray-600">Loading…</div>}
      {isError && <div className="text-sm text-red-600">Lead not found.</div>}
      {lead && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h1 className="text-2xl font-bold text-gray-900">{lead.name}</h1>
              <div className="mt-2 text-sm text-gray-600">Interested in {lead.property?.title || 'a property'}</div>
              <div className="mt-4 flex items-center gap-4 text-sm">
                <a href={`mailto:${lead.email}`} className="inline-flex items-center gap-2 text-primary-700 hover:underline"><Mail className="w-4 h-4" /> {lead.email}</a>
                <a href={`tel:${lead.phone}`} className="inline-flex items-center gap-2 text-primary-700 hover:underline"><Phone className="w-4 h-4" /> {lead.phone}</a>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-2">Notes</h2>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{lead.message || 'No message provided.'}</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="text-sm text-gray-600">Score</div>
              <div className="text-3xl font-bold">{lead.score?.toFixed?.(1) ?? lead.score}</div>
              <div className="text-xs text-gray-500 mt-1 capitalize">{lead.status}</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="text-sm text-gray-600 mb-1">Property</div>
              <div className="font-semibold">{lead.property?.title || '-'}</div>
              <div className="text-xs text-gray-500">{lead.property?.location || ''}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
