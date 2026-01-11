import { NextRequest, NextResponse } from 'next/server';
import { requireBuilder, createErrorResponse } from '@/lib/auth/api-auth-helper';

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
      return NextResponse.json({
        connected: false,
        active: false,
        success: true,
        message: 'Builder profile not found. Please complete your builder profile setup.',
      });
    }

    // Get Zoho connection from integrations table
    const { data: connection, error: connError } = await supabase
      .from('integrations')
      .select('*')
      .eq('builder_id', builder.id)
      .eq('integration_type', 'crm')
      .eq('provider', 'zoho')
      .single();

    if (connError || !connection) {
      return NextResponse.json({
        connected: false,
        active: false,
        success: true,
        message: 'Zoho CRM not connected',
      });
    }

    // Get sync statistics from crm_sync_log table
    const { data: syncStats } = await supabase
      .from('crm_sync_log')
      .select('status, sync_completed_at')
      .eq('integration_id', connection.id)
      .order('sync_completed_at', { ascending: false })
      .limit(100);

    // Calculate health score
    const recentSyncs = syncStats?.filter(s => {
      if (!s.sync_completed_at) return false;
      const syncDate = new Date(s.sync_completed_at);
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

    const config = connection.config as any || {};

    return NextResponse.json({
      connected: connection.is_connected && connection.is_active,
      active: connection.is_active && connection.is_connected,
      health,
      account: {
        id: connection.crm_account_id || null,
        name: connection.crm_account_name || null,
      },
      sync: {
        last_sync: connection.last_sync_at || null,
        success_rate: Math.round(successRate),
        recent_syncs: recentSyncs.length,
      },
      statistics: {
        total_syncs: syncStats?.length || 0,
        successful_syncs: syncStats?.filter(s => s.status === 'success').length || 0,
        failed_syncs: syncStats?.filter(s => s.status === 'failed').length || 0,
      },
      last_error: connection.last_error || null,
      created_at: connection.created_at || null,
      updated_at: connection.updated_at || null,
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
