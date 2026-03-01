// =============================================
// ZOHO CRM OAUTH - CALLBACK
// Exchanges code for tokens and saves connection
// =============================================
import { NextRequest, NextResponse } from 'next/server';
import { zohoClient } from '@/lib/integrations/crm/zohoClient';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    console.log('[Zoho Callback] Received callback:', {
      hasCode: !!code,
      hasState: !!state,
      hasError: !!error,
      error,
      errorDescription,
    });

    // Check for OAuth errors
    if (error) {
      console.error('[Zoho Callback] OAuth error:', error, errorDescription);
      const baseUrl = new URL(request.url).origin
      return NextResponse.redirect(
        `${baseUrl}/builder?section=crm&zoho_error=${encodeURIComponent(error)}&description=${encodeURIComponent(errorDescription || 'Unknown error')}`
      );
    }

    // Validate parameters
    if (!code || !state) {
      console.error('[Zoho Callback] Missing required parameters:', { code: !!code, state: !!state });
      const baseUrl = new URL(request.url).origin
      return NextResponse.redirect(
        `${baseUrl}/builder?section=crm&zoho_error=missing_params`
      );
    }

    // CRITICAL FIX: Decode state parameter (it's base64 encoded JSON)
    let builder_id: string;
    try {
      const decodedState = Buffer.from(state, 'base64').toString('utf-8');
      const stateData = JSON.parse(decodedState);
      builder_id = stateData.user_id;
      console.log('[Zoho Callback] Decoded state:', { builder_id, timestamp: stateData.timestamp });
    } catch (decodeError) {
      // Fallback: if decoding fails, try using state directly (for backward compatibility)
      console.warn('[Zoho Callback] Failed to decode state, using as-is:', decodeError);
      builder_id = state;
    }

    // Verify builder exists and is authenticated
    const supabase = await createClient();
    
    // First verify the current user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      const baseUrl = new URL(request.url).origin
      return NextResponse.redirect(
        `${baseUrl}/builder?section=crm&zoho_error=unauthorized`
      );
    }

    // Verify builder_id matches authenticated user (security check)
    if (builder_id !== user.id) {
      console.error('Builder ID mismatch:', { builder_id, user_id: user.id });
      const baseUrl = new URL(request.url).origin
      return NextResponse.redirect(
        `${baseUrl}/builder?section=crm&zoho_error=invalid_user`
      );
    }

    // Exchange code for tokens
    let tokens;
    try {
      console.log('[Zoho Callback] Exchanging code for tokens...');
      tokens = await zohoClient.exchangeCodeForTokens(code);
      console.log('[Zoho Callback] Token exchange successful:', {
        hasAccessToken: !!tokens.access_token,
        hasRefreshToken: !!tokens.refresh_token,
        expiresIn: tokens.expires_in,
        apiDomain: tokens.api_domain,
      });
    } catch (tokenError: any) {
      console.error('[Zoho Callback] Token exchange error:', {
        message: tokenError.message,
        response: tokenError.response?.data,
        status: tokenError.response?.status,
      });
      const baseUrl = new URL(request.url).origin
      return NextResponse.redirect(
        `${baseUrl}/builder?section=crm&zoho_error=token_exchange_failed&message=${encodeURIComponent(tokenError.message || 'Token exchange failed')}`
      );
    }

    // Save connection to database
    try {
      console.log('[Zoho Callback] Saving connection to database...');
      await zohoClient.saveConnection({
        builder_id,
        tokens,
      });
      console.log('[Zoho Callback] Connection saved successfully');
    } catch (saveError: any) {
      console.error('[Zoho Callback] Connection save error:', {
        message: saveError.message,
        stack: saveError.stack,
        builder_id,
      });
      const baseUrl = new URL(request.url).origin
      return NextResponse.redirect(
        `${baseUrl}/builder?section=crm&zoho_error=save_failed&message=${encodeURIComponent(saveError.message || 'Failed to save connection')}`
      );
    }

    // Trigger initial sync (async - don't wait)
    triggerInitialSync(builder_id).catch(err => 
      console.error('Initial sync failed:', err)
    );

    // OPTIMIZED: Redirect to builder dashboard with CRM section (not settings page)
    // This keeps user in context and shows the CRM dashboard directly
    const baseUrl = new URL(request.url).origin
    return NextResponse.redirect(
      `${baseUrl}/builder?section=crm&zoho_connected=true`
    );
  } catch (error: any) {
    console.error('Error handling OAuth callback:', error);
    const baseUrl = new URL(request.url).origin
    return NextResponse.redirect(
      `${baseUrl}/builder?section=crm&zoho_error=callback_failed&message=${encodeURIComponent(error.message || 'Callback processing failed')}`
    );
  }
}

/**
 * Trigger initial sync in background
 */
async function triggerInitialSync(builder_id: string): Promise<void> {
  try {
    // Get the base URL from environment
    let baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    
    if (!baseUrl) {
      // Try Vercel URL
      if (process.env.VERCEL_URL) {
        baseUrl = `https://${process.env.VERCEL_URL}`;
      } else {
        // Fallback to localhost for development
        baseUrl = 'http://localhost:3000';
      }
    }

    // Call sync endpoint
    const response = await fetch(`${baseUrl}/api/crm/zoho/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        builder_id,
        sync_type: 'initial',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Initial sync response error:', response.status, errorData);
    }
  } catch (error) {
    console.error('Failed to trigger initial sync:', error);
    // Don't throw - this is a background operation
  }
}
