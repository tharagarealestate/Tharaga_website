// =============================================
// ZOHO CRM CALLBACK API
// GET /api/integrations/zoho/callback
// Handles OAuth callback
// =============================================
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { zohoClient } from '@/lib/integrations/crm/zohoClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.redirect(
        new URL('/builder/settings?tab=integrations&zoho_error=unauthorized', request.url)
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // builder_id
    const error = searchParams.get('error');

    // Handle OAuth errors
    if (error) {
      return NextResponse.redirect(
        new URL(`/builder/settings?tab=integrations&zoho_error=${encodeURIComponent(error)}`, request.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/builder/settings?tab=integrations&zoho_error=no_code', request.url)
      );
    }

    // Use state (builder_id) or fallback to user.id
    const builder_id = state || user.id;

    // Exchange code for tokens
    const tokens = await zohoClient.exchangeCodeForTokens(code);

    // Save connection to database
    await zohoClient.saveConnection({
      builder_id,
      tokens,
    });

    // Redirect to settings page with success message
    return NextResponse.redirect(
      new URL('/builder/settings?tab=integrations&zoho_connected=true', request.url)
    );
  } catch (error: any) {
    console.error('Error handling Zoho callback:', error);
    return NextResponse.redirect(
      new URL(`/builder/settings?tab=integrations&zoho_error=${encodeURIComponent(error.message)}`, request.url)
    );
  }
}













