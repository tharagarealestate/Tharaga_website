// =============================================
// ZOHO INTEGRATION STATUS API
// Uses request-based Supabase client for reliable auth
// GET /api/crm/zoho/status - No role restrictions
// =============================================
import { NextRequest, NextResponse } from 'next/server'
import { createClientFromRequest } from '@/lib/supabase/route-handler'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

// =============================================
// GET - Fetch Zoho integration status (NO ROLE RESTRICTIONS)
// =============================================
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    console.log('[Zoho Status API] Authorization header:', authHeader ? 'present' : 'missing')

    // Use request-based client for reliable cookie handling
    let { supabase } = createClientFromRequest(request)

    // CRITICAL: If Authorization header is present, verify token directly
    let user = null
    let authError = null

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      console.log('[Zoho Status API] Verifying token from Authorization header...')

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
        console.log('[Zoho Status API] Authenticated via token:', tokenUser.email)
        supabase = tokenClient as any
      } else {
        authError = tokenError
        console.error('[Zoho Status API] Token verification failed:', tokenError?.message)
      }
    } else {
      // Try cookie-based auth
      const result = await supabase.auth.getUser()
      user = result.data?.user || null
      authError = result.error || null
    }

    if (authError || !user) {
      console.error('[Zoho Status API] Auth error:', authError?.message || 'No user')
      return NextResponse.json({
        connected: false,
        active: false,
        success: false,
        error: 'Please log in to check Zoho status',
        errorType: 'AUTH_REQUIRED'
      }, { status: 401, headers: corsHeaders })
    }

    // Try to get integration with different column names
    let integration = null

    // Try with builder_id column first
    try {
      const { data } = await supabase
        .from('integrations')
        .select('*')
        .eq('builder_id', user.id)
        .eq('integration_type', 'crm')
        .eq('provider', 'zoho')
        .single()
      integration = data
    } catch (e) {
      // Table might not have builder_id column
    }

    // Try with user_id column
    if (!integration) {
      try {
        const { data } = await supabase
          .from('integrations')
          .select('*')
          .eq('user_id', user.id)
          .eq('provider', 'zoho')
          .single()
        integration = data
      } catch (e) {
        // No integration found
      }
    }

    // If no integration found, return not connected status
    if (!integration) {
      return NextResponse.json({
        connected: false,
        active: false,
        success: true,
        message: 'Zoho CRM not connected. Click "Connect Now" to set up.',
      }, { status: 200, headers: corsHeaders })
    }

    // Get sync statistics if available
    let syncStats: any[] = []
    let mappedRecords = 0
    let fieldMappings = 0

    try {
      const { data } = await supabase
        .from('crm_sync_log')
        .select('status, sync_started_at')
        .eq('integration_id', integration.id)
        .order('sync_started_at', { ascending: false })
        .limit(100)
      syncStats = data || []
    } catch (e) {
      // Table might not exist
    }

    try {
      const { count } = await supabase
        .from('crm_record_mappings')
        .select('*', { count: 'exact', head: true })
        .eq('integration_id', integration.id)
      mappedRecords = count || 0
    } catch (e) {
      // Table might not exist
    }

    try {
      const { count } = await supabase
        .from('crm_field_mappings')
        .select('*', { count: 'exact', head: true })
        .eq('integration_id', integration.id)
        .eq('is_active', true)
      fieldMappings = count || 0
    } catch (e) {
      // Table might not exist
    }

    // Calculate health score
    const recentSyncs = syncStats.filter((s: any) => {
      if (!s.sync_started_at) return false
      const syncDate = new Date(s.sync_started_at)
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
      return syncDate > dayAgo
    })

    const successRate = recentSyncs.length > 0
      ? (recentSyncs.filter((s: any) => s.status === 'success').length / recentSyncs.length) * 100
      : 100

    let health = 'excellent'
    if (successRate < 50) health = 'poor'
    else if (successRate < 80) health = 'fair'
    else if (successRate < 95) health = 'good'

    return NextResponse.json({
      connected: integration.is_connected || integration.connected || false,
      active: integration.is_active || integration.active || false,
      health,
      account: {
        id: integration.crm_account_id || null,
        name: integration.crm_account_name || null,
      },
      sync: {
        last_sync: integration.last_sync_at || null,
        success_rate: Math.round(successRate),
        recent_syncs: recentSyncs.length,
      },
      statistics: {
        total_syncs: integration.total_actions || 0,
        successful_syncs: integration.successful_actions || 0,
        failed_syncs: integration.failed_actions || 0,
        mapped_records: mappedRecords,
        field_mappings: fieldMappings,
      },
      last_error: integration.last_error || null,
      created_at: integration.created_at || null,
      updated_at: integration.updated_at || null,
      success: true,
    }, { status: 200, headers: corsHeaders })

  } catch (error: any) {
    console.error('Error fetching Zoho status:', error)
    return NextResponse.json({
      connected: false,
      active: false,
      success: true,
      message: 'Could not check Zoho status',
      error: error.message,
    }, { status: 200, headers: corsHeaders })
  }
}
