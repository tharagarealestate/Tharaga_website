// =============================================
// LEADS PIPELINE API - KANBAN VIEW DATA
// GET /api/leads/pipeline
// =============================================
import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { secureApiRoute } from '@/lib/security/api-security'
import { Permissions } from '@/lib/security/permissions'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Handle OPTIONS for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  })
}

// Secure GET handler with authentication
export const GET = secureApiRoute(
  async (request: NextRequest, user) => {
    const supabase = createRouteHandlerClient({ cookies })

    try {
      // CRITICAL FIX: Trust the user.role from secureApiRoute wrapper (includes email override)
      // Admin sees ALL pipeline leads, builders see only their own
      const isAdmin = user.role === 'admin' || user.email === 'tharagarealestate@gmail.com'

      // CRITICAL FIX: lead_pipeline.lead_id references lead_scores table, NOT leads table
      // The join syntax `leads!lead_id` is WRONG - it should be `lead_scores!lead_id`
      // However, the foreign key constraint was set up with lead_scores, so we use a two-step approach

      // Step 1: Get pipeline data without complex joins (they fail due to schema mismatch)
      let query = supabase
        .from('lead_pipeline')
        .select(`
          id,
          lead_id,
          builder_id,
          stage,
          stage_order,
          entered_stage_at,
          days_in_stage,
          deal_value,
          expected_close_date,
          probability,
          last_activity_at,
          last_activity_type,
          next_followup_date,
          notes,
          loss_reason,
          loss_details,
          created_at,
          updated_at,
          closed_at
        `)
        .order('stage_order', { ascending: true })
        .order('entered_stage_at', { ascending: false })

      // CRITICAL: Only filter by builder_id for non-admin users
      if (!isAdmin) {
        query = query.eq('builder_id', user.id)
      }

      const { data: pipelineData, error: pipelineError } = await query

      if (pipelineError) {
        console.error('[Pipeline API Error]:', pipelineError)
        return NextResponse.json({
          success: false,
          error: 'Database error',
          message: pipelineError.message,
          errorType: 'DATABASE_ERROR'
        }, { status: 500 })
      }

      // If no pipeline data, return empty array (this is valid, not an error)
      if (!pipelineData || pipelineData.length === 0) {
        return NextResponse.json({
          success: true,
          data: [],
          total: 0,
          is_admin: isAdmin
        }, { status: 200 })
      }

      // Step 2: Get lead_scores data to enrich pipeline items
      const leadIds = pipelineData.map(item => item.lead_id).filter(Boolean)

      // Try to get data from lead_scores (the correct foreign key target)
      const { data: leadScores } = await supabase
        .from('lead_scores')
        .select(`
          id,
          user_id,
          score,
          category,
          last_activity,
          profile:profiles!user_id (
            email,
            full_name,
            phone
          )
        `)
        .in('id', leadIds)

      // Also try to get from leads table as fallback (in case some lead_ids reference leads)
      const { data: leadsData } = await supabase
        .from('leads')
        .select('id, name, email, phone, score, status')
        .in('id', leadIds)

      // Create lookup maps for efficient enrichment
      const leadScoresMap = new Map(
        (leadScores || []).map(ls => [ls.id, ls])
      )
      const leadsMap = new Map(
        (leadsData || []).map(l => [l.id, l])
      )

      // Step 3: Enrich pipeline data with lead information
      const enrichedData = pipelineData.map(item => {
        const leadScore = leadScoresMap.get(item.lead_id)
        const lead = leadsMap.get(item.lead_id)

        // Prefer lead_scores data, fallback to leads table
        const profile = leadScore?.profile

        return {
          ...item,
          lead: {
            id: item.lead_id,
            category: leadScore?.category || 'Unknown',
            score: leadScore?.score || lead?.score || 0,
            last_activity: leadScore?.last_activity,
            user: profile ? {
              email: profile.email,
              full_name: profile.full_name,
              phone: profile.phone
            } : lead ? {
              email: lead.email,
              full_name: lead.name,
              phone: lead.phone
            } : null
          }
        }
      })

      return NextResponse.json({
        success: true,
        data: enrichedData,
        total: enrichedData.length,
        is_admin: isAdmin
      }, { status: 200 })

    } catch (error: any) {
      console.error('[Pipeline API Fatal Error]:', error)
      return NextResponse.json({
        success: false,
        error: 'Internal server error',
        message: error.message || 'Failed to fetch pipeline data',
        errorType: 'SERVER_ERROR'
      }, { status: 500 })
    }
  },
  {
    requireAuth: true,
    requireRole: ['builder', 'admin'],
    requirePermission: Permissions.LEAD_VIEW,
    rateLimit: 'api'
  }
)
