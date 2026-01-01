import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const ZOHO_OAUTH_CONFIG = {
  com: 'https://accounts.zoho.com',
  eu: 'https://accounts.zoho.eu',
  in: 'https://accounts.zoho.in',
  'com.au': 'https://accounts.zoho.com.au',
  jp: 'https://accounts.zoho.jp'
};

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    
    // Handle OAuth errors
    if (error) {
      return NextResponse.redirect(
        new URL(
          `/builder/integrations?error=${encodeURIComponent(error)}`,
          request.url
        )
      );
    }
    
    if (!code || !state) {
      return NextResponse.redirect(
        new URL(
          `/builder/integrations?error=${encodeURIComponent('Missing authorization code or state')}`,
          request.url
        )
      );
    }
    
    // Verify state to prevent CSRF
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.redirect(
        new URL('/builder/integrations?error=unauthorized', request.url)
      );
    }
    
    // Decode state (contains builder_id and data_center)
    let stateData;
    try {
      stateData = JSON.parse(
        Buffer.from(state, 'base64').toString('utf-8')
      );
    } catch (e) {
      return NextResponse.redirect(
        new URL('/builder/integrations?error=invalid_state', request.url)
      );
    }
    
    const { builder_id, data_center } = stateData;
    
    // Verify builder belongs to user
    const { data: builder } = await supabase
      .from('builders')
      .select('id')
      .eq('id', builder_id)
      .eq('user_id', user.id)
      .single();
    
    if (!builder) {
      return NextResponse.redirect(
        new URL('/builder/integrations?error=unauthorized', request.url)
      );
    }
    
    // Exchange code for tokens
    const tokenResponse = await fetch(
      `${ZOHO_OAUTH_CONFIG[data_center as keyof typeof ZOHO_OAUTH_CONFIG]}/oauth/v2/token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: process.env.ZOHO_CLIENT_ID!,
          client_secret: process.env.ZOHO_CLIENT_SECRET!,
          redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/zoho/oauth`,
          code: code
        })
      }
    );
    
    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => ({}));
      throw new Error(`Token exchange failed: ${errorData.error || 'Unknown error'}`);
    }
    
    const tokenData = await tokenResponse.json();
    
    // Get Zoho organization info
    const orgResponse = await fetch(
      `https://www.zohoapis.${data_center}/crm/v3/org`,
      {
        headers: {
          'Authorization': `Zoho-oauthtoken ${tokenData.access_token}`
        }
      }
    );
    
    if (!orgResponse.ok) {
      throw new Error('Failed to fetch organization info');
    }
    
    const orgData = await orgResponse.json();
    const organization = orgData.org?.[0];
    
    if (!organization) {
      throw new Error('Organization not found');
    }
    
    // Calculate token expiry
    const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000));
    
    // Determine API domain based on data center
    const apiDomain = `https://www.zohoapis.${data_center}`;
    
    // Store connection in database using integrations table (matching ZohoClient implementation)
    const { data: connection, error: dbError } = await supabase
      .from('integrations')
      .upsert({
        builder_id: builder_id,
        integration_type: 'crm',
        provider: 'zoho',
        config: {
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_at: expiresAt.toISOString(),
          api_domain: apiDomain,
        },
        crm_account_id: organization.zgid || '',
        crm_account_name: organization.company_name || organization.email || '',
        is_active: true,
        is_connected: true,
        last_sync_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'builder_id,integration_type,provider'
      })
      .select()
      .single();
    
    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`);
    }
    
    // Initialize field mappings using crm_field_mappings table
    try {
      await initializeFieldMappings(connection.id, tokenData.access_token, data_center, supabase);
    } catch (error) {
      console.error('Field mapping initialization error:', error);
      // Continue anyway
    }
    
    // Redirect to success page
    return NextResponse.redirect(
      new URL(
        `/builder/integrations?zoho_connected=true`,
        request.url
      )
    );
    
  } catch (error: any) {
    console.error('Zoho OAuth error:', error);
    return NextResponse.redirect(
      new URL(
        `/builder/integrations?error=${encodeURIComponent(error.message || 'Connection failed')}`,
        request.url
      )
    );
  }
}

async function initializeFieldMappings(
  integrationId: string,
  accessToken: string,
  dataCenter: string,
  supabase: any
) {
  try {
    // Check if field mappings already exist
    const { data: existingMappings } = await supabase
      .from('crm_field_mappings')
      .select('id')
      .eq('integration_id', integrationId)
      .limit(1);
    
    if (existingMappings && existingMappings.length > 0) {
      // Mappings already exist, skip
      return;
    }
    
    // Create default field mappings in crm_field_mappings table
    const defaultMappings = [
      // Lead/Contact mappings
      { integration_id: integrationId, tharaga_field: 'name', crm_field: 'Last_Name', record_type: 'lead' },
      { integration_id: integrationId, tharaga_field: 'email', crm_field: 'Email', record_type: 'lead' },
      { integration_id: integrationId, tharaga_field: 'phone', crm_field: 'Phone', record_type: 'lead' },
      { integration_id: integrationId, tharaga_field: 'source', crm_field: 'Lead_Source', record_type: 'lead' },
      { integration_id: integrationId, tharaga_field: 'budget', crm_field: 'Budget', record_type: 'lead' },
      { integration_id: integrationId, tharaga_field: 'ai_lead_score', crm_field: 'Rating', record_type: 'lead' },
      { integration_id: integrationId, tharaga_field: 'status', crm_field: 'Lead_Status', record_type: 'lead' },
      // Deal mappings
      { integration_id: integrationId, tharaga_field: 'property_id', crm_field: 'Deal_Name', record_type: 'deal' },
      { integration_id: integrationId, tharaga_field: 'price', crm_field: 'Amount', record_type: 'deal' },
      { integration_id: integrationId, tharaga_field: 'status', crm_field: 'Stage', record_type: 'deal' },
      { integration_id: integrationId, tharaga_field: 'expected_close_date', crm_field: 'Closing_Date', record_type: 'deal' },
    ];
    
    await supabase
      .from('crm_field_mappings')
      .insert(defaultMappings);
    
  } catch (error) {
    console.error('Field mapping initialization error:', error);
    // Don't throw - this is not critical
  }
}

