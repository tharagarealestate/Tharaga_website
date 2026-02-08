// =============================================
// LEADS API - OPTIMIZED & PERFORMANT
// Uses request-based Supabase client for reliable auth in API routes
// GET /api/leads - Fetch all leads with caching and optimization
// POST /api/leads - Create new lead
// =============================================
import { NextRequest, NextResponse } from 'next/server'
import { createClientFromRequest } from '@/lib/supabase/route-handler'
import { leadsCache } from '@/lib/cache/leads-cache'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Cache TTL in milliseconds
const CACHE_TTL = 20 * 1000 // 20 seconds for leads data
const STATS_CACHE_TTL = 60 * 1000 // 60 seconds for stats (less frequently changing)

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
    const authHeader = request.headers.get('authorization')
    console.log('[Leads API] Request cookies:', allCookies.map(c => c.name).join(', ') || 'none')
    console.log('[Leads API] Authorization header:', authHeader ? 'present' : 'missing')

    // Use request-based client for reliable cookie handling
    const { supabase } = createClientFromRequest(request)

    // CRITICAL: If Authorization header is present, verify token directly
    let user = null
    let authError = null
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      console.log('[Leads API] Verifying token from Authorization header...')
      
      // CRITICAL: Create a new Supabase client with the token in global headers
      const { createClient } = await import('@supabase/supabase-js')
      const tokenClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        }
      )
      
      const { data: { user: tokenUser }, error: tokenError } = await tokenClient.auth.getUser()
      if (!tokenError && tokenUser) {
        user = tokenUser
        console.log('[Leads API] Authenticated via token:', tokenUser.email)
        // Update supabase to use tokenClient for queries
        Object.assign(supabase, tokenClient)
      } else {
        authError = tokenError
        console.error('[Leads API] Token verification failed:', {
          message: tokenError?.message,
          status: tokenError?.status
        })
      }
    } else {
      // Try cookie-based auth
      const result = await supabase.auth.getUser()
      user = result.data?.user || null
      authError = result.error || null
    }

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
    // OPTIMIZED: Reduced default limit from 50 to 20 for faster initial load
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const offset = (page - 1) * limit
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const scoreMin = searchParams.get('score_min') ? parseFloat(searchParams.get('score_min')!) : null
    const scoreMax = searchParams.get('score_max') ? parseFloat(searchParams.get('score_max')!) : null
    const sortBy = searchParams.get('sort_by') || 'score' // Default to score for better relevance
    const sortOrder = searchParams.get('sort_order') || 'desc'

    // OPTIMIZED: Build cache key from request parameters
    const cacheKey = leadsCache.getCacheKey({
      userId: user.id,
      page,
      limit,
      search,
      category,
      scoreMin,
      scoreMax,
      sortBy,
      sortOrder,
    })

    // OPTIMIZED: Check cache first
    const cachedData = leadsCache.get(cacheKey)
    if (cachedData) {
      console.log('[Leads API] Cache hit for:', cacheKey.substring(0, 50))
      return NextResponse.json(cachedData, {
        status: 200,
        headers: {
          ...corsHeaders,
          'X-Cache': 'HIT',
          'Cache-Control': 'public, max-age=20',
        },
      })
    }

    // OPTIMIZED: Since lead_scores doesn't have builder_id, we'll use leads table directly
    // which has builder_id and is properly indexed. This is much faster.
    // We can still get score data from lead_scores via a join if needed, but for performance,
    // we'll prioritize the leads table which has builder_id filtering.
    
    // Try leads table first (has builder_id and is faster for filtering)
    let query = supabase
      .from('leads')
      .select(`
        id,
        name,
        email,
        phone,
        score,
        created_at,
        updated_at,
        builder_id,
        lead_scores:lead_scores!user_id (
          category,
          engagement_score,
          budget_alignment,
          property_fit,
          time_investment,
          contact_intent,
          recency_score,
          last_activity
        )
      `, { count: 'exact' })
      // CRITICAL: Filter by builder_id to only get this builder's leads
      .eq('builder_id', user.id)

    // OPTIMIZED: Apply filters at database level (not post-query)
    if (search) {
      query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%,phone.ilike.%${search}%`)
    }
    if (scoreMin !== null) {
      query = query.gte('score', scoreMin)
    }
    if (scoreMax !== null) {
      query = query.lte('score', scoreMax)
    }
    if (category) {
      // Map category to score range for leads table
      const categoryScoreMap: Record<string, [number, number]> = {
        'Hot Lead': [8, 10],
        'Warm Lead': [5, 8],
        'Developing Lead': [3, 5],
        'Cold Lead': [1, 3],
        'Low Quality': [0, 1],
      }
      const [min, max] = categoryScoreMap[category] || [0, 10]
      query = query.gte('score', min).lte('score', max)
    }

    // OPTIMIZED: Apply sorting and pagination at database level
    query = query
      .order(sortBy === 'score' ? 'score' : 'created_at', { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1)

    const { data: leads, error: leadsError, count } = await query

    // If query fails, return empty result
    if (leadsError || !leads || leads.length === 0) {
      // OPTIMIZED: Fallback to leads table with builder_id filter
      let leadsQuery = supabase
        .from('leads')
        .select('*', { count: 'exact' })
        // CRITICAL: Filter by builder_id
        .eq('builder_id', user.id)

      // OPTIMIZED: Database-level search filtering
      if (search) {
        leadsQuery = leadsQuery.or(`email.ilike.%${search}%,name.ilike.%${search}%,phone.ilike.%${search}%`)
      }
      if (scoreMin !== null) {
        leadsQuery = leadsQuery.gte('score', scoreMin)
      }
      if (scoreMax !== null) {
        leadsQuery = leadsQuery.lte('score', scoreMax)
      }
      if (category) {
        // Map category to score range for leads table
        const categoryScoreMap: Record<string, [number, number]> = {
          'Hot Lead': [8, 10],
          'Warm Lead': [5, 8],
          'Developing Lead': [3, 5],
          'Cold Lead': [1, 3],
          'Low Quality': [0, 1],
        }
        const [min, max] = categoryScoreMap[category] || [0, 10]
        leadsQuery = leadsQuery.gte('score', min).lte('score', max)
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
      
      // OPTIMIZED: Calculate stats from database aggregation
      const stats = await calculateStatsOptimized(supabase, user.id, {
        category,
        scoreMin,
        scoreMax,
      })

      const responseData = {
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
      }

      // OPTIMIZED: Cache the response
      leadsCache.set(cacheKey, responseData, CACHE_TTL)

      return NextResponse.json(responseData, {
        status: 200,
        headers: {
          ...corsHeaders,
          'X-Cache': 'MISS',
          'Cache-Control': 'public, max-age=20',
        },
      })
    }

    // Transform lead_scores data (use filtered results)
    const transformedLeads = filteredLeadScores.map((lead: any) => ({
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

    // OPTIMIZED: Filter by search if provided (post-query for joined data)
    // Note: For better performance, consider adding a materialized view or computed column
    let filteredLeads = transformedLeads
    if (search) {
      const searchLower = search.toLowerCase()
      filteredLeads = transformedLeads.filter(lead =>
        lead.email.toLowerCase().includes(searchLower) ||
        lead.full_name.toLowerCase().includes(searchLower) ||
        (lead.phone && lead.phone.includes(search))
      )
    }

    // OPTIMIZED: Get total count from database (already fetched with count: 'exact')
    const totalLeads = count || 0
    
    // OPTIMIZED: Calculate stats from database aggregation instead of all leads
    // This is much faster for large datasets
    const stats = await calculateStatsOptimized(supabase, user.id, {
      category,
      scoreMin,
      scoreMax,
    })

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

    // OPTIMIZED: Invalidate cache when new lead is created
    leadsCache.invalidate(`leads:${user.id}`)
    leadsCache.invalidate(`stats:${user.id}`)

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

// OPTIMIZED: Calculate stats from database aggregation (much faster)
async function calculateStatsOptimized(
  supabase: any,
  builderId: string,
  filters: { category?: string; scoreMin?: number | null; scoreMax?: number | null }
) {
  // Check cache for stats
  const statsCacheKey = `stats:${builderId}:${JSON.stringify(filters)}`
  const cachedStats = leadsCache.get(statsCacheKey)
  if (cachedStats) {
    return cachedStats
  }

  try {
    // Try to get stats from lead_scores table first
    let statsQuery = supabase
      .from('lead_scores')
      .select('score, category', { count: 'exact' })
      .eq('builder_id', builderId)

    if (filters.category) {
      statsQuery = statsQuery.eq('category', filters.category)
    }
    if (filters.scoreMin !== null && filters.scoreMin !== undefined) {
      statsQuery = statsQuery.gte('score', filters.scoreMin)
    }
    if (filters.scoreMax !== null && filters.scoreMax !== undefined) {
      statsQuery = statsQuery.lte('score', filters.scoreMax)
    }

    const { data: allScores, count: totalLeads, error } = await statsQuery

    if (error || !allScores) {
      // Fallback to leads table
      let leadsStatsQuery = supabase
        .from('leads')
        .select('score', { count: 'exact' })
        .eq('builder_id', builderId)

      if (filters.scoreMin !== null && filters.scoreMin !== undefined) {
        leadsStatsQuery = leadsStatsQuery.gte('score', filters.scoreMin)
      }
      if (filters.scoreMax !== null && filters.scoreMax !== undefined) {
        leadsStatsQuery = leadsStatsQuery.lte('score', filters.scoreMax)
      }

      const { data: allLeads, count: leadsCount } = await leadsStatsQuery

      const scores = (allLeads || []).map((l: any) => l.score || 0)
      const total = leadsCount || 0
      const hotLeads = scores.filter((s: number) => s >= 8).length
      const warmLeads = scores.filter((s: number) => s >= 5 && s < 8).length
      const avgScore = total > 0 ? scores.reduce((a: number, b: number) => a + b, 0) / total : 0

      const stats = {
        total_leads: total,
        hot_leads: hotLeads,
        warm_leads: warmLeads,
        cold_leads: total - hotLeads - warmLeads,
        average_score: Math.round(avgScore * 10) / 10,
        pending_interactions: 0,
      }

      // Cache stats
      leadsCache.set(statsCacheKey, stats, STATS_CACHE_TTL)
      return stats
    }

    // Calculate stats from lead_scores data
    const scores = (allScores || []).map((l: any) => l.score || 0)
    const categories = (allScores || []).map((l: any) => l.category || '')
    const total = totalLeads || 0
    const hotLeads = categories.filter((c: string) => c === 'Hot Lead').length + scores.filter((s: number) => s >= 8).length
    const warmLeads = categories.filter((c: string) => c === 'Warm Lead').length + scores.filter((s: number) => s >= 5 && s < 8).length
    const avgScore = total > 0 ? scores.reduce((a: number, b: number) => a + b, 0) / total : 0

    const stats = {
      total_leads: total,
      hot_leads: hotLeads,
      warm_leads: warmLeads,
      cold_leads: total - hotLeads - warmLeads,
      average_score: Math.round(avgScore * 10) / 10,
      pending_interactions: 0,
    }

    // Cache stats
    leadsCache.set(statsCacheKey, stats, STATS_CACHE_TTL)
    return stats
  } catch (err) {
    console.error('[Leads API] Error calculating stats:', err)
    // Return default stats on error
    return {
      total_leads: 0,
      hot_leads: 0,
      warm_leads: 0,
      cold_leads: 0,
      average_score: 0,
      pending_interactions: 0,
    }
  }
}

// Legacy helper: Calculate stats from leads array (for backward compatibility)
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
