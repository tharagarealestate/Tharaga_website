"use client"

import { useQuery } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Mail, Phone, TrendingUp, Clock, MapPin, Home, Activity, Lightbulb, BarChart3 } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'

async function fetchLead(id: string) {
  const res = await fetch(`/api/leads/${id}`)
  if (!res.ok) throw new Error('Not found')
  const j = await res.json()
  return j.data as {
    id: string
    email: string
    full_name: string
    phone: string | null
    created_at: string
    last_login: string | null
    score: number
    category: string
    score_breakdown: Record<string, number>
    score_history: Array<{ score: number; timestamp: string; category: string }>
    budget_min: number | null
    budget_max: number | null
    preferred_location: string | null
    preferred_property_type: string | null
    additional_requirements: string | null
    behavior_summary: {
      total_sessions: number
      total_views: number
      total_time_spent: number
      avg_session_duration: number
      most_active_day: string
      most_active_hour: number
      device_breakdown: Record<string, number>
    }
    viewed_properties: Array<{
      property_id: string
      property_title: string
      property_price: number
      property_location: string
      view_count: number
      total_time_spent: number
      first_viewed: string
      last_viewed: string
      engagement_score: number
    }>
    activity_timeline: Array<{
      type: 'behavior' | 'interaction' | 'score_change'
      timestamp: string
      description: string
      metadata: Record<string, any>
    }>
    interactions: Array<{
      id: string
      type: string
      timestamp: string
      status: string
      notes: string | null
      outcome: string | null
      response_time: number | null
    }>
    recommendations: {
      suggested_properties: string[]
      next_best_action: string
      optimal_contact_time: string
      conversion_probability: number
    }
  }
}

function getScoreColor(score: number) {
  if (score >= 9) return '#D4AF37'
  if (score >= 7) return '#F59E0B'
  if (score >= 5) return '#3B82F6'
  if (score >= 3) return '#6B7280'
  return '#9CA3AF'
}

function formatCurrency(n: number) {
  try {
    return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n)
  } catch {
    return String(n)
  }
}

