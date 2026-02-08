// =============================================
// ZOHO CRM OAUTH - CONNECT API
// Uses request-based Supabase client for reliable auth
// GET /api/crm/zoho/connect - No role restrictions
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
// GET - Get Zoho OAuth URL (NO ROLE RESTRICTIONS)
// =============================================
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    console.log('[Zoho Connect API] Authorization header:', authHeader ? 'present' : 'missing')
    
    // Use request-based client for reliable cookie handling
    const { supabase } = createClientFromRequest(request)

    // CRITICAL: If Authorization header is present, verify token directly
    let user = null
    let authError = null
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      console.log('[Zoho Connect API] Verifying token from Authorization header...')
      const { data: { user: tokenUser }, error: tokenError } = await supabase.auth.getUser(token)
      if (!tokenError && tokenUser) {
        user = tokenUser
        console.log('[Zoho Connect API] Authenticated via token:', tokenUser.email)
      } else {
        authError = tokenError
        console.error('[Zoho Connect API] Token verification failed:', tokenError?.message)
      }
    } else {
      // Try cookie-based auth
      const result = await supabase.auth.getUser()
      user = result.data?.user || null
      authError = result.error || null
    }

    if (authError || !user) {
      console.error('[Zoho Connect API] Auth error:', authError?.message || 'No user')
      return NextResponse.json({
        success: false,
        error: 'Please log in to connect Zoho CRM',
        errorType: 'AUTH_REQUIRED'
      }, { status: 401, headers: corsHeaders })
    }

    // Check if already connected - try multiple column schemas
    let existingConnection = null

    // Try with builder_id first
    try {
      const { data } = await supabase
        .from('integrations')
        .select('id, is_active, is_connected, connected, active')
        .eq('builder_id', user.id)
        .eq('integration_type', 'crm')
        .eq('provider', 'zoho')
        .single()
      existingConnection = data
    } catch (e) {
      // Table might not have builder_id column
    }

    // Try with user_id
    if (!existingConnection) {
      try {
        const { data } = await supabase
          .from('integrations')
          .select('id, is_active, is_connected, connected, active')
          .eq('user_id', user.id)
          .eq('provider', 'zoho')
          .single()
        existingConnection = data
      } catch (e) {
        // No existing connection
      }
    }

    const isConnected = existingConnection?.is_connected || existingConnection?.connected
    const isActive = existingConnection?.is_active || existingConnection?.active

    if (isConnected && isActive) {
      return NextResponse.json({
        success: false,
        error: 'Zoho CRM is already connected',
        already_connected: true,
        integration_id: existingConnection?.id,
      }, { status: 400, headers: corsHeaders })
    }

    // Generate OAuth URL
    const clientId = process.env.ZOHO_CLIENT_ID
    const redirectUri = process.env.ZOHO_REDIRECT_URI || `${process.env.NEXT_PUBLIC_SITE_URL}/api/crm/zoho/callback`

    if (!clientId) {
      return NextResponse.json({
        success: false,
        error: 'Zoho CRM integration not configured',
        message: 'Please configure ZOHO_CLIENT_ID environment variable',
      }, { status: 500, headers: corsHeaders })
    }

    // Build the OAuth authorization URL
    const scope = 'ZohoCRM.modules.ALL,ZohoCRM.settings.ALL,ZohoCRM.users.READ'
    const state = Buffer.from(JSON.stringify({
      user_id: user.id,
      timestamp: Date.now()
    })).toString('base64')

    const authUrl = new URL('https://accounts.zoho.com/oauth/v2/auth')
    authUrl.searchParams.set('client_id', clientId)
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('scope', scope)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('access_type', 'offline')
    authUrl.searchParams.set('prompt', 'consent')
    authUrl.searchParams.set('state', state)

    return NextResponse.json({
      success: true,
      auth_url: authUrl.toString(),
      message: 'Redirect user to this URL to connect Zoho CRM',
      expires_in: 600, // OAuth URL valid for 10 minutes
    }, { status: 200, headers: corsHeaders })

  } catch (error: any) {
    console.error('Error initiating Zoho connection:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to initiate Zoho connection',
    }, { status: 500, headers: corsHeaders })
  }
}
