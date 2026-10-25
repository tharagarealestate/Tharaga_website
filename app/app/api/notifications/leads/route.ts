import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { secureApiRoute } from '@/lib/security/api-security'
import { Permissions } from '@/lib/security/permissions'
import { AuditActions, AuditResourceTypes } from '@/lib/security/audit'

export const dynamic = 'force-dynamic'

export const GET = secureApiRoute(
  async (request: NextRequest, user) => {
    try {
      const supabase = await createClient()

      // Get high-priority leads (score >= 8) created in last 7 days
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      const { data: highPriorityLeads, error: leadsError } = await supabase
        .from('leads')
        .select('id, name, email, score, created_at')
        .eq('builder_id', user.id)
        .gte('score', 8)
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(10)

      if (leadsError) {
        console.error('Error fetching high-priority leads:', leadsError)
      }

      // Get recent interactions
      const { data: recentInteractions, error: interactionsError } = await supabase
        .from('lead_interactions')
        .select(`
          id,
          lead_id,
          interaction_type,
          timestamp,
          leads!inner(id, name, email, builder_id)
        `)
        .eq('leads.builder_id', user.id)
        .gte('timestamp', sevenDaysAgo.toISOString())
        .order('timestamp', { ascending: false })
        .limit(10)

      if (interactionsError) {
        console.error('Error fetching interactions:', interactionsError)
      }

      // Build notifications
      const notifications: any[] = []

      // High-priority lead notifications
      ;(highPriorityLeads || []).forEach((lead: any) => {
        notifications.push({
          id: `high-priority-${lead.id}`,
          type: 'high_priority',
          title: 'High-Priority Lead',
          message: `${lead.name || lead.email} has a score of ${lead.score.toFixed(1)}/10`,
          lead_id: lead.id,
          lead_name: lead.name || lead.email,
          timestamp: lead.created_at,
          read: false,
          action_url: `/builder/leads/${lead.id}`,
        })
      })

      // Recent interaction notifications
      ;(recentInteractions || []).forEach((interaction: any) => {
        const lead = interaction.leads
        notifications.push({
          id: `interaction-${interaction.id}`,
          type: 'new_interaction',
          title: 'New Interaction',
          message: `New ${interaction.interaction_type} with ${lead?.name || lead?.email || 'lead'}`,
          lead_id: interaction.lead_id,
          lead_name: lead?.name || lead?.email,
          timestamp: interaction.timestamp,
          read: false,
          action_url: `/builder/leads/${interaction.lead_id}`,
        })
      })

      // Sort by timestamp (newest first)
      notifications.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )

      const unreadCount = notifications.filter(n => !n.read).length

      return NextResponse.json({
        success: true,
        notifications: notifications.slice(0, 20), // Return top 20
        unread_count: unreadCount,
      })
    } catch (error: any) {
      console.error('[API/Notifications] Error:', error)
      return NextResponse.json(
        {
          success: false,
          error: error.message || 'Failed to fetch notifications',
          notifications: [],
          unread_count: 0,
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

