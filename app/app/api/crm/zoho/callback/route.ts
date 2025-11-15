// =============================================
// ZOHO CRM OAUTH - CALLBACK
// Exchanges code for tokens and saves connection
// =============================================
import { NextRequest, NextResponse } from 'next/server';
import { zohoClient } from '@/lib/integrations/crm/zohoClient';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // This is the builder_id
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // Check for OAuth errors
    if (error) {
      console.error('OAuth error:', error, errorDescription);
      return NextResponse.redirect(
        new URL(
          `/builder/settings?tab=integrations&zoho_error=${encodeURIComponent(error)}&description=${encodeURIComponent(errorDescription || 'Unknown error')}`,
          request.url
        )
      );
    }

    // Validate parameters
    if (!code || !state) {
      return NextResponse.redirect(
        new URL(
          '/builder/settings?tab=integrations&zoho_error=missing_params',
          request.url
        )
      );
    }

    const builder_id = state;

    // Verify builder exists and is authenticated
    const supabase = createClient();
    
    // First verify the current user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.redirect(
        new URL(
          '/builder/settings?tab=integrations&zoho_error=unauthorized',
          request.url
        )
      );
    }

    // Verify builder_id matches authenticated user (security check)
    if (builder_id !== user.id) {
      console.error('Builder ID mismatch:', { builder_id, user_id: user.id });
      return NextResponse.redirect(
        new URL(
          '/builder/settings?tab=integrations&zoho_error=invalid_user',
          request.url
        )
      );
    }

    // Exchange code for tokens
    let tokens;
    try {
      tokens = await zohoClient.exchangeCodeForTokens(code);
    } catch (tokenError: any) {
      console.error('Token exchange error:', tokenError);
      return NextResponse.redirect(
        new URL(
          `/builder/settings?tab=integrations&zoho_error=token_exchange_failed&message=${encodeURIComponent(tokenError.message || 'Token exchange failed')}`,
          request.url
        )
      );
    }

    // Save connection to database
    try {
      await zohoClient.saveConnection({
        builder_id,
        tokens,
      });
    } catch (saveError: any) {
      console.error('Connection save error:', saveError);
      return NextResponse.redirect(
        new URL(
          `/builder/settings?tab=integrations&zoho_error=save_failed&message=${encodeURIComponent(saveError.message || 'Failed to save connection')}`,
          request.url
        )
      );
    }

    // Trigger initial sync (async - don't wait)
    triggerInitialSync(builder_id).catch(err => 
      console.error('Initial sync failed:', err)
    );

    // Redirect to success page
    return NextResponse.redirect(
      new URL(
        '/builder/settings?tab=integrations&zoho_connected=true',
        request.url
      )
    );
  } catch (error: any) {
    console.error('Error handling OAuth callback:', error);
    return NextResponse.redirect(
      new URL(
        `/builder/settings?tab=integrations&zoho_error=callback_failed&message=${encodeURIComponent(error.message || 'Callback processing failed')}`,
        request.url
      )
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
