import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { decrypt, getEncryptionKey } from '@/lib/security/encryption';

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
    
    // Get connection details
    const { data: connection, error: connError } = await supabase
      .from('zoho_crm_connections')
      .select('*')
      .eq('id', connection_id)
      .eq('builder_id', builder.id)
      .single();
    
    if (connError || !connection) {
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      );
    }
    
    // Check if token needs refresh
    const tokenExpiresAt = new Date(connection.token_expires_at);
    const now = new Date();
    
    const encryptionKey = getEncryptionKey();
    let accessToken = decrypt(connection.access_token, encryptionKey);
    
    if (tokenExpiresAt <= now) {
      // Refresh token
      const refreshedToken = await refreshZohoToken(
        decrypt(connection.refresh_token, encryptionKey),
        connection.zoho_data_center
      );
      
      if (!refreshedToken) {
        throw new Error('Failed to refresh token');
      }
      
      accessToken = refreshedToken.access_token;
      
      // Update connection
      const { encrypt } = await import('@/lib/security/encryption');
      await supabase
        .from('zoho_crm_connections')
        .update({
          access_token: encrypt(refreshedToken.access_token, encryptionKey),
          token_expires_at: new Date(Date.now() + (refreshedToken.expires_in * 1000)).toISOString()
        })
        .eq('id', connection_id);
    }
    
    const dataCenter = connection.zoho_data_center;
    const zohoApiBase = `https://www.zohoapis.${dataCenter}/crm/v3`;
    
    // Execute sync based on type
    switch (sync_type) {
      case 'initial':
      case 'full':
        await syncAllEntities(connection, accessToken, zohoApiBase, supabase);
        break;
        
      case 'lead':
        if (entity_id) {
          await syncSingleLead(entity_id, connection, accessToken, zohoApiBase, supabase);
        } else {
          await syncAllLeads(connection, accessToken, zohoApiBase, supabase);
        }
        break;
        
      case 'incremental':
        await syncIncrementalChanges(connection, accessToken, zohoApiBase, supabase);
        break;
    }
    
    // Update last synced timestamp
    await supabase
      .from('zoho_crm_connections')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('id', connection_id);
    
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

async function syncAllEntities(
  connection: any,
  accessToken: string,
  zohoApiBase: string,
  supabase: any
) {
  await syncAllLeads(connection, accessToken, zohoApiBase, supabase);
}

