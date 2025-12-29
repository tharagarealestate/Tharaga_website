import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.', success: false },
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
      return NextResponse.json({
        connected: false,
        active: false,
        success: true,
        message: 'Builder profile not found',
      });
    }

    // Get Zoho connection
    const { data: connection, error: connError } = await supabase
      .from('zoho_crm_connections')
      .select('*')
      .eq('builder_id', builder.id)
      .single();

    if (connError || !connection) {
      return NextResponse.json({
        connected: false,
        active: false,
        success: true,
        message: 'Zoho CRM not connected',
      });
    }

    // Get sync statistics
    const { data: syncStats } = await supabase
      .from('zoho_sync_logs')
      .select('status, created_at')
      .eq('connection_id', connection.id)
      .order('created_at', { ascending: false })
      .limit(100);

    // Calculate health score
    const recentSyncs = syncStats?.filter(s => {
      if (!s.created_at) return false;
      const syncDate = new Date(s.created_at);
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
      connected: connection.status === 'active',
      active: connection.status === 'active',
      health,
      account: {
        id: connection.zoho_org_id || null,
        name: connection.zoho_account_email || null,
      },
      sync: {
        last_sync: connection.last_synced_at || null,
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
