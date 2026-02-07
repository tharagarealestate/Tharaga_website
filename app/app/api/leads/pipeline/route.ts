// =============================================
// LEADS PIPELINE API - KANBAN VIEW DATA
// Uses @supabase/ssr createServerClient (NOT deprecated auth-helpers)
// GET /api/leads/pipeline - No role restrictions
// =============================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

// =============================================
// GET - Fetch pipeline data (NO ROLE RESTRICTIONS)
// =============================================
export async function GET(request: NextRequest) {
  try {
    // Use the proper @supabase/ssr client (NOT deprecated auth-helpers)
    const supabase = await createClient()

    // Simple auth check - just get the user, NO ROLE RESTRICTIONS
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('[Pipeline API] Auth error:', authError?.message || 'No user')
      return NextResponse.json({
        success: false,
        error: 'Please log in to view pipeline',
        errorType: 'AUTH_REQUIRED'
      }, { status: 401, headers: corsHeaders })
    }

    // Admin check for showing all data
    const isAdmin = user.email === 'tharagarealestate@gmail.com'

    // Fetch pipeline data
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

    // Only filter by builder_id for non-admin users
    if (!isAdmin) {
      query = query.eq('builder_id', user.id)
    }

    const { data: pipelineData, error: pipelineError } = await query

    if (pipelineError) {
      console.error('[Pipeline API Error]:', pipelineError)
      return NextResponse.json({
        success: true,
        data: [],
        total: 0,
        is_admin: isAdmin,
        isEmpty: true
      }, { status: 200, headers: corsHeaders })
    }

    // If no pipeline data, return empty array (this is valid, not an error)
    if (!pipelineData || pipelineData.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        total: 0,
        is_admin: isAdmin,
        isEmpty: true
      }, { status: 200, headers: corsHeaders })
    }

    // Get lead_scores data to enrich pipeline items
    const leadIds = pipelineData.map(item => item.lead_id).filter(Boolean)

    // Try to get data from lead_scores
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

    // Also try to get from leads table as fallback
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

    // Enrich pipeline data with lead information
    const enrichedData = pipelineData.map(item => {
      const leadScore = leadScoresMap.get(item.lead_id)
      const lead = leadsMap.get(item.lead_id)
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
      is_admin: isAdmin,
      isEmpty: false
    }, { status: 200, headers: corsHeaders })

  } catch (error: any) {
    console.error('[Pipeline API Fatal Error]:', error)
    return NextResponse.json({
      success: true,
      data: [],
      total: 0,
      isEmpty: true,
      error: error.message
    }, { status: 200, headers: corsHeaders })
  }
}
