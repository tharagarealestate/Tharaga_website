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
        console.log('[Zoho Connect API] Authenticated via token:', tokenUser.email)
        Object.assign(supabase, tokenClient)
      } else {
        authError = tokenError
        console.error('[Zoho Connect API] Token verification failed:', {
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

    // OPTIMIZED: Generate OAuth URL with comprehensive validation
    // Check both production and development environment variables
    const clientId = process.env.ZOHO_CLIENT_ID || process.env.NEXT_PUBLIC_ZOHO_CLIENT_ID
    const clientSecret = process.env.ZOHO_CLIENT_SECRET || process.env.NEXT_PUBLIC_ZOHO_CLIENT_SECRET
    const redirectUri = process.env.ZOHO_REDIRECT_URI || process.env.NEXT_PUBLIC_ZOHO_REDIRECT_URI || `${process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL}/api/crm/zoho/callback`
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL
    
    console.log('[Zoho Connect API] Environment check:', {
      hasClientId: !!clientId,
      clientIdPrefix: clientId ? `${clientId.substring(0, 15)}...` : 'missing',
      hasClientSecret: !!clientSecret,
      redirectUri,
      siteUrl,
    })

    // CRITICAL: Validate Client ID exists
    if (!clientId) {
      return NextResponse.json({
        success: false,
        error: 'Zoho CRM integration not configured',
        message: 'ZOHO_CLIENT_ID environment variable is not set',
        help: {
          step1: 'Go to https://api-console.zoho.in (for India) or https://api-console.zoho.com (for International)',
          step2: 'Create a new Server-based Application',
          step3: 'Copy the Client ID and Client Secret',
          step4: 'Add them to your Netlify environment variables: ZOHO_CLIENT_ID and ZOHO_CLIENT_SECRET',
          step5: 'Set ZOHO_REDIRECT_URI to match your callback URL exactly',
        },
        requiredEnvVars: ['ZOHO_CLIENT_ID', 'ZOHO_CLIENT_SECRET', 'ZOHO_REDIRECT_URI'],
      }, { status: 500, headers: corsHeaders })
    }

    // Validate Client ID format (Zoho Client IDs start with "1000.")
    if (!clientId.startsWith('1000.')) {
      console.warn('[Zoho Connect API] Client ID format may be incorrect. Zoho Client IDs typically start with "1000."')
    }

    // Validate redirect URI is set
    if (!redirectUri || redirectUri.includes('undefined')) {
      return NextResponse.json({
        success: false,
        error: 'Redirect URI not configured',
        message: 'ZOHO_REDIRECT_URI is not set or NEXT_PUBLIC_SITE_URL is missing',
        currentRedirectUri: redirectUri,
        help: {
          step1: 'Set ZOHO_REDIRECT_URI environment variable to your callback URL',
          step2: `Example: ${siteUrl ? `${siteUrl}/api/crm/zoho/callback` : 'https://your-site.netlify.app/api/crm/zoho/callback'}`,
          step3: 'Ensure this EXACT URL is also set in your Zoho app settings',
        },
      }, { status: 500, headers: corsHeaders })
    }

    // Determine correct accounts URL based on Client ID region
    // Indian accounts typically use .in, International use .com
    // Try to detect based on Client ID or use environment variable
    let accountsUrl = process.env.ZOHO_ACCOUNTS_URL
    
    // If not explicitly set, try to determine from Client ID or default to .in for Indian real estate
    if (!accountsUrl) {
      // Check if we should use .in or .com
      // For now, default to .in for Indian market, but allow override
      accountsUrl = 'https://accounts.zoho.in'
      console.log('[Zoho Connect API] Using default accounts URL for India:', accountsUrl)
      console.log('[Zoho Connect API] If your Zoho account is International, set ZOHO_ACCOUNTS_URL=https://accounts.zoho.com')
    }

    // Validate redirect URI format
    try {
      const redirectUrlObj = new URL(redirectUri)
      if (!redirectUrlObj.protocol.startsWith('http')) {
        throw new Error('Redirect URI must use http:// or https://')
      }
    } catch (e: any) {
      return NextResponse.json({
        success: false,
        error: 'Invalid redirect URI format',
        message: e.message || 'Redirect URI must be a valid URL',
        currentRedirectUri: redirectUri,
      }, { status: 500, headers: corsHeaders })
    }

    const scope = 'ZohoCRM.modules.ALL,ZohoCRM.settings.ALL,ZohoCRM.users.READ'
    const state = Buffer.from(JSON.stringify({
      user_id: user.id,
      timestamp: Date.now()
    })).toString('base64')

    const authUrl = new URL(`${accountsUrl}/oauth/v2/auth`)
    authUrl.searchParams.set('client_id', clientId)
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('scope', scope)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('access_type', 'offline')
    authUrl.searchParams.set('prompt', 'consent')
    authUrl.searchParams.set('state', state)
    
    console.log('[Zoho Connect API] Generated OAuth URL:', {
      accountsUrl,
      clientId: clientId ? `${clientId.substring(0, 15)}...` : 'missing',
      clientIdLength: clientId?.length || 0,
      redirectUri,
      scope,
      clientSecret: clientSecret ? '***configured***' : 'missing'
    })

    // Return OAuth URL with helpful diagnostic info
    return NextResponse.json({
      success: true,
      auth_url: authUrl.toString(),
      message: 'Redirect user to this URL to connect Zoho CRM',
      expires_in: 600, // OAuth URL valid for 10 minutes
      diagnostic: {
        accountsUrl,
        redirectUri,
        clientIdPrefix: clientId.substring(0, 15),
        hasClientSecret: !!clientSecret,
        region: accountsUrl.includes('.in') ? 'India' : 'International',
      },
      troubleshooting: {
        ifInvalidClient: 'If you see "Invalid Client" error:',
        steps: [
          '1. Verify ZOHO_CLIENT_ID in Netlify matches your Zoho app Client ID exactly',
          '2. Check if your Zoho app is in the correct region (India vs International)',
          '3. Ensure ZOHO_ACCOUNTS_URL matches your Zoho account region',
          '4. Verify the redirect URI in Zoho app settings matches ZOHO_REDIRECT_URI exactly',
          '5. Make sure your Zoho app is active and not deleted',
        ],
        zohoConsoleUrls: {
          india: 'https://api-console.zoho.in',
          international: 'https://api-console.zoho.com',
        },
      },
    }, { status: 200, headers: corsHeaders })

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
