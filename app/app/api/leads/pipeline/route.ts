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

      // Build query with proper admin bypass
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
          closed_at,
          lead:leads!lead_id (
            id,
            category,
            score,
            user:user_id (
              email,
              full_name,
              phone
            )
          )
        `)
        .order('stage_order', { ascending: true })
        .order('entered_stage_at', { ascending: false })

      // CRITICAL: Only filter by builder_id for non-admin users
      if (!isAdmin) {
        query = query.eq('builder_id', user.id)
      }

      const { data, error } = await query

      if (error) {
        console.error('[Pipeline API Error]:', error)
        return NextResponse.json({
          success: false,
          error: 'Database error',
          message: error.message,
          errorType: 'DATABASE_ERROR'
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        data: data || [],
        total: data?.length || 0,
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
