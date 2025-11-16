// =============================================
// ZOHO CRM STATUS API
// GET /api/integrations/zoho/status
// Gets connection status
// =============================================
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { zohoClient } from '@/lib/integrations/crm/zohoClient';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const builder_id = user.id;

    // Get connection status
    const status = await zohoClient.getConnectionStatus(builder_id);

    return NextResponse.json({
      success: true,
      ...status,
    });
  } catch (error: any) {
    console.error('Error getting Zoho status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get status' },
      { status: 500 }
    );
  }
}









