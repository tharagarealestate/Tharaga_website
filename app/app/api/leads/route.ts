// =============================================
// LEADS API - SIMPLIFIED & ROBUST
// Uses request-based Supabase client for reliable auth in API routes
// GET /api/leads - Fetch all leads
// POST /api/leads - Create new lead
// =============================================
import { NextRequest, NextResponse } from 'next/server'
import { createClientFromRequest } from '@/lib/supabase/route-handler'

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
// GET - Fetch leads with filtering
// =============================================
export async function GET(request: NextRequest) {
  try {
    // Debug: Log all cookies from request
    const allCookies = request.cookies.getAll()
    console.log('[Leads API] Request cookies:', allCookies.map(c => c.name).join(', ') || 'none')

    // Use request-based client for reliable cookie handling
    const { supabase } = createClientFromRequest(request)

    // Simple auth check - just get the user, NO ROLE RESTRICTIONS
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('[Leads API] Auth error:', authError?.message || 'No user', '| Cookies received:', allCookies.length)
      return NextResponse.json({
        success: false,
        error: 'Please log in to view leads',
        errorType: 'AUTH_REQUIRED',
        debug: {
          cookieCount: allCookies.length,
          authError: authError?.message || 'No user session'
        }
      }, { status: 401, headers: corsHeaders })
    }

    console.log('[Leads API] Authenticated user:', user.email)

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = (page - 1) * limit
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const scoreMin = searchParams.get('score_min') ? parseFloat(searchParams.get('score_min')!) : null
    const scoreMax = searchParams.get('score_max') ? parseFloat(searchParams.get('score_max')!) : null
    const sortBy = searchParams.get('sort_by') || 'created_at'
    const sortOrder = searchParams.get('sort_order') || 'desc'

    // Build query - try lead_scores table first (has scoring data)
    let query = supabase
      .from('lead_scores')
      .select(`
        id,
        user_id,
        score,
        category,
        engagement_score,
        budget_alignment,
        property_fit,
        time_investment,
        contact_intent,
        recency_score,
        last_activity,
        created_at,
        updated_at,
        profile:profiles!user_id (
          id,
          email,
          full_name,
          phone,
          avatar_url
        )
      `, { count: 'exact' })

    // Apply category filter
    if (category) {
      query = query.eq('category', category)
    }
    if (scoreMin !== null) {
      query = query.gte('score', scoreMin)
    }
    if (scoreMax !== null) {
      query = query.lte('score', scoreMax)
    }

    // Apply sorting and pagination
    query = query
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1)

    const { data: leadScores, error: leadScoresError, count } = await query

    // If lead_scores fails or is empty, try the leads table
    if (leadScoresError || !leadScores || leadScores.length === 0) {
      // Fallback to leads table
      let leadsQuery = supabase
        .from('leads')
        .select('*', { count: 'exact' })

      if (search) {
        leadsQuery = leadsQuery.or(`email.ilike.%${search}%,name.ilike.%${search}%,phone.ilike.%${search}%`)
      }
      if (scoreMin !== null) {
        leadsQuery = leadsQuery.gte('score', scoreMin)
      }
      if (scoreMax !== null) {
        leadsQuery = leadsQuery.lte('score', scoreMax)
      }

      leadsQuery = leadsQuery
        .order(sortBy === 'score' ? 'score' : 'created_at', { ascending: sortOrder === 'asc' })
        .range(offset, offset + limit - 1)

      const { data: leads, error: leadsError, count: leadsCount } = await leadsQuery

      if (leadsError) {
        console.error('[Leads API] Error fetching leads:', leadsError)
        return NextResponse.json({
          success: true,
          data: [],
          pagination: { page, limit, total: 0, totalPages: 0 },
          stats: { total_leads: 0, hot_leads: 0, warm_leads: 0, average_score: 0 },
          isEmpty: true
        }, { status: 200, headers: corsHeaders })
      }

      // Transform leads data
      const transformedLeads = (leads || []).map(lead => ({
        id: lead.id,
        email: lead.email || '',
        full_name: lead.name || lead.email?.split('@')[0] || 'Unknown',
        phone: lead.phone || null,
        score: lead.score || 0,
        category: getCategory(lead.score || 0),
        created_at: lead.created_at,
        last_activity: lead.updated_at || lead.created_at,
        score_breakdown: {
          budget_alignment: 0,
          engagement: 0,
          property_fit: 0,
          time_investment: 0,
          contact_intent: 0,
          recency: 0
        }
      }))

      const totalLeads = leadsCount || 0
      const stats = calculateStats(transformedLeads)

      return NextResponse.json({
        success: true,
        data: transformedLeads,
        pagination: {
          page,
          limit,
          total: totalLeads,
          totalPages: Math.ceil(totalLeads / limit)
        },
        stats,
        isEmpty: transformedLeads.length === 0
      }, { status: 200, headers: corsHeaders })
    }

    // Transform lead_scores data
    const transformedLeads = leadScores.map(lead => ({
      id: lead.id,
      email: lead.profile?.email || '',
      full_name: lead.profile?.full_name || lead.profile?.email?.split('@')[0] || 'Unknown',
      phone: lead.profile?.phone || null,
      avatar_url: lead.profile?.avatar_url || null,
      score: lead.score || 0,
      category: lead.category || getCategory(lead.score || 0),
      created_at: lead.created_at,
      last_activity: lead.last_activity || lead.updated_at,
      score_breakdown: {
        budget_alignment: lead.budget_alignment || 0,
        engagement: lead.engagement_score || 0,
        property_fit: lead.property_fit || 0,
        time_investment: lead.time_investment || 0,
        contact_intent: lead.contact_intent || 0,
        recency: lead.recency_score || 0
      }
    }))

    // Filter by search if provided (post-query since join doesn't support ilike)
    let filteredLeads = transformedLeads
    if (search) {
      const searchLower = search.toLowerCase()
      filteredLeads = transformedLeads.filter(lead =>
        lead.email.toLowerCase().includes(searchLower) ||
        lead.full_name.toLowerCase().includes(searchLower) ||
        (lead.phone && lead.phone.includes(search))
      )
    }

    const totalLeads = count || 0
    const stats = calculateStats(filteredLeads)

    return NextResponse.json({
      success: true,
      data: filteredLeads,
      pagination: {
        page,
        limit,
        total: totalLeads,
        totalPages: Math.ceil(totalLeads / limit)
      },
      stats,
      isEmpty: filteredLeads.length === 0
    }, { status: 200, headers: corsHeaders })

  } catch (error: any) {
    console.error('[Leads API] Unexpected error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch leads',
      message: error.message,
      errorType: 'SERVER_ERROR'
    }, { status: 500, headers: corsHeaders })
  }
}

