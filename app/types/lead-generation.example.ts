/**
 * Example usage of Lead Generation Types
 * 
 * This file demonstrates how to use the lead generation types
 * in your application code.
 */

import type {
  UserBehavior,
  LeadScore,
  LeadInteraction,
  LeadPipeline,
  EnrichedLead,
  GetLeadsRequest,
  GetLeadsResponse,
  CalculateScoreResponse,
} from '@/types/lead-generation'
import {
  isRecommendationExpired,
  getScoreBadge,
  getStageBadge,
} from '@/types/lead-generation'

// =============================================
// Example: Tracking User Behavior
// =============================================

export function trackPropertyView(
  userId: string,
  propertyId: string,
  sessionId: string
): UserBehavior {
  return {
    id: crypto.randomUUID(),
    user_id: userId,
    behavior_type: 'property_view',
    property_id: propertyId,
    timestamp: new Date().toISOString(),
    duration: 0, // Will be updated when user leaves
    metadata: {
      page: 'property-detail',
      source: 'search',
    },
    session_id: sessionId,
    device_type: 'mobile',
    created_at: new Date().toISOString(),
  }
}

// =============================================
// Example: Creating Lead Interaction
// =============================================

export function createPhoneCallInteraction(
  leadId: string,
  builderId: string,
  propertyId: string,
  notes?: string
): LeadInteraction {
  return {
    id: crypto.randomUUID(),
    lead_id: leadId,
    builder_id: builderId,
    property_id: propertyId,
    interaction_type: 'phone_call',
    timestamp: new Date().toISOString(),
    response_time_minutes: null, // Will be calculated
    scheduled_for: null,
    completed_at: null,
    status: 'pending',
    notes: notes || null,
    outcome: null,
    next_follow_up: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

// =============================================
// Example: Formatting Lead Score Display
// =============================================

export function formatLeadScoreDisplay(score: LeadScore): {
  badge: ReturnType<typeof getScoreBadge>
  formattedScore: string
  breakdown: string
} {
  const badge = getScoreBadge(score.category)
  const formattedScore = `${score.score.toFixed(1)}/10`
  
  const breakdown = [
    `Budget: ${score.budget_alignment_score.toFixed(1)}`,
    `Engagement: ${score.engagement_score.toFixed(1)}`,
    `Property Fit: ${score.property_fit_score.toFixed(1)}`,
    `Contact Intent: ${score.contact_intent_score.toFixed(1)}`,
  ].join(' | ')

  return {
    badge,
    formattedScore,
    breakdown,
  }
}

// =============================================
// Example: Formatting Pipeline Stage
// =============================================

export function formatPipelineStage(pipeline: LeadPipeline): {
  badge: ReturnType<typeof getStageBadge>
  stageInfo: string
} {
  const badge = getStageBadge(pipeline.stage)
  const stageInfo = `Stage: ${badge.label} | Days in pipeline: ${pipeline.days_in_pipeline}`

  return {
    badge,
    stageInfo,
  }
}

// =============================================
// Example: API Request Builder
// =============================================

export function buildGetLeadsRequest(
  builderId: string,
  options?: {
    filter?: GetLeadsRequest['filter']
    sortBy?: GetLeadsRequest['sort_by']
    page?: number
    limit?: number
    search?: string
  }
): GetLeadsRequest {
  return {
    builder_id: builderId,
    filter: options?.filter || 'all',
    sort_by: options?.sortBy || 'score',
    page: options?.page || 1,
    limit: options?.limit || 20,
    search: options?.search,
  }
}

// =============================================
// Example: Processing API Response
// =============================================

export function processLeadsResponse(response: GetLeadsResponse): {
  leads: EnrichedLead[]
  summary: {
    total: number
    hotLeads: number
    avgScore: number
  }
} {
  const hotLeads = response.data.filter(
    (lead) => lead.lead_score?.category === 'Hot Lead'
  ).length

  const avgScore =
    response.data.reduce((sum, lead) => {
      return sum + (lead.lead_score?.score || 0)
    }, 0) / (response.data.length || 1)

  return {
    leads: response.data,
    summary: {
      total: response.pagination.total,
      hotLeads,
      avgScore: Math.round(avgScore * 10) / 10,
    },
  }
}

// =============================================
// Example: Filtering Expired Recommendations
// =============================================

import type { AIRecommendation } from '@/types/lead-generation'

export function filterActiveRecommendations(
  recommendations: AIRecommendation[]
): AIRecommendation[] {
  return recommendations.filter((rec) => !isRecommendationExpired(rec))
}

// =============================================
// Example: Type-safe API Client Helper
// =============================================

export async function fetchLeadScore(
  userId: string
): Promise<CalculateScoreResponse> {
  // This is a mock - replace with actual API call
  const response = await fetch(`/api/leads/score`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId }),
  })

  if (!response.ok) {
    throw new Error('Failed to fetch lead score')
  }

  return response.json() as Promise<CalculateScoreResponse>
}

