import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { secureApiRoute } from '@/lib/security/api-security'
import { Permissions } from '@/lib/security/permissions'
import { AuditActions, AuditResourceTypes } from '@/lib/security/audit'

export const dynamic = 'force-dynamic'

export const GET = secureApiRoute(
  async (request: NextRequest, user, { params }: { params: { leadId: string } }) => {
    try {
      const supabase = await createClient()
      const { leadId } = params

      // Verify lead belongs to builder
      const { data: lead, error: leadError } = await supabase
        .from('leads')
        .select('id, builder_id')
        .eq('id', leadId)
        .eq('builder_id', user.id)
        .single()

      if (leadError || !lead) {
        return NextResponse.json(
          { error: 'Lead not found', activities: [] },
          { status: 404 }
        )
      }

      // Fetch interactions
      const { data: interactions, error: interactionsError } = await supabase
        .from('lead_interactions')
        .select('*')
        .eq('lead_id', leadId)
        .eq('builder_id', user.id)
        .order('timestamp', { ascending: false })
        .limit(50)

      if (interactionsError) {
        console.error('Error fetching interactions:', interactionsError)
      }

      // Fetch behavior tracking
      const { data: behaviors, error: behaviorsError } = await supabase
        .from('behavior_tracking')
        .select('*')
        .eq('user_id', leadId) // Assuming user_id in behavior_tracking refers to lead
        .order('created_at', { ascending: false })
        .limit(20)

      if (behaviorsError) {
        console.error('Error fetching behaviors:', behaviorsError)
      }

      // Fetch score history
      const { data: scoreHistory, error: scoreError } = await supabase
        .from('smartscore_history')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false })
        .limit(20)

      if (scoreError) {
        console.error('Error fetching score history:', scoreError)
      }

      // Fetch CRM sync logs
      const { data: syncLogs, error: syncError } = await supabase
        .from('crm_sync_log')
        .select('*')
        .eq('tharaga_id', leadId)
        .order('sync_started_at', { ascending: false })
        .limit(10)

      if (syncError) {
        console.error('Error fetching sync logs:', syncError)
      }

      // Combine and format activities
      const activities: any[] = []

      // Add interactions
      ;(interactions || []).forEach((interaction: any) => {
        activities.push({
          id: `interaction-${interaction.id}`,
          type: 'interaction',
          timestamp: interaction.timestamp || interaction.created_at,
          title: getInteractionTitle(interaction.interaction_type),
          description: interaction.notes || `Interaction: ${interaction.interaction_type}`,
          status: interaction.status || 'completed',
          metadata: {
            interaction_type: interaction.interaction_type,
            property_id: interaction.property_id,
            response_time_minutes: interaction.response_time_minutes,
          },
        })
      })

      // Add behaviors
      ;(behaviors || []).forEach((behavior: any) => {
        activities.push({
          id: `behavior-${behavior.id}`,
          type: 'behavior',
          timestamp: behavior.created_at,
          title: getBehaviorTitle(behavior.behavior_type),
          description: getBehaviorDescription(behavior),
          metadata: {
            behavior_type: behavior.behavior_type,
            metadata: behavior.metadata,
          },
        })
      })

      // Add score changes
      ;(scoreHistory || []).forEach((score: any, index: number) => {
        if (index === 0) return // Skip first entry (no change)
        const prevScore = scoreHistory[index + 1]?.score || 0
        const change = score.score - prevScore
        
        if (Math.abs(change) > 0.1) {
          activities.push({
            id: `score-${score.id}`,
            type: 'score_change',
            timestamp: score.created_at,
            title: `Score ${change > 0 ? 'Increased' : 'Decreased'}`,
            description: `Lead score changed from ${prevScore.toFixed(1)} to ${score.score.toFixed(1)}`,
            metadata: {
              score_change: change.toFixed(1),
              new_score: score.score,
              previous_score: prevScore,
            },
          })
        }
      })

      // Add CRM syncs
      ;(syncLogs || []).forEach((sync: any) => {
        activities.push({
          id: `sync-${sync.id}`,
          type: 'crm_sync',
          timestamp: sync.sync_started_at || sync.created_at,
          title: `Synced to ${sync.sync_direction === 'to_crm' ? 'ZOHO CRM' : 'Tharaga'}`,
          description: sync.status === 'success' 
            ? `Successfully synced to ZOHO CRM`
            : `Sync ${sync.status}: ${sync.error_message || 'Unknown error'}`,
          status: sync.status === 'success' ? 'completed' : 'failed',
          metadata: {
            crm_id: sync.crm_id,
            sync_direction: sync.sync_direction,
          },
        })
      })

      // Sort by timestamp (newest first)
      activities.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )

      return NextResponse.json({
        success: true,
        activities: activities.slice(0, 50), // Limit to 50 most recent
        total: activities.length,
      })
    } catch (error: any) {
      console.error('[API/Activities] Error:', error)
      return NextResponse.json(
        {
          success: false,
          error: error.message || 'Failed to fetch activities',
          activities: [],
        },
        { status: 500 }
      )
    }
  },
  {
    requireAuth: true,
    requireRole: ['builder', 'admin'],
    requirePermission: Permissions.LEAD_VIEW,
    rateLimit: 'api',
    auditAction: AuditActions.VIEW,
    auditResourceType: AuditResourceTypes.LEAD,
  }
)

function getInteractionTitle(type: string): string {
  const titles: Record<string, string> = {
    phone_call: 'Phone Call',
    email_sent: 'Email Sent',
    whatsapp_message: 'WhatsApp Message',
    site_visit_scheduled: 'Site Visit Scheduled',
    site_visit_completed: 'Site Visit Completed',
    negotiation_started: 'Negotiation Started',
    offer_made: 'Offer Made',
    offer_accepted: 'Offer Accepted',
    offer_rejected: 'Offer Rejected',
    deal_closed: 'Deal Closed',
    deal_lost: 'Deal Lost',
  }
  return titles[type] || 'Interaction'
}

function getBehaviorTitle(type: string): string {
  const titles: Record<string, string> = {
    page_view: 'Page Viewed',
    property_view: 'Property Viewed',
    search: 'Search Performed',
    form_interaction: 'Form Interaction',
    phone_clicked: 'Phone Number Clicked',
    email_clicked: 'Email Clicked',
    favorite: 'Property Favorited',
    share: 'Property Shared',
  }
  return titles[type] || 'Activity'
}

function getBehaviorDescription(behavior: any): string {
  if (behavior.metadata?.property_title) {
    return `Viewed property: ${behavior.metadata.property_title}`
  }
  if (behavior.metadata?.search_query) {
    return `Searched for: ${behavior.metadata.search_query}`
  }
  return `Activity: ${behavior.behavior_type}`
}

