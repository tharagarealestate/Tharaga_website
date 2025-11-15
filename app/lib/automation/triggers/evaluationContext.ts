/**
 * Evaluation Context - Builds context for condition evaluation
 */

import { createClient } from '@/lib/supabase/server'

export interface EvaluationContext {
  lead?: Record<string, any>
  property?: Record<string, any>
  builder?: Record<string, any>
  event?: Record<string, any>
  [key: string]: any
}

/**
 * Build evaluation context from event data
 */
export async function buildEvaluationContext(
  eventData: Record<string, any>,
  builderId: string
): Promise<EvaluationContext> {
  const supabase = createClient()
  const context: EvaluationContext = {
    event: eventData,
    builder_id: builderId,
  }

  // Load lead data if lead_id is present
  if (eventData.lead_id) {
    const { data: lead } = await supabase
      .from('leads')
      .select('*')
      .eq('id', eventData.lead_id)
      .single()

    if (lead) {
      context.lead = lead
      // Flatten lead fields into context for easier access
      Object.assign(context, {
        score: lead.score,
        status: lead.status,
        budget: lead.budget,
        email: lead.email,
        phone: lead.phone,
        created_at: lead.created_at,
        last_contact_date: lead.last_contact_date,
        contact_count: lead.contact_count,
        tags: lead.tags,
        source: lead.source,
      })
    }
  }

  // Load property data if property_id is present
  if (eventData.property_id) {
    const { data: property } = await supabase
      .from('properties')
      .select('*')
      .eq('id', eventData.property_id)
      .single()

    if (property) {
      context.property = property
    }
  }

  return context
}

