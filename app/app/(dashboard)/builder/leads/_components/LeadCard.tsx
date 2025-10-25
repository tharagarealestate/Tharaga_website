"use client"

import Link from 'next/link'
import { ArrowRight, Calendar, DollarSign, Globe, Mail, Phone, Users } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export type Lead = {
  id: string
  created_at: string
  name: string
  email: string
  phone: string
  status: string
  score: number
  source: string
  budget?: number
  property: { title?: string; location?: string }
}

export function LeadCardSkeleton() {
  return (
    <div className="glass-card p-6 rounded-xl animate-pulse bg-white/60 border border-gray-200">
      <div className="flex items-start justify-between mb-4">
        <div className="h-6 w-28 rounded-full bg-gray-200" />
        <div className="h-4 w-16 bg-gray-200 rounded" />
      </div>
      <div className="mb-4 space-y-2">
        <div className="h-6 w-40 bg-gray-200 rounded" />
        <div className="h-4 w-56 bg-gray-200 rounded" />
        <div className="h-4 w-48 bg-gray-200 rounded" />
      </div>
      <div className="mb-4 p-3 bg-gray-100 rounded-lg">
        <div className="h-4 w-52 bg-gray-200 rounded" />
      </div>
      <div className="flex gap-2">
        <div className="h-9 flex-1 bg-gray-200 rounded" />
        <div className="h-9 flex-1 bg-gray-200 rounded" />
        <div className="h-9 w-10 bg-gray-200 rounded" />
      </div>
    </div>
  )
}

export function LeadCard({ lead }: { lead: Lead }) {
  const scoreColor = getScoreColor(lead.score)
  return (
    <div className="glass-card p-6 rounded-xl hover:shadow-xl transition-all duration-300 border-l-4 bg-white border-gray-200" style={{ borderLeftColor: scoreColor }}>
      <div className="flex items-start justify-between mb-4">
        <div className={`px-3 py-1 rounded-full text-sm font-bold text-white`} style={{ backgroundColor: scoreColor }}>
          {lead.score.toFixed(1)} {getScoreLabel(lead.score)}
        </div>
        <div className="text-xs text-gray-500">
          {formatDistanceToNow(new Date(lead.created_at))} ago
        </div>
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900 mb-1">{lead.name}</h3>
        <div className="space-y-1 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4" />
            <a href={`tel:${lead.phone}`} className="hover:text-primary-600">{lead.phone}</a>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            <a href={`mailto:${lead.email}`} className="hover:text-primary-600 truncate">{lead.email}</a>
          </div>
        </div>
      </div>

      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="text-xs text-gray-600 mb-1">Interested in:</div>
        <div className="font-semibold text-gray-900 text-sm truncate">{lead.property?.title || '-'}</div>
        <div className="text-xs text-gray-500">{lead.property?.location || ''}</div>
      </div>

      <div className="flex items-center gap-4 mb-4 text-sm">
        <div className="flex items-center gap-1 text-gray-600">
          <Globe className="w-4 h-4" />
          <span className="capitalize">{lead.source}</span>
        </div>
        {typeof lead.budget === 'number' && (
          <div className="flex items-center gap-1 text-gray-600">
            <DollarSign className="w-4 h-4" />
            <span>₹{formatCurrency(lead.budget)}</span>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <a href={`tel:${lead.phone}`} className="flex-1 py-2 px-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2">
          <Phone className="w-4 h-4" />
          Call
        </a>
        <button className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2">
          <Calendar className="w-4 h-4" />
          Schedule
        </button>
        <Link href={`/builder/leads/${lead.id}`} className="py-2 px-4 border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors flex items-center justify-center">
          <ArrowRight className="w-4 h-4 text-gray-600" />
        </Link>
      </div>
    </div>
  )
}

export function getScoreColor(score: number) {
  if (score >= 9) return '#D4AF37'
  if (score >= 7) return '#F59E0B'
  if (score >= 5) return '#3B82F6'
  if (score >= 3) return '#6B7280'
  return '#9CA3AF'
}

export function getScoreLabel(score: number) {
  if (score >= 9) return '🔥 Hot'
  if (score >= 7) return '⚡ Warm'
  if (score >= 5) return '📈 Developing'
  if (score >= 3) return '❄️ Cold'
  return '⏸️ Low'
}

function formatCurrency(n: number) {
  try {
    return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n)
  } catch {
    return String(n)
  }
}
