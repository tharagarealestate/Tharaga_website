import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { randomBytes } from 'crypto';

const ZOHO_OAUTH_CONFIG = {
  com: 'https://accounts.zoho.com',
  eu: 'https://accounts.zoho.eu',
  in: 'https://accounts.zoho.in',
  'com.au': 'https://accounts.zoho.com.au',
  jp: 'https://accounts.zoho.jp'
};

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }
    
    // Get builder profile
    const { data: builder, error: builderError } = await supabase
      .from('builders')
      .select('id')
      .eq('user_id', user.id)
      .single();
    
    if (builderError || !builder) {
      return NextResponse.json(
        { error: 'Builder profile not found' },
        { status: 404 }
      );
    }
    
    const { data_center = 'in' } = await request.json();
    
    // Validate data center
    if (!ZOHO_OAUTH_CONFIG[data_center as keyof typeof ZOHO_OAUTH_CONFIG]) {
      return NextResponse.json(
        { error: 'Invalid data center' },
        { status: 400 }
      );
    }
    
    // Check for required environment variables
    const clientId = process.env.ZOHO_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_APP_URL;
    
    if (!clientId) {
      return NextResponse.json(
        { 
          error: 'Zoho CRM integration is not configured. Please set ZOHO_CLIENT_ID environment variable.',
          errorType: 'MISSING_CONFIG',
          configRequired: ['ZOHO_CLIENT_ID', 'ZOHO_CLIENT_SECRET', 'ZOHO_REDIRECT_URI']
        },
        { status: 500 }
      );
    }
    
    if (!redirectUri) {
      return NextResponse.json(
        { 
          error: 'Application URL not configured. Please set NEXT_PUBLIC_APP_URL environment variable.',
          errorType: 'MISSING_CONFIG'
        },
        { status: 500 }
      );
    }
    
    // Generate secure state parameter
    const nonce = randomBytes(16).toString('hex');
    const state = Buffer.from(JSON.stringify({
      builder_id: builder.id,
      data_center: data_center,
      nonce: nonce,
      timestamp: Date.now()
    })).toString('base64');
    
    // Build authorization URL
    const authUrl = new URL(`${ZOHO_OAUTH_CONFIG[data_center as keyof typeof ZOHO_OAUTH_CONFIG]}/oauth/v2/auth`);
    authUrl.searchParams.append('scope', 'ZohoCRM.modules.ALL,ZohoCRM.settings.ALL,ZohoCRM.users.READ');
    authUrl.searchParams.append('client_id', clientId);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('access_type', 'offline');
    authUrl.searchParams.append('redirect_uri', `${redirectUri}/api/integrations/zoho/oauth`);
    authUrl.searchParams.append('state', state);
    authUrl.searchParams.append('prompt', 'consent');
    
    return NextResponse.json({
      authorization_url: authUrl.toString()
    });
    
  } catch (error: any) {
    console.error('Zoho connect error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to initiate connection' },
      { status: 500 }
    );
  }
}
