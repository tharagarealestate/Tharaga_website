// =============================================
// DISCONNECT ZOHO CRM
// Deactivates integration and revokes access
// =============================================
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', success: false },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { delete_mappings = false } = body;

    // Get integration
    const { data: integration, error: fetchError } = await supabase
      .from('integrations')
      .select('id')
      .eq('builder_id', user.id)
      .eq('integration_type', 'crm')
      .eq('provider', 'zoho')
      .single();

    if (fetchError || !integration) {
      return NextResponse.json(
        { error: 'Zoho CRM integration not found', success: false },
        { status: 404 }
      );
    }

    // Deactivate connection (keep historical data)
    const { error: updateError } = await supabase
      .from('integrations')
      .update({ 
        is_active: false,
        is_connected: false,
        updated_at: new Date().toISOString(),
        last_error: 'Disconnected by user',
      })
      .eq('id', integration.id);

    if (updateError) {
      throw updateError;
    }

    // Optionally delete field mappings
    if (delete_mappings) {
      const { error: deleteError } = await supabase
        .from('crm_field_mappings')
        .delete()
        .eq('integration_id', integration.id);

      if (deleteError) {
        console.error('Error deleting field mappings:', deleteError);
        // Don't fail the disconnect if mapping deletion fails
      }
    }

    // Note: Keep record mappings for historical reference
    // Users can manually clear them if needed

    return NextResponse.json({ 
      success: true,
      message: 'Zoho CRM disconnected successfully',
      integration_id: integration.id,
    });
  } catch (error: any) {
    console.error('Error disconnecting Zoho CRM:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to disconnect Zoho CRM',
        success: false,
      },
      { status: 500 }
    );
  }
}
