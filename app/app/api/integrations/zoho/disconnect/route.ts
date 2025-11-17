// =============================================
// ZOHO CRM DISCONNECT API
// POST /api/integrations/zoho/disconnect
// Disconnects Zoho CRM
// =============================================
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
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

    // Disconnect integration
    const { error } = await supabase
      .from('integrations')
      .update({
        is_connected: false,
        is_active: false,
        last_error: 'Disconnected by user',
      })
      .eq('builder_id', builder_id)
      .eq('integration_type', 'crm')
      .eq('provider', 'zoho');

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Zoho CRM disconnected successfully',
    });
  } catch (error: any) {
    console.error('Error disconnecting Zoho:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to disconnect' },
      { status: 500 }
    );
  }
}











