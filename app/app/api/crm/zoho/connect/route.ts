// =============================================
// ZOHO CRM OAUTH - CONNECT
// Redirects user to Zoho consent screen
// =============================================
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { zohoClient } from '@/lib/integrations/crm/zohoClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user (builder)
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    // Check if already connected
    const { data: existingConnection } = await supabase
      .from('integrations')
      .select('id, is_active, is_connected')
      .eq('builder_id', user.id)
      .eq('integration_type', 'crm')
      .eq('provider', 'zoho')
      .single();

    if (existingConnection?.is_active && existingConnection?.is_connected) {
      return NextResponse.json({
        error: 'Zoho CRM is already connected',
        already_connected: true,
        integration_id: existingConnection.id,
      }, { status: 400 });
    }

    // Generate OAuth URL with builder_id in state
    const authUrl = zohoClient.getAuthUrl(user.id);

    return NextResponse.json({ 
      success: true,
      auth_url: authUrl,
      message: 'Redirect user to this URL to connect Zoho CRM',
      expires_in: 600, // OAuth URL valid for 10 minutes
    });
  } catch (error: any) {
    console.error('Error initiating Zoho connection:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to initiate Zoho connection',
        success: false,
      },
      { status: 500 }
    );
  }
}













