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

      // Get builder's leads with AI insights
      const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select(`
          id,
          name,
          email,
          score,
          smartscore_v2,
          conversion_probability,
          next_best_action,
          ai_insights,
          priority_tier,
          optimal_contact_time,
          created_at,
          updated_at
        `)
        .eq('builder_id', user.id)
        .order('smartscore_v2', { ascending: false, nullsFirst: false })
        .limit(50)

      if (leadsError) {
        throw leadsError
      }

      // Generate AI insights from leads data
      const insights = []

      // High priority leads without recent contact
      const highPriorityNoContact = leads?.filter(lead => {
        if (!lead.smartscore_v2 || lead.smartscore_v2 < 0.7) return false
        const daysSinceUpdate = lead.updated_at 
          ? Math.floor((Date.now() - new Date(lead.updated_at).getTime()) / (1000 * 60 * 60 * 24))
          : 999
        return daysSinceUpdate > 3
      }) || []

      highPriorityNoContact.forEach(lead => {
        insights.push({
          id: `insight-${lead.id}-1`,
          type: 'action',
          title: `High-Value Lead Needs Attention`,
          description: `${lead.name || lead.email} has a ${Math.round((lead.smartscore_v2 || 0) * 100)}% conversion probability but hasn't been contacted recently.`,
          priority: 'high' as const,
          lead_id: lead.id,
          lead_name: lead.name || lead.email,
          action: {
            label: 'Contact Now',
            url: `/builder/leads/${lead.id}`,
          },
          confidence: lead.smartscore_v2 || 0.7,
          created_at: new Date().toISOString(),
        })
      })

      // Optimal contact time recommendations
      const optimalContactLeads = leads?.filter(lead => 
        lead.optimal_contact_time && 
        new Date(lead.optimal_contact_time) > new Date() &&
        new Date(lead.optimal_contact_time) < new Date(Date.now() + 24 * 60 * 60 * 1000)
      ) || []

      optimalContactLeads.forEach(lead => {
        insights.push({
          id: `insight-${lead.id}-2`,
          type: 'opportunity',
          title: `Optimal Contact Window`,
          description: `Best time to contact ${lead.name || lead.email} is ${new Date(lead.optimal_contact_time!).toLocaleString()}.`,
          priority: 'medium' as const,
          lead_id: lead.id,
          lead_name: lead.name || lead.email,
          action: {
            label: 'Schedule Contact',
            url: `/builder/leads/${lead.id}`,
          },
          confidence: 0.85,
          created_at: new Date().toISOString(),
        })
      })

      // Next best action recommendations
      const actionLeads = leads?.filter(lead => lead.next_best_action) || []
      actionLeads.slice(0, 5).forEach(lead => {
        insights.push({
          id: `insight-${lead.id}-3`,
          type: 'recommendation',
          title: `Recommended Action`,
          description: `For ${lead.name || lead.email}: ${lead.next_best_action}`,
          priority: 'medium' as const,
          lead_id: lead.id,
          lead_name: lead.name || lead.email,
          action: {
            label: 'View Lead',
            url: `/builder/leads/${lead.id}`,
          },
          confidence: 0.75,
          created_at: new Date().toISOString(),
        })
      })

      // Sort by priority and confidence
      insights.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 }
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[b.priority] - priorityOrder[a.priority]
        }
        return b.confidence - a.confidence
      })

      return NextResponse.json({
        success: true,
        insights: insights.slice(0, 10), // Return top 10 insights
        total: insights.length,
      })
    } catch (error: any) {
      console.error('[API/AI-Insights] Error:', error)
      return NextResponse.json(
        {
          success: false,
          error: error.message || 'Failed to fetch AI insights',
          insights: [],
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

