// =============================================
// ZOHO INTEGRATION STATUS
// Check connection health and statistics
// =============================================
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', success: false },
        { status: 401 }
      );
    }

    // Get integration
    const { data: integration, error } = await supabase
      .from('integrations')
      .select('*')
      .eq('builder_id', user.id)
      .eq('integration_type', 'crm')
      .eq('provider', 'zoho')
      .single();

    if (error || !integration) {
      return NextResponse.json({
        connected: false,
        active: false,
        success: true,
        message: 'Zoho CRM not connected',
      });
    }

    // Get sync statistics
    const { data: syncStats } = await supabase
      .from('crm_sync_log')
      .select('status, sync_started_at')
      .eq('integration_id', integration.id)
      .order('sync_started_at', { ascending: false })
      .limit(100);

    // Get record mappings count
    const { count: mappedRecords } = await supabase
      .from('crm_record_mappings')
      .select('*', { count: 'exact', head: true })
      .eq('integration_id', integration.id);

    // Get field mappings count
    const { count: fieldMappings } = await supabase
      .from('crm_field_mappings')
      .select('*', { count: 'exact', head: true })
      .eq('integration_id', integration.id)
      .eq('is_active', true);

    // Calculate health score
    const recentSyncs = syncStats?.filter(s => {
      if (!s.sync_started_at) return false;
      const syncDate = new Date(s.sync_started_at);
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return syncDate > dayAgo;
    }) || [];

    const successRate = recentSyncs.length > 0
      ? (recentSyncs.filter(s => s.status === 'success').length / recentSyncs.length) * 100
      : 100;

    let health = 'excellent';
    if (successRate < 50) health = 'poor';
    else if (successRate < 80) health = 'fair';
    else if (successRate < 95) health = 'good';

    return NextResponse.json({
      connected: integration.is_connected || false,
      active: integration.is_active || false,
      health,
      account: {
        id: integration.crm_account_id || null,
        name: integration.crm_account_name || null,
      },
      sync: {
        last_sync: integration.last_sync_at || null,
        success_rate: Math.round(successRate),
        recent_syncs: recentSyncs.length,
      },
      statistics: {
        total_syncs: integration.total_actions || 0,
        successful_syncs: integration.successful_actions || 0,
        failed_syncs: integration.failed_actions || 0,
        mapped_records: mappedRecords || 0,
        field_mappings: fieldMappings || 0,
      },
      last_error: integration.last_error || null,
      created_at: integration.created_at || null,
      updated_at: integration.updated_at || null,
      success: true,
    });
  } catch (error: any) {
    console.error('Error fetching Zoho status:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch Zoho status',
        success: false,
      },
      { status: 500 }
    );
  }
}
