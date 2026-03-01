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
    const authHeader = request.headers.get('authorization')
    console.log('[CRM Dashboard API] Authorization header:', authHeader ? 'present' : 'missing')
    
    // Use request-based client for reliable cookie handling
    const { supabase } = createClientFromRequest(request)

    // CRITICAL: If Authorization header is present, verify token directly
    let user = null
    let authError = null
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      console.log('[CRM Dashboard API] Verifying token from Authorization header...')
      
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
        console.log('[CRM Dashboard API] Authenticated via token:', tokenUser.email)
        Object.assign(supabase, tokenClient)
      } else {
        authError = tokenError
        console.error('[CRM Dashboard API] Token verification failed:', {
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

    // Get tokens from config
    const config = integration.config as any
    const accessToken = config?.access_token
    const refreshToken = config?.refresh_token
    const apiDomain = config?.api_domain || 'https://www.zohoapis.in'
    const expiresAt = config?.expires_at ? new Date(config.expires_at) : null

    // Check if token is expired and needs refresh
    if (!accessToken || !refreshToken) {
      return NextResponse.json({
        ...getEmptyData('Zoho CRM session expired. Please reconnect to continue syncing.'),
        connected: true,
        needs_reconnection: true,
      }, { status: 200, headers: corsHeaders })
    }

    // Check if token needs refresh (5 minutes buffer)
    if (expiresAt && expiresAt.getTime() - Date.now() < 300000) {
      // Token expired or expiring soon - mark for reconnection
      return NextResponse.json({
        ...getEmptyData('Zoho CRM session expired. Please reconnect to continue syncing.'),
        connected: true,
        needs_reconnection: true,
      }, { status: 200, headers: corsHeaders })
    }

    // Fetch real data from Zoho API
    try {
      const { zohoClient } = await import('@/lib/integrations/crm/zohoClient')
      
      // Fetch contacts
      let contacts: any[] = []
      let totalContacts = 0
      let newContactsThisMonth = 0
      
      try {
        const contactsResponse = await fetch(
          `${apiDomain}/crm/v2/Contacts?per_page=100&sort_by=Created_Time&sort_order=desc`,
          {
            headers: {
              'Authorization': `Zoho-oauthtoken ${accessToken}`,
              'Content-Type': 'application/json',
            },
          }
        )
        
        if (contactsResponse.ok) {
          const contactsData = await contactsResponse.json()
          contacts = (contactsData.data || []).slice(0, 50) // Limit to 50 for display
          totalContacts = contactsData.info?.count || contacts.length
          
          // Count new contacts this month
          const thisMonth = new Date()
          thisMonth.setDate(1)
          thisMonth.setHours(0, 0, 0, 0)
          
          newContactsThisMonth = contacts.filter((contact: any) => {
            const createdTime = new Date(contact.Created_Time)
            return createdTime >= thisMonth
          }).length
        }
      } catch (contactsError) {
        console.error('[CRM Dashboard] Error fetching contacts:', contactsError)
      }

      // Fetch deals
      let deals: any[] = []
      let activeDeals = 0
      let dealValue = 0
      
      try {
        const dealsResponse = await fetch(
          `${apiDomain}/crm/v2/Deals?per_page=100&sort_by=Created_Time&sort_order=desc`,
          {
            headers: {
              'Authorization': `Zoho-oauthtoken ${accessToken}`,
              'Content-Type': 'application/json',
            },
          }
        )
        
        if (dealsResponse.ok) {
          const dealsData = await dealsResponse.json()
          deals = (dealsData.data || []).slice(0, 50) // Limit to 50 for display
          
          // Calculate active deals and total value
          deals.forEach((deal: any) => {
            const stage = deal.Stage || ''
            const isActive = !stage.includes('Closed') && !stage.includes('Lost')
            if (isActive) {
              activeDeals++
              dealValue += parseFloat(deal.Amount || 0)
            }
          })
        }
      } catch (dealsError) {
        console.error('[CRM Dashboard] Error fetching deals:', dealsError)
      }

      // Calculate conversion rate
      const totalDeals = deals.length
      const closedWonDeals = deals.filter((deal: any) => 
        (deal.Stage || '').includes('Closed Won') || (deal.Stage || '').includes('Won')
      ).length
      const conversionRate = totalDeals > 0 ? (closedWonDeals / totalDeals) * 100 : 0

      return NextResponse.json({
        connected: true,
        success: true,
        message: 'Zoho CRM connected successfully.',
        account: {
          id: integration.crm_account_id || null,
          name: integration.crm_account_name || 'Zoho CRM Account',
        },
        last_sync: integration.last_sync_at || null,
        stats: {
          total_contacts: totalContacts,
          new_contacts_this_month: newContactsThisMonth,
          active_deals: activeDeals,
          deal_value: dealValue,
          conversion_rate: Math.round(conversionRate * 10) / 10
        },
        contacts: contacts.map((contact: any) => ({
          id: contact.id,
          name: contact.Full_Name || `${contact.First_Name || ''} ${contact.Last_Name || ''}`.trim() || contact.Email,
          email: contact.Email,
          phone: contact.Mobile || contact.Phone,
          created_time: contact.Created_Time,
          modified_time: contact.Modified_Time,
        })),
        deals: deals.map((deal: any) => ({
          id: deal.id,
          name: deal.Deal_Name,
          amount: parseFloat(deal.Amount || 0),
          stage: deal.Stage,
          closing_date: deal.Closing_Date,
          created_time: deal.Created_Time,
          modified_time: deal.Modified_Time,
        }))
      }, { status: 200, headers: corsHeaders })
      
    } catch (fetchError: any) {
      console.error('[CRM Dashboard] Error fetching Zoho data:', fetchError)
      
      // If it's an auth error, mark for reconnection
      if (fetchError.message?.includes('Authentication') || fetchError.message?.includes('INVALID_TOKEN')) {
        return NextResponse.json({
          ...getEmptyData('Zoho CRM session expired. Please reconnect to continue syncing.'),
          connected: true,
          needs_reconnection: true,
        }, { status: 200, headers: corsHeaders })
      }
      
      // Otherwise return connected state with empty data
      return NextResponse.json({
        connected: true,
        success: true,
        message: 'Zoho CRM connected. Unable to fetch data at the moment.',
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
    }

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
