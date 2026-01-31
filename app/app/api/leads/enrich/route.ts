import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { secureApiRoute } from '@/lib/security/api-security'
import { Permissions } from '@/lib/security/permissions'
import { AuditActions, AuditResourceTypes } from '@/lib/security/audit'
import { openAILeadService } from '@/lib/services/openai-lead-service'

export const dynamic = 'force-dynamic'

export const POST = secureApiRoute(
  async (request: NextRequest, user) => {
    try {
      const supabase = await createClient()
      const body = await request.json()
      const { lead_id } = body

      if (!lead_id) {
        return NextResponse.json(
          { error: 'lead_id is required' },
          { status: 400 }
        )
      }

      // Fetch lead data
      const { data: lead, error: leadError } = await supabase
        .from('leads')
        .select('*')
        .eq('id', lead_id)
        .eq('builder_id', user.id)
        .single()

      if (leadError || !lead) {
        return NextResponse.json(
          { error: 'Lead not found' },
          { status: 404 }
        )
      }

      // Enrich lead using OpenAI
      const enrichment = await openAILeadService.enrichLead({
        name: lead.name || '',
        email: lead.email || '',
        phone: lead.phone || undefined,
        message: lead.message || undefined,
        source: lead.source || undefined,
      })

      // Update lead with enrichment data
      const enrichmentData: any = {
        updated_at: new Date().toISOString(),
      }

      // Store enrichment in metadata or dedicated columns
      if (lead.ai_insights) {
        const insights = typeof lead.ai_insights === 'string' 
          ? JSON.parse(lead.ai_insights) 
          : lead.ai_insights
        insights.enrichment = enrichment
        insights.enrichment_updated_at = new Date().toISOString()
        enrichmentData.ai_insights = insights
      } else {
        enrichmentData.ai_insights = {
          enrichment,
          enrichment_updated_at: new Date().toISOString(),
        }
      }

      // Update buying_power_score if available
      if (enrichment.buying_power_score) {
        enrichmentData.buying_power_score = enrichment.buying_power_score
      }

      const { error: updateError } = await supabase
        .from('leads')
        .update(enrichmentData)
        .eq('id', lead_id)

      if (updateError) {
        throw updateError
      }

      return NextResponse.json({
        success: true,
        enrichment,
        message: 'Lead enriched successfully',
      })
    } catch (error: any) {
      console.error('[API/Enrich] Error:', error)
      return NextResponse.json(
        {
          success: false,
          error: error.message || 'Failed to enrich lead',
        },
        { status: 500 }
      )
    }
  },
  {
    requireAuth: true,
    requireRole: ['builder', 'admin'],
    requirePermission: Permissions.LEAD_EDIT,
    rateLimit: 'api',
    auditAction: AuditActions.UPDATE,
    auditResourceType: AuditResourceTypes.LEAD,
  }
)

