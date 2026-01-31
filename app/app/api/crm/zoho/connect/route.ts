// =============================================
// ZOHO CRM OAUTH - CONNECT
// Redirects user to Zoho consent screen
// =============================================
import { NextRequest, NextResponse } from 'next/server';
import { requireBuilder, createErrorResponse } from '@/lib/auth/api-auth-helper';
import { zohoClient } from '@/lib/integrations/crm/zohoClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Enhanced authentication with better error handling
    const { user, builder, supabase, error: authError } = await requireBuilder(request);
    
    if (authError) {
      const statusCode = authError.type === 'NOT_BUILDER' ? 403 : 
                        authError.type === 'CONFIG_ERROR' ? 500 : 401;
      return createErrorResponse(authError as any, statusCode);
    }

    if (!builder || !supabase) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Builder profile not found',
          errorType: 'NOT_FOUND',
          message: 'Please complete your builder profile setup to connect Zoho CRM.',
        },
        { status: 404 }
      );
    }

    // Check if already connected
    const { data: existingConnection } = await supabase
      .from('integrations')
      .select('id, is_active, is_connected')
      .eq('builder_id', builder.id)
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
    const authUrl = zohoClient.getAuthUrl(user!.id);

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