function formatDuration(seconds: number) {
  if (seconds < 60) return `${Math.round(seconds)}s`
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`
  return `${Math.round(seconds / 3600)}h`
}

export default function LeadDetailsPage() {
  const params = useParams() as { id: string }
  const id = params.id
  const { data: lead, isLoading, isError } = useQuery({ 
    queryKey: ['lead', id], 
    queryFn: () => fetchLead(id), 
    enabled: !!id 
  })

  if (isLoading) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="text-sm text-fgMuted">Loading…</div>
      </main>
    )
  }

  if (isError || !lead) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="text-sm text-red-600">Lead not found.</div>
      </main>
    )
  }

  const scoreColor = getScoreColor(lead.score)

  return (
    <main className="mx-auto max-w-7xl px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/builder/leads" className="inline-flex items-center gap-2 text-sm text-fgMuted hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Back to Leads
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="border border-border rounded p-6 bg-white">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{lead.full_name}</h1>
                <div className="flex items-center gap-4 text-sm text-fgMuted">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <a href={`mailto:${lead.email}`} className="hover:text-primary-600">{lead.email}</a>
                  </div>
                  {lead.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      <a href={`tel:${lead.phone}`} className="hover:text-primary-600">{lead.phone}</a>
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className={`px-4 py-2 rounded-full text-lg font-bold text-white`} style={{ backgroundColor: scoreColor }}>
                  {lead.score.toFixed(1)} {lead.category}
                </div>
                <div className="text-xs text-fgMuted mt-2">
                  Created {formatDistanceToNow(new Date(lead.created_at))} ago
                </div>
              </div>
            </div>

            {/* Preferences */}
            {(lead.preferred_location || lead.preferred_property_type || lead.budget_min || lead.budget_max) && (
              <div className="mt-4 pt-4 border-t border-border">
                <h3 className="text-sm font-semibold mb-3">Preferences</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {lead.preferred_location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-fgMuted">Location:</span>
                      <span className="font-medium">{lead.preferred_location}</span>
                    </div>
                  )}
                  {lead.preferred_property_type && (
                    <div className="flex items-center gap-2">
                      <Home className="w-4 h-4 text-gray-400" />
                      <span className="text-fgMuted">Type:</span>
                      <span className="font-medium">{lead.preferred_property_type}</span>
                    </div>
                  )}
                  {(lead.budget_min || lead.budget_max) && (
                    <div className="flex items-center gap-2 col-span-2">
                      <span className="text-fgMuted">Budget:</span>
                      <span className="font-medium">
                        {lead.budget_min && lead.budget_max 
                          ? `₹${formatCurrency(lead.budget_min)} - ₹${formatCurrency(lead.budget_max)}`
                          : lead.budget_max 
                            ? `Up to ₹${formatCurrency(lead.budget_max)}`
                            : `From ₹${formatCurrency(lead.budget_min!)}`}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Score Breakdown */}
          <div className="border border-border rounded p-6 bg-white">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Score Breakdown
            </h2>
            <div className="space-y-3">
              {Object.entries(lead.score_breakdown).map(([key, value]) => (
                <div key={key}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-fgMuted capitalize">{key.replace(/_/g, ' ')}</span>
                    <span className="font-medium">{value.toFixed(1)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full" 
                      style={{ 
                        width: `${(value / 10) * 100}%`,
                        backgroundColor: scoreColor 
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Behavior Analytics */}
          <div className="border border-border rounded p-6 bg-white">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Behavior Analytics
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-2xl font-bold">{lead.behavior_summary.total_sessions}</div>
                <div className="text-xs text-fgMuted">Sessions</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{lead.behavior_summary.total_views}</div>
                <div className="text-xs text-fgMuted">Property Views</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{formatDuration(lead.behavior_summary.total_time_spent)}</div>
                <div className="text-xs text-fgMuted">Time Spent</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{formatDuration(lead.behavior_summary.avg_session_duration)}</div>
                <div className="text-xs text-fgMuted">Avg Session</div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border">
              <div className="text-sm text-fgMuted mb-2">Most Active: {lead.behavior_summary.most_active_day} at {lead.behavior_summary.most_active_hour}:00</div>
              {Object.keys(lead.behavior_summary.device_breakdown).length > 0 && (
                <div className="text-sm">
                  <span className="text-fgMuted">Devices: </span>
                  {Object.entries(lead.behavior_summary.device_breakdown).map(([device, count]) => (
                    <span key={device} className="mr-3">
                      <span className="font-medium capitalize">{device}</span>: {count}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Viewed Properties */}
          {lead.viewed_properties.length > 0 && (
            <div className="border border-border rounded p-6 bg-white">
              <h2 className="text-lg font-semibold mb-4">Viewed Properties</h2>
              <div className="space-y-3">
                {lead.viewed_properties.map((prop) => (
                  <div key={prop.property_id} className="p-3 border border-border rounded">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-medium">{prop.property_title}</div>
                        <div className="text-sm text-fgMuted">{prop.property_location}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">₹{formatCurrency(prop.property_price)}</div>
                        <div className="text-xs text-fgMuted">Score: {prop.engagement_score.toFixed(1)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-fgMuted">
                      <span>{prop.view_count} views</span>
                      <span>{formatDuration(prop.total_time_spent)} time</span>
                      <span>Last: {formatDistanceToNow(new Date(prop.last_viewed))} ago</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Activity Timeline */}
          <div className="border border-border rounded p-6 bg-white">
            <h2 className="text-lg font-semibold mb-4">Activity Timeline</h2>
            <div className="space-y-3">
              {lead.activity_timeline.slice(0, 20).map((item, idx) => (
                <div key={idx} className="flex gap-3 text-sm">
                  <div className="flex-shrink-0 w-2 h-2 rounded-full mt-2" style={{ backgroundColor: 
                    item.type === 'interaction' ? '#10B981' : 
                    item.type === 'score_change' ? '#F59E0B' : '#3B82F6' 
                  }} />
                  <div className="flex-1">
                    <div className="font-medium">{item.description}</div>
                    <div className="text-xs text-fgMuted">{formatDistanceToNow(new Date(item.timestamp))} ago</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interactions */}
          {lead.interactions.length > 0 && (
            <div className="border border-border rounded p-6 bg-white">
              <h2 className="text-lg font-semibold mb-4">Interactions</h2>
              <div className="space-y-3">
                {lead.interactions.map((interaction) => (
                  <div key={interaction.id} className="p-3 border border-border rounded">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-medium capitalize">{interaction.type.replace(/_/g, ' ')}</div>
                        <div className="text-sm text-fgMuted">{formatDistanceToNow(new Date(interaction.timestamp))} ago</div>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${
                        interaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                        interaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {interaction.status}
                      </span>
                    </div>
                    {interaction.notes && (
                      <div className="text-sm text-fgMuted mt-2">{interaction.notes}</div>
                    )}
                    {interaction.outcome && (
                      <div className="text-sm font-medium mt-2">Outcome: {interaction.outcome}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* AI Recommendations */}
          <div className="border border-border rounded p-6 bg-white">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Lightbulb className="w-5 h-5" />
              AI Recommendations
            </h2>
            <div className="space-y-4">
              <div>
                <div className="text-xs text-fgMuted mb-1">Next Best Action</div>
                <div className="font-medium">{lead.recommendations.next_best_action}</div>
              </div>
              <div>
                <div className="text-xs text-fgMuted mb-1">Optimal Contact Time</div>
                <div className="font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {lead.recommendations.optimal_contact_time}
                </div>
              </div>
              <div>
                <div className="text-xs text-fgMuted mb-1">Conversion Probability</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full bg-primary-600" 
                      style={{ width: `${lead.recommendations.conversion_probability}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{lead.recommendations.conversion_probability}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="border border-border rounded p-6 bg-white">
            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-2">
              {lead.phone && (
                <a 
                  href={`tel:${lead.phone}`}
                  className="w-full py-2 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded text-sm font-medium flex items-center justify-center gap-2"
                >
                  <Phone className="w-4 h-4" />
                  Call Now
                </a>
              )}
              <a 
                href={`mailto:${lead.email}`}
                className="w-full py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-sm font-medium flex items-center justify-center gap-2"
              >
                <Mail className="w-4 h-4" />
                Send Email
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
