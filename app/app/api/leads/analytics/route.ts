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

      // Get all leads for this builder
      const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select(`
          id,
          status,
          score,
          budget,
          source,
          created_at,
          updated_at
        `)
        .eq('builder_id', user.id)

      if (leadsError) {
        throw leadsError
      }

      const leadsList = leads || []

      // Get interactions separately
      const { data: interactions, error: interactionsError } = await supabase
        .from('lead_interactions')
        .select('id, lead_id, response_time_minutes, timestamp')
        .in('lead_id', leadsList.map(l => l.id))
        .eq('builder_id', user.id)

      if (interactionsError) {
        console.warn('Failed to fetch interactions:', interactionsError)
      }

      // Calculate conversion rate
      const converted = leadsList.filter(l => l.status === 'converted').length
      const conversion_rate = leadsList.length > 0 
        ? (converted / leadsList.length) * 100 
        : 0

      // Calculate average response time (from interactions)
      const responseTimes = (interactions || [])
        .filter(i => i.response_time_minutes !== null && i.response_time_minutes !== undefined)
        .map(i => Number(i.response_time_minutes))
      
      const avg_response_time = responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length / 60 // Convert to hours
        : 0

      // Calculate total pipeline value
      const total_value = leadsList
        .filter(l => l.status !== 'lost' && l.budget)
        .reduce((sum, l) => sum + (Number(l.budget) || 0), 0)

      // Leads by source
      const sourceMap = new Map<string, number>()
      leadsList.forEach(lead => {
        const source = lead.source || 'Unknown'
        sourceMap.set(source, (sourceMap.get(source) || 0) + 1)
      })
      
      const totalLeads = leadsList.length
      const leads_by_source = Array.from(sourceMap.entries())
        .map(([source, count]) => ({
          source,
          count,
          percentage: totalLeads > 0 ? (count / totalLeads) * 100 : 0,
        }))
        .sort((a, b) => b.count - a.count)

      // Leads by status
      const statusMap = new Map<string, number>()
      leadsList.forEach(lead => {
        const status = lead.status || 'new'
        statusMap.set(status, (statusMap.get(status) || 0) + 1)
      })
      
      const leads_by_status = Array.from(statusMap.entries())
        .map(([status, count]) => ({
          status,
          count,
          percentage: totalLeads > 0 ? (count / totalLeads) * 100 : 0,
        }))
        .sort((a, b) => b.count - a.count)

      // Conversion funnel
      const funnelStages = [
        { stage: 'New', status: 'new' },
        { stage: 'Contacted', status: 'contacted' },
        { stage: 'Qualified', status: 'qualified' },
        { stage: 'Converted', status: 'converted' },
      ]
      
      const conversion_funnel = funnelStages.map(({ stage, status }) => {
        const count = leadsList.filter(l => l.status === status).length
        return {
          stage,
          count,
          percentage: totalLeads > 0 ? (count / totalLeads) * 100 : 0,
        }
      })

      // Calculate trends (simplified - compare last 30 days vs previous 30 days)
      const now = new Date()
      const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      const prev30Days = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

      const recentLeads = leadsList.filter(l => 
        new Date(l.created_at) >= last30Days
      )
      const previousLeads = leadsList.filter(l => {
        const created = new Date(l.created_at)
        return created >= prev30Days && created < last30Days
      })

      const recentConverted = recentLeads.filter(l => l.status === 'converted').length
      const prevConverted = previousLeads.filter(l => l.status === 'converted').length
      
      const recentRate = recentLeads.length > 0 ? (recentConverted / recentLeads.length) * 100 : 0
      const prevRate = previousLeads.length > 0 ? (prevConverted / previousLeads.length) * 100 : 0

      const conversion_trend = recentRate > prevRate ? 'up' : 
                               recentRate < prevRate ? 'down' : 'stable'

      // Response time trend (simplified)
      const response_time_trend = 'stable' // Could be calculated from historical data

      // Value trend
      const recentValue = recentLeads
        .filter(l => l.status !== 'lost' && l.budget)
        .reduce((sum, l) => sum + (Number(l.budget) || 0), 0)
      const prevValue = previousLeads
        .filter(l => l.status !== 'lost' && l.budget)
        .reduce((sum, l) => sum + (Number(l.budget) || 0), 0)

      const value_trend = recentValue > prevValue ? 'up' :
                         recentValue < prevValue ? 'down' : 'stable'

      return NextResponse.json({
        success: true,
        conversion_rate,
        conversion_trend,
        avg_response_time,
        response_time_trend,
        total_value,
        value_trend,
        leads_by_source,
        leads_by_status,
        conversion_funnel,
      })
    } catch (error: any) {
      console.error('[API/Analytics] Error:', error)
      return NextResponse.json(
        {
          success: false,
          error: error.message || 'Failed to fetch analytics',
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

