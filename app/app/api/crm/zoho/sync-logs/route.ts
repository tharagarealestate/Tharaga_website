// =============================================
// ZOHO SYNC LOGS
// View sync history and troubleshoot issues
// =============================================
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
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

    const searchParams = request.nextUrl.searchParams;
    const sync_type = searchParams.get('sync_type'); // 'lead', 'deal'
    const sync_direction = searchParams.get('sync_direction'); // 'to_crm', 'from_crm'
    const status = searchParams.get('status'); // 'success', 'failed'
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100); // Max 100
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0);

    // Get integration
    const { data: integration } = await supabase
      .from('integrations')
      .select('id')
      .eq('builder_id', user.id)
      .eq('integration_type', 'crm')
      .eq('provider', 'zoho')
      .single();

    if (!integration) {
      return NextResponse.json(
        { error: 'Zoho CRM not connected', success: false },
        { status: 404 }
      );
    }

    // Build query
    let query = supabase
      .from('crm_sync_log')
      .select('*', { count: 'exact' })
      .eq('integration_id', integration.id)
      .order('sync_started_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (sync_type) {
      query = query.eq('sync_type', sync_type);
    }

    if (sync_direction) {
      query = query.eq('sync_direction', sync_direction);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: logs, error, count } = await query;

    if (error) throw error;

    // Calculate statistics
    const { data: stats } = await supabase
      .from('crm_sync_log')
      .select('status, sync_type, sync_direction')
      .eq('integration_id', integration.id);

    const statistics = {
      total: stats?.length || 0,
      successful: stats?.filter(s => s.status === 'success').length || 0,
      failed: stats?.filter(s => s.status === 'failed').length || 0,
      by_type: {
        lead: stats?.filter(s => s.sync_type === 'lead').length || 0,
        deal: stats?.filter(s => s.sync_type === 'deal').length || 0,
      },
      by_direction: {
        to_crm: stats?.filter(s => s.sync_direction === 'to_crm').length || 0,
        from_crm: stats?.filter(s => s.sync_direction === 'from_crm').length || 0,
      },
    };

    return NextResponse.json({ 
      logs: logs || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        has_more: (count || 0) > offset + limit,
      },
      statistics,
      success: true,
    });
  } catch (error: any) {
    console.error('Error fetching sync logs:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch sync logs',
        success: false,
      },
      { status: 500 }
    );
  }
}







