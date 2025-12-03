"use client"

import Link from 'next/link'
import { ArrowRight, Calendar, DollarSign, Globe, Mail, Phone, Users } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

export type Lead = {
  id: string
  created_at: string
  full_name?: string
  name?: string
  email: string
  phone: string | null
  status?: string
  score: number
  category?: string
  source?: string
  budget_min?: number | null
  budget_max?: number | null
  property?: { title?: string; location?: string }
  viewed_properties?: Array<{
    property_id: string
    property_title: string
    view_count: number
    last_viewed: string
  }>
  total_views?: number
  total_interactions?: number
  last_activity?: string | null
  days_since_last_activity?: number
}

export function LeadCardSkeleton() {
  return (
    <div className="glass-card p-6 rounded-xl bg-white/60 border border-gray-200 relative">
      <div className="absolute inset-0 flex items-center justify-center">
        <LoadingSpinner size="md" variant="gold" />
      </div>
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

export function LeadCard({ 
  lead, 
  isSelected = false, 
  onSelect 
}: { 
  lead: Lead
  isSelected?: boolean
  onSelect?: (selected: boolean) => void
}) {
  const scoreColor = getScoreColor(lead.score)
  return (
    <div className="glass-card p-4 md:p-6 rounded-xl hover:shadow-xl transition-all duration-300 border-l-4 bg-white border-gray-200 relative" style={{ borderLeftColor: scoreColor }}>
      {onSelect && (
        <div className="absolute top-4 right-4">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect(e.target.checked)}
            className="w-5 h-5 text-[#6e0d25] border-gray-300 rounded focus:ring-[#6e0d25] cursor-pointer"
          />
        </div>
      )}
      <div className="flex items-start justify-between mb-4">
        <div className={`px-3 py-1 rounded-full text-sm font-bold text-white`} style={{ backgroundColor: scoreColor }}>
          {lead.score.toFixed(1)} {lead.category || getScoreLabel(lead.score)}
        </div>
        <div className="text-xs text-gray-500">
          {formatDistanceToNow(new Date(lead.created_at))} ago
        </div>
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900 mb-1">{lead.full_name || lead.name || 'Unknown'}</h3>
        <div className="space-y-1 text-sm text-gray-600">
          {lead.phone && (
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              <a href={`tel:${lead.phone}`} className="hover:text-primary-600">{lead.phone}</a>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            <a href={`mailto:${lead.email}`} className="hover:text-primary-600 truncate">{lead.email}</a>
          </div>
        </div>
      </div>

      {lead.viewed_properties && lead.viewed_properties.length > 0 && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-xs text-gray-600 mb-1">Viewed {lead.viewed_properties.length} propert{lead.viewed_properties.length === 1 ? 'y' : 'ies'}:</div>
          <div className="font-semibold text-gray-900 text-sm truncate">{lead.viewed_properties[0]?.property_title || '-'}</div>
          {lead.viewed_properties.length > 1 && (
            <div className="text-xs text-gray-500 mt-1">+{lead.viewed_properties.length - 1} more</div>
          )}
        </div>
      )}

      {(!lead.viewed_properties || lead.viewed_properties.length === 0) && lead.property && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-xs text-gray-600 mb-1">Interested in:</div>
          <div className="font-semibold text-gray-900 text-sm truncate">{lead.property?.title || '-'}</div>
          <div className="text-xs text-gray-500">{lead.property?.location || ''}</div>
        </div>
      )}

      <div className="flex items-center gap-4 mb-4 text-sm">
        {lead.total_views !== undefined && (
          <div className="flex items-center gap-1 text-gray-600">
            <Users className="w-4 h-4" />
            <span>{lead.total_views} views</span>
          </div>
        )}
        {lead.total_interactions !== undefined && lead.total_interactions > 0 && (
          <div className="flex items-center gap-1 text-gray-600">
            <span>{lead.total_interactions} interactions</span>
          </div>
        )}
        {(lead.budget_min || lead.budget_max) && (
          <div className="flex items-center gap-1 text-gray-600">
            <DollarSign className="w-4 h-4" />
            <span>
              {lead.budget_min && lead.budget_max 
                ? `₹${formatCurrency(lead.budget_min)} - ₹${formatCurrency(lead.budget_max)}`
                : lead.budget_max 
                  ? `Up to ₹${formatCurrency(lead.budget_max)}`
                  : `From ₹${formatCurrency(lead.budget_min!)}`}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-2">
        {lead.phone && (
          <a href={`tel:${lead.phone}`} className="flex-1 w-full py-2 px-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2">
            <Phone className="w-4 h-4" />
            Call
          </a>
        )}
        <a href={`mailto:${lead.email}`} className={`${lead.phone ? 'flex-1' : 'flex-1'} w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2`}>
          <Mail className="w-4 h-4" />
          Email
        </a>
        <Link href={`/builder/leads/${lead.id}`} className="py-2 px-4 border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors flex items-center justify-center w-full md:w-auto" title="View Details">
          <ArrowRight className="w-4 h-4 text-gray-600" />
        </Link>
      </div>
      
      {/* Quick Stats */}
      {lead.total_interactions !== undefined && lead.total_interactions > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{lead.total_interactions} interaction{lead.total_interactions !== 1 ? 's' : ''}</span>
            {lead.has_pending_interactions && (
              <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full font-medium">
                Pending
              </span>
            )}
          </div>
        </div>
      )}
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
