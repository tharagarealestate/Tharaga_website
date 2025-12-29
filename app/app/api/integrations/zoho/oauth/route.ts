import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { encrypt, getEncryptionKey } from '@/lib/security/encryption';

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
    
    // Encrypt tokens before storing
    const encryptionKey = getEncryptionKey();
    const encryptedAccessToken = encrypt(tokenData.access_token, encryptionKey);
    const encryptedRefreshToken = encrypt(tokenData.refresh_token, encryptionKey);
    
    // Calculate token expiry
    const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000));
    
    // Store connection in database
    const { data: connection, error: dbError } = await supabase
      .from('zoho_crm_connections')
      .upsert({
        builder_id: builder_id,
        access_token: encryptedAccessToken,
        refresh_token: encryptedRefreshToken,
        token_expires_at: expiresAt.toISOString(),
        zoho_account_email: organization.email || '',
        zoho_org_id: organization.zgid || '',
        zoho_data_center: data_center,
        status: 'active',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'builder_id'
      })
      .select()
      .single();
    
    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`);
    }
    
    // Initialize field mappings
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
  connectionId: string,
  accessToken: string,
  dataCenter: string,
  supabase: any
) {
  try {
    // Create default field mappings
    const fieldMappings = {
      lead_fields: {
        'name': 'Last_Name',
        'email': 'Email',
        'phone': 'Phone',
        'source': 'Lead_Source',
        'budget': 'Budget',
        'ai_lead_score': 'Rating',
        'status': 'Lead_Status',
        'property_id': 'Description'
      },
      deal_fields: {
        'property_id': 'Deal_Name',
        'price': 'Amount',
        'status': 'Stage',
        'expected_close_date': 'Closing_Date',
        'probability': 'Probability'
      },
      contact_fields: {
        'name': 'Last_Name',
        'email': 'Email',
        'phone': 'Phone',
        'whatsapp': 'Mobile'
      }
    };
    
    await supabase
      .from('zoho_crm_connections')
      .update({ field_mappings: fieldMappings })
      .eq('id', connectionId);
    
  } catch (error) {
    console.error('Field mapping initialization error:', error);
    throw error;
  }
}

