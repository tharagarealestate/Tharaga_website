import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ZohoClient } from '@/lib/integrations/crm/zohoClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { connection_id, sync_type = 'incremental', entity_id } = await request.json();
    
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }
    
    // Get builder profile
    const { data: builder } = await supabase
      .from('builders')
      .select('id')
      .eq('user_id', user.id)
      .single();
    
    if (!builder) {
      return NextResponse.json(
        { error: 'Builder profile not found' },
        { status: 404 }
      );
    }
    
    // Get connection details from integrations table
    const { data: integration, error: connError } = await supabase
      .from('integrations')
      .select('*')
      .eq('id', connection_id)
      .eq('builder_id', builder.id)
      .eq('integration_type', 'crm')
      .eq('provider', 'zoho')
      .single();
    
    if (connError || !integration) {
      return NextResponse.json(
        { error: 'Zoho CRM connection not found' },
        { status: 404 }
      );
    }
    
    if (!integration.is_active || !integration.is_connected) {
      return NextResponse.json(
        { error: 'Zoho CRM is not connected' },
        { status: 400 }
      );
    }
    
    // Use ZohoClient for syncing (it handles token refresh automatically)
    const zohoClient = new ZohoClient();
    
    // Execute sync based on type using ZohoClient methods
    switch (sync_type) {
      case 'initial':
      case 'full':
        // Sync all leads
        const { data: allLeads } = await supabase
          .from('leads')
          .select('*')
          .eq('builder_id', builder.id);
        
        if (allLeads) {
          for (const lead of allLeads) {
            await zohoClient.syncContactToZoho({
              builder_id: builder.id,
              lead_id: lead.id,
              lead_data: lead,
            });
          }
        }
        break;
        
      case 'lead':
        if (entity_id) {
          const { data: lead } = await supabase
            .from('leads')
            .select('*')
            .eq('id', entity_id)
            .eq('builder_id', builder.id)
            .single();
          
          if (lead) {
            await zohoClient.syncContactToZoho({
              builder_id: builder.id,
              lead_id: lead.id,
              lead_data: lead,
            });
          }
        } else {
          // Sync all leads
          const { data: leads } = await supabase
            .from('leads')
            .select('*')
            .eq('builder_id', builder.id);
          
          if (leads) {
            for (const lead of leads) {
              await zohoClient.syncContactToZoho({
                builder_id: builder.id,
                lead_id: lead.id,
                lead_data: lead,
              });
            }
          }
        }
        break;
        
      case 'incremental':
        // Sync leads modified since last sync
        const lastSyncAt = integration.last_sync_at;
        const { data: modifiedLeads } = await supabase
          .from('leads')
          .select('*')
          .eq('builder_id', builder.id)
          .gte('updated_at', lastSyncAt || new Date(0).toISOString());
        
        if (modifiedLeads) {
          for (const lead of modifiedLeads) {
            await zohoClient.syncContactToZoho({
              builder_id: builder.id,
              lead_id: lead.id,
              lead_data: lead,
            });
          }
        }
        break;
    }
    
    // Update last synced timestamp
    await supabase
      .from('integrations')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', integration.id);
    
    return NextResponse.json({
      success: true,
      message: 'Sync completed successfully'
    });
    
  } catch (error: any) {
    console.error('Zoho sync error:', error);
    return NextResponse.json(
      { error: error.message || 'Sync failed' },
      { status: 500 }
    );
  }
}

