// =============================================
// ZOHO CRM DASHBOARD DATA API
// Uses request-based Supabase client for reliable auth
// GET /api/crm/zoho/dashboard-data - No role restrictions
// Returns real Zoho data or empty state (NO MOCK DATA)
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

// Empty data structure - NO MOCK DATA, just structure
const getEmptyData = (message: string) => ({
  connected: false,
  success: true,
  message,
  stats: {
    total_contacts: 0,
    new_contacts_this_month: 0,
    active_deals: 0,
    deal_value: 0,
    conversion_rate: 0
  },
  contacts: [],
  deals: []
})

// =============================================
// GET - Fetch CRM dashboard data (NO ROLE RESTRICTIONS)
// =============================================
export async function GET(request: NextRequest) {
  try {
    // Use request-based client for reliable cookie handling
    const { supabase } = createClientFromRequest(request)

    // Simple auth check - just get the user, NO ROLE RESTRICTIONS
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('[CRM Dashboard API] Auth error:', authError?.message || 'No user')
      return NextResponse.json({
        success: false,
        error: 'Please log in to view CRM data',
        errorType: 'AUTH_REQUIRED'
      }, { status: 401, headers: corsHeaders })
    }

    // Check if Zoho CRM is connected - try multiple possible schemas
    let integration = null

    // Try with builder_id column first
    try {
      const { data } = await supabase
        .from('integrations')
        .select('*')
        .eq('builder_id', user.id)
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
          .eq('type', 'crm')
          .single()
        integration = data
      } catch (e) {
        // No integration found
      }
    }

    // If not connected or no integration, return empty data with clear message
    if (!integration || !integration.is_connected) {
      return NextResponse.json({
        ...getEmptyData('Zoho CRM not connected. Click "Connect Zoho CRM" to sync your leads and deals.'),
        connected: false,
        needs_connection: true,
      }, { status: 200, headers: corsHeaders })
    }

    // Check if we have valid tokens
    const hasValidTokens = integration.access_token && integration.refresh_token

    if (!hasValidTokens) {
      return NextResponse.json({
        ...getEmptyData('Zoho CRM session expired. Please reconnect to continue syncing.'),
        connected: true,
        needs_reconnection: true,
      }, { status: 200, headers: corsHeaders })
    }

    // TODO: Fetch real data from Zoho API
    // For now, return connected state with empty data until real sync is implemented
    return NextResponse.json({
      connected: true,
      success: true,
      message: 'Zoho CRM connected. Sync your data to see leads and deals here.',
      account: {
        id: integration.crm_account_id || null,
        name: integration.crm_account_name || 'Zoho CRM Account',
      },
      last_sync: integration.last_sync_at || null,
      stats: {
        total_contacts: 0,
        new_contacts_this_month: 0,
        active_deals: 0,
        deal_value: 0,
        conversion_rate: 0
      },
      contacts: [],
      deals: []
    }, { status: 200, headers: corsHeaders })

  } catch (error: any) {
    console.error('[CRM Dashboard Data Error]:', error)

    // Return empty data with error message
    return NextResponse.json({
      ...getEmptyData('Failed to fetch CRM data. Please try again.'),
      error: true,
      errorMessage: error.message
    }, { status: 200, headers: corsHeaders })
  }
}
