// =============================================
// ZOHO CRM CONNECT API
// GET /api/integrations/zoho/connect
// Initiates OAuth flow
// =============================================
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { zohoClient } from '@/lib/integrations/crm/zohoClient';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get builder_id from query params or use user.id
    const searchParams = request.nextUrl.searchParams;
    const builder_id = searchParams.get('builder_id') || user.id;

    // Generate OAuth URL
    const authUrl = zohoClient.getAuthUrl(builder_id);

    return NextResponse.json({
      success: true,
      auth_url: authUrl,
    });
  } catch (error: any) {
    console.error('Error generating Zoho OAuth URL:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate OAuth URL' },
      { status: 500 }
    );
  }
}