// =============================================
// POST - Create new lead
// =============================================
export async function POST(request: NextRequest) {
  try {
    // Use request-based client for reliable cookie handling
    const { supabase } = createClientFromRequest(request)

    // Simple auth check - NO ROLE RESTRICTIONS
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Please log in to create leads'
      }, { status: 401, headers: corsHeaders })
    }

    const body = await request.json()
    const { name, email, phone, message, property_id, score } = body

    if (!email) {
      return NextResponse.json({
        success: false,
        error: 'Email is required'
      }, { status: 400, headers: corsHeaders })
    }

    // Insert into leads table
    const { data: lead, error: insertError } = await supabase
      .from('leads')
      .insert({
        name: name || email.split('@')[0],
        email,
        phone,
        message,
        property_id,
        score: score || 5,
        builder_id: user.id
      })
      .select()
      .single()

    if (insertError) {
      console.error('[Leads API] Insert error:', insertError)
      return NextResponse.json({
        success: false,
        error: 'Failed to create lead',
        message: insertError.message
      }, { status: 500, headers: corsHeaders })
    }

    return NextResponse.json({
      success: true,
      data: lead,
      message: 'Lead created successfully'
    }, { status: 201, headers: corsHeaders })

  } catch (error: any) {
    console.error('[Leads API] POST error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to create lead',
      message: error.message
    }, { status: 500, headers: corsHeaders })
  }
}

// Helper: Calculate stats from leads
function calculateStats(leads: any[]) {
  const totalLeads = leads.length
  const hotLeads = leads.filter(l => l.score >= 8 || l.category?.toLowerCase().includes('hot')).length
  const warmLeads = leads.filter(l => (l.score >= 5 && l.score < 8) || l.category?.toLowerCase().includes('warm')).length
  const avgScore = totalLeads > 0
    ? leads.reduce((sum, l) => sum + (l.score || 0), 0) / totalLeads
    : 0

  return {
    total_leads: totalLeads,
    hot_leads: hotLeads,
    warm_leads: warmLeads,
    cold_leads: totalLeads - hotLeads - warmLeads,
    average_score: Math.round(avgScore * 10) / 10,
    pending_interactions: 0
  }
}

// Helper: Get category from score
function getCategory(score: number): string {
  if (score >= 9) return 'Hot Lead'
  if (score >= 7) return 'Warm Lead'
  if (score >= 5) return 'Developing Lead'
  if (score >= 3) return 'Cold Lead'
  return 'Low Quality'
}
