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
      const isAdmin = user.role === 'admin' || user.email === 'tharagarealestate@gmail.com'

      // Build query - admins see ALL pipeline leads, builders see only their own
      let query = supabase
        .from('lead_pipeline')
        .select(`
          id,
          lead_id,
          stage,
          position,
          created_at,
          updated_at,
          notes,
          expected_close_date,
          lead:leads (
            id,
            name,
            email,
            phone,
            score,
            category,
            budget_min,
            budget_max,
            preferred_location,
            preferred_property_type,
            created_at,
            last_activity
          )
        `)
        .order('position', { ascending: true })

      // CRITICAL: Only filter by builder_id for non-admin users
      if (!isAdmin) {
        query = query.eq('builder_id', user.id)
      }

      const { data: pipelineData, error } = await query

      if (error) {
        console.error('[Pipeline API Error]:', error)
        return NextResponse.json({
          success: false,
          error: 'Database error',
          message: error.message,
          errorType: 'DATABASE_ERROR'
        }, { status: 500 })
      }

      // Group leads by stage
      const pipelineByStage = {
        new: [],
        contacted: [],
        qualified: [],
        proposal: [],
        negotiation: [],
        closed_won: [],
        closed_lost: []
      }

      if (pipelineData) {
        pipelineData.forEach((item: any) => {
          const stage = item.stage || 'new'
          if (pipelineByStage[stage as keyof typeof pipelineByStage]) {
            pipelineByStage[stage as keyof typeof pipelineByStage].push(item)
          }
        })
      }

      return NextResponse.json({
        success: true,
        data: {
          pipeline: pipelineByStage,
          total: pipelineData?.length || 0,
          is_admin: isAdmin
        }
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