async function syncAllLeads(
  connection: any,
  accessToken: string,
  zohoApiBase: string,
  supabase: any
) {
  try {
    // Fetch all leads from Tharaga
    const { data: tharagaLeads } = await supabase
      .from('leads')
      .select(`
        *,
        properties (
          id,
          title,
          price,
          location
        )
      `)
      .eq('builder_id', connection.builder_id)
      .is('zoho_lead_id', null); // Only unsynced leads
    
    if (!tharagaLeads || tharagaLeads.length === 0) {
      return;
    }
    
    const fieldMappings = connection.field_mappings?.lead_fields || {};
    
    // Batch create leads in Zoho (max 100 per request)
    const batchSize = 100;
    for (let i = 0; i < tharagaLeads.length; i += batchSize) {
      const batch = tharagaLeads.slice(i, i + batchSize);
      
      const zohoLeadsData = batch.map((lead: any) => {
        const zohoLead: any = {};
        
        // Map fields
        Object.entries(fieldMappings).forEach(([tharagaField, zohoField]) => {
          if (lead[tharagaField]) {
            zohoLead[zohoField as string] = lead[tharagaField];
          }
        });
        
        // Add property details
        if (lead.properties) {
          zohoLead.Description = `Property: ${lead.properties.title}\nLocation: ${lead.properties.location}\nPrice: ₹${lead.properties.price?.toLocaleString('en-IN') || 'N/A'}`;
        }
        
        // Add custom fields
        zohoLead.Tharaga_Lead_ID = lead.id;
        zohoLead.Lead_Score = lead.ai_lead_score || 0;
        
        return zohoLead;
      });
      
      // Create leads in Zoho
      const response = await fetch(`${zohoApiBase}/Leads`, {
        method: 'POST',
        headers: {
          'Authorization': `Zoho-oauthtoken ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ data: zohoLeadsData })
      });
      
      const result = await response.json();
      
      if (result.data) {
        // Update Tharaga leads with Zoho IDs
        for (let j = 0; j < result.data.length; j++) {
          const zohoResult = result.data[j];
          const tharagaLead = batch[j];
          
          if (zohoResult.code === 'SUCCESS') {
            await supabase
              .from('leads')
              .update({ zoho_lead_id: zohoResult.details.id })
              .eq('id', tharagaLead.id);
            
            // Log sync
            await supabase.from('zoho_sync_logs').insert({
              connection_id: connection.id,
              sync_type: 'lead',
              sync_direction: 'tharaga_to_zoho',
              tharaga_record_id: tharagaLead.id,
              tharaga_record_type: 'lead',
              zoho_record_id: zohoResult.details.id,
              zoho_module: 'Leads',
              operation: 'create',
              status: 'success',
              request_payload: zohoLeadsData[j],
              response_payload: zohoResult
            });
          } else {
            // Log error
            await supabase.from('zoho_sync_logs').insert({
              connection_id: connection.id,
              sync_type: 'lead',
              sync_direction: 'tharaga_to_zoho',
              tharaga_record_id: tharagaLead.id,
              tharaga_record_type: 'lead',
              zoho_module: 'Leads',
              operation: 'create',
              status: 'failed',
              error_message: zohoResult.message,
              request_payload: zohoLeadsData[j],
              response_payload: zohoResult
            });
          }
        }
      }
    }
    
  } catch (error) {
    console.error('Lead sync error:', error);
    throw error;
  }
}

async function syncSingleLead(
  leadId: string,
  connection: any,
  accessToken: string,
  zohoApiBase: string,
  supabase: any
) {
  const startTime = Date.now();
  
  try {
    // Fetch lead from Tharaga
    const { data: lead } = await supabase
      .from('leads')
      .select(`
        *,
        properties (
          id,
          title,
          price,
          location,
          bhk_type
        )
      `)
      .eq('id', leadId)
      .single();
    
    if (!lead) {
      throw new Error('Lead not found');
    }
    
    const fieldMappings = connection.field_mappings?.lead_fields || {};
    const zohoLead: any = {};
    
    // Map fields
    Object.entries(fieldMappings).forEach(([tharagaField, zohoField]) => {
      if (lead[tharagaField]) {
        zohoLead[zohoField as string] = lead[tharagaField];
      }
    });
    
    // Add property context
    if (lead.properties) {
      zohoLead.Description = `Property: ${lead.properties.title}\nType: ${lead.properties.bhk_type}\nLocation: ${lead.properties.location}\nPrice: ₹${lead.properties.price?.toLocaleString('en-IN') || 'N/A'}`;
    }
    
    // Custom fields
    zohoLead.Tharaga_Lead_ID = lead.id;
    zohoLead.Lead_Score = lead.ai_lead_score || 0;
    
    let response, result, operation;
    
    if (lead.zoho_lead_id) {
      // Update existing lead
      operation = 'update';
      response = await fetch(`${zohoApiBase}/Leads/${lead.zoho_lead_id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Zoho-oauthtoken ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ data: [zohoLead] })
      });
    } else {
      // Create new lead
      operation = 'create';
      response = await fetch(`${zohoApiBase}/Leads`, {
        method: 'POST',
        headers: {
          'Authorization': `Zoho-oauthtoken ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ data: [zohoLead] })
      });
    }
    
    result = await response.json();
    
    const syncDuration = Date.now() - startTime;
    
    if (result.data && result.data[0].code === 'SUCCESS') {
      const zohoId = result.data[0].details.id;
      
      // Update Tharaga lead
      if (!lead.zoho_lead_id) {
        await supabase
          .from('leads')
          .update({ zoho_lead_id: zohoId })
          .eq('id', leadId);
      }
      
      // Log success
      await supabase.from('zoho_sync_logs').insert({
        connection_id: connection.id,
        sync_type: 'lead',
        sync_direction: 'tharaga_to_zoho',
        tharaga_record_id: leadId,
        tharaga_record_type: 'lead',
        zoho_record_id: zohoId,
        zoho_module: 'Leads',
        operation: operation,
        status: 'success',
        request_payload: zohoLead,
        response_payload: result.data[0],
        sync_duration_ms: syncDuration
      });
      
      return { success: true, zoho_id: zohoId };
    } else {
      throw new Error(result.data?.[0]?.message || 'Sync failed');
    }
    
  } catch (error: any) {
    // Log error
    await supabase.from('zoho_sync_logs').insert({
      connection_id: connection.id,
      sync_type: 'lead',
      sync_direction: 'tharaga_to_zoho',
      tharaga_record_id: leadId,
      tharaga_record_type: 'lead',
      zoho_module: 'Leads',
      operation: 'create',
      status: 'failed',
      error_message: error.message,
      sync_duration_ms: Date.now() - startTime
    });
    
    throw error;
  }
}

async function syncIncrementalChanges(
  connection: any,
  accessToken: string,
  zohoApiBase: string,
  supabase: any
) {
  // Sync only records modified since last sync
  const lastSyncedAt = connection.last_synced_at;
  
  if (!lastSyncedAt) {
    // If never synced, do full sync
    await syncAllLeads(connection, accessToken, zohoApiBase, supabase);
    return;
  }
  
  // Fetch leads modified since last sync
  const { data: modifiedLeads } = await supabase
    .from('leads')
    .select('*')
    .eq('builder_id', connection.builder_id)
    .gte('updated_at', lastSyncedAt);
  
  // Sync each modified lead
  for (const lead of modifiedLeads || []) {
    await syncSingleLead(lead.id, connection, accessToken, zohoApiBase, supabase);
  }
}

async function refreshZohoToken(
  refreshToken: string,
  dataCenter: string
) {
  try {
    const accountsUrl = {
      com: 'https://accounts.zoho.com',
      eu: 'https://accounts.zoho.eu',
      in: 'https://accounts.zoho.in',
      'com.au': 'https://accounts.zoho.com.au',
      jp: 'https://accounts.zoho.jp'
    }[dataCenter] || 'https://accounts.zoho.in';
    
    const response = await fetch(
      `${accountsUrl}/oauth/v2/token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: process.env.ZOHO_CLIENT_ID!,
          client_secret: process.env.ZOHO_CLIENT_SECRET!,
          refresh_token: refreshToken
        })
      }
    );
    
    if (!response.ok) {
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('Token refresh error:', error);
    return null;
  }
}
