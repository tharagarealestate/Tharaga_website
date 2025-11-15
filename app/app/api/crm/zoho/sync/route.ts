// =============================================
// ZOHO CRM SYNC
// Sync leads, deals, and other records
// =============================================
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { zohoClient } from '@/lib/integrations/crm/zohoClient';

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

    const body = await request.json();
    const {
      sync_type, // 'to_crm', 'from_crm', 'bidirectional'
      record_type, // 'lead', 'deal', 'all'
      record_ids, // Optional: specific records to sync
      force = false, // Force sync even if recently synced
      builder_id, // Optional: for initial sync from callback
    } = body;

    // Use builder_id from request or authenticated user
    const actual_builder_id = builder_id || user.id;

    // Security check: builder_id must match authenticated user
    if (builder_id && builder_id !== user.id) {
      return NextResponse.json(
        { 
          error: 'Unauthorized: builder_id does not match authenticated user',
          success: false,
        },
        { status: 403 }
      );
    }

    // Validate sync_type
    if (!sync_type || !['to_crm', 'from_crm', 'bidirectional'].includes(sync_type)) {
      return NextResponse.json(
        { 
          error: 'Invalid sync_type. Must be: to_crm, from_crm, or bidirectional',
          success: false,
        },
        { status: 400 }
      );
    }

    // Check if Zoho is connected
    const { data: integration } = await supabase
      .from('integrations')
      .select('id, last_sync_at, config, total_actions, successful_actions, failed_actions')
      .eq('builder_id', actual_builder_id)
      .eq('integration_type', 'crm')
      .eq('provider', 'zoho')
      .eq('is_active', true)
      .single();

    if (!integration) {
      return NextResponse.json(
        { 
          error: 'Zoho CRM not connected. Please connect first.',
          success: false,
        },
        { status: 400 }
      );
    }

    // Check last sync time (rate limiting) - only for non-initial syncs
    if (!force && integration.last_sync_at && !builder_id) {
      const lastSync = new Date(integration.last_sync_at);
      const now = new Date();
      const timeSinceSync = now.getTime() - lastSync.getTime();
      const minSyncInterval = 5 * 60 * 1000; // 5 minutes

      if (timeSinceSync < minSyncInterval) {
        const remainingTime = Math.ceil((minSyncInterval - timeSinceSync) / 1000);
        return NextResponse.json({
          error: `Please wait ${remainingTime} seconds before syncing again`,
          retry_after: remainingTime,
          success: false,
        }, { status: 429 });
      }
    }

    // Handle initial sync
    if (sync_type === 'initial' || (builder_id && !record_type)) {
      return NextResponse.json({
        success: true,
        message: 'Initial sync triggered successfully',
        sync_type: 'initial',
      });
    }

    // Start sync process
    const syncResults = {
      started_at: new Date().toISOString(),
      sync_type,
      record_type: record_type || 'all',
      leads: { successful: 0, failed: 0, errors: [] as string[] },
      deals: { successful: 0, failed: 0, errors: [] as string[] },
      total_synced: 0,
      total_failed: 0,
    };

    // Sync leads
    if (!record_type || record_type === 'lead' || record_type === 'all') {
      if (sync_type === 'to_crm' || sync_type === 'bidirectional') {
        const leadResult = await syncLeadsToCRM(actual_builder_id, record_ids);
        syncResults.leads.successful = leadResult.successful;
        syncResults.leads.failed = leadResult.failed;
        syncResults.leads.errors = leadResult.errors;
      }

      if (sync_type === 'from_crm' || sync_type === 'bidirectional') {
        const leadResult = await syncLeadsFromCRM(actual_builder_id, record_ids);
        syncResults.leads.successful += leadResult.successful;
        syncResults.leads.failed += leadResult.failed;
        syncResults.leads.errors.push(...leadResult.errors);
      }
    }

    // Sync deals
    if (!record_type || record_type === 'deal' || record_type === 'all') {
      if (sync_type === 'to_crm' || sync_type === 'bidirectional') {
        const dealResult = await syncDealsToCRM(actual_builder_id, record_ids);
        syncResults.deals.successful = dealResult.successful;
        syncResults.deals.failed = dealResult.failed;
        syncResults.deals.errors = dealResult.errors;
      }
    }

    // Calculate totals
    syncResults.total_synced = syncResults.leads.successful + syncResults.deals.successful;
    syncResults.total_failed = syncResults.leads.failed + syncResults.deals.failed;

    // Update last sync time and statistics
    const currentTotal = integration.total_actions || 0;
    const currentSuccessful = integration.successful_actions || 0;
    const currentFailed = integration.failed_actions || 0;

    await supabase
      .from('integrations')
      .update({
        last_sync_at: new Date().toISOString(),
        total_actions: currentTotal + syncResults.total_synced + syncResults.total_failed,
        successful_actions: currentSuccessful + syncResults.total_synced,
        failed_actions: currentFailed + syncResults.total_failed,
        updated_at: new Date().toISOString(),
      })
      .eq('id', integration.id);

    return NextResponse.json({ 
      success: true,
      results: syncResults,
      completed_at: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error syncing with Zoho:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to sync with Zoho CRM',
        success: false,
      },
      { status: 500 }
    );
  }
}

/**
 * Sync leads to Zoho CRM
 */
async function syncLeadsToCRM(
  builder_id: string,
  lead_ids?: string[]
): Promise<{ successful: number; failed: number; errors: string[] }> {
  const supabase = createClient();
  let successful = 0;
  let failed = 0;
  const errors: string[] = [];

  try {
    // Get leads to sync
    let query = supabase
      .from('auth.users')
      .select('*')
      .eq('raw_user_meta_data->>user_type', 'buyer');

    if (lead_ids && lead_ids.length > 0) {
      query = query.in('id', lead_ids);
    } else {
      // Sync leads from last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      query = query.gte('created_at', thirtyDaysAgo.toISOString());
    }

    const { data: leads, error } = await query.limit(100); // Limit to 100 per sync

    if (error) {
      // If error accessing auth.users, try profiles table
      console.warn('Error accessing auth.users, trying profiles table:', error);
      
      // Alternative: Use profiles table if available
      let profileQuery = supabase
        .from('profiles')
        .select('*')
        .eq('user_type', 'buyer');

      if (lead_ids && lead_ids.length > 0) {
        profileQuery = profileQuery.in('user_id', lead_ids);
      } else {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        profileQuery = profileQuery.gte('created_at', thirtyDaysAgo.toISOString());
      }

      const { data: profiles, error: profileError } = await profileQuery.limit(100);
      
      if (profileError) throw profileError;

      // Sync each profile as a lead
      for (const profile of profiles || []) {
        const result = await zohoClient.syncContactToZoho({
          builder_id,
          lead_id: profile.user_id,
          lead_data: {
            email: profile.email,
            phone: profile.phone,
            raw_user_meta_data: {
              full_name: profile.full_name,
            },
          },
        });

        if (result.success) {
          successful++;
        } else {
          failed++;
          errors.push(`${profile.email || profile.user_id}: ${result.error}`);
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 600));
      }

      return { successful, failed, errors };
    }

    // Sync each lead
    for (const lead of leads || []) {
      const result = await zohoClient.syncContactToZoho({
        builder_id,
        lead_id: lead.id,
        lead_data: lead,
      });

      if (result.success) {
        successful++;
      } else {
        failed++;
        errors.push(`${lead.email || lead.id}: ${result.error}`);
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 600));
    }

    return { successful, failed, errors };
  } catch (error: any) {
    console.error('Error syncing leads to CRM:', error);
    return { successful, failed, errors: [...errors, error.message] };
  }
}

/**
 * Sync leads from Zoho CRM
 */
async function syncLeadsFromCRM(
  builder_id: string,
  contact_ids?: string[]
): Promise<{ successful: number; failed: number; errors: string[] }> {
  let successful = 0;
  let failed = 0;
  const errors: string[] = [];

  try {
    // If specific contact IDs provided, sync those
    if (contact_ids && contact_ids.length > 0) {
      for (const contact_id of contact_ids) {
        const result = await zohoClient.syncContactFromZoho({
          builder_id,
          contact_id,
        });

        if (result.success) {
          successful++;
        } else {
          failed++;
          errors.push(`Contact ${contact_id}: ${result.error}`);
        }

        await new Promise(resolve => setTimeout(resolve, 600));
      }
    } else {
      // Otherwise, this would require fetching recent contacts from Zoho
      // For now, we'll skip automatic pull and only do it on-demand
      console.log('Automatic sync from Zoho not implemented - use webhooks or manual sync');
    }

    return { successful, failed, errors };
  } catch (error: any) {
    console.error('Error syncing leads from CRM:', error);
    return { successful, failed, errors: [...errors, error.message] };
  }
}

/**
 * Sync deals to Zoho CRM
 */
async function syncDealsToCRM(
  builder_id: string,
  deal_ids?: string[]
): Promise<{ successful: number; failed: number; errors: string[] }> {
  const supabase = createClient();
  let successful = 0;
  let failed = 0;
  const errors: string[] = [];

  try {
    // Get deals to sync from lead_pipeline
    let query = supabase
      .from('lead_pipeline')
      .select('*')
      .eq('builder_id', builder_id);

    if (deal_ids && deal_ids.length > 0) {
      query = query.in('id', deal_ids);
    } else {
      // Sync recent pipeline items
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      query = query.gte('created_at', thirtyDaysAgo.toISOString());
    }

    const { data: deals, error } = await query.limit(100);

    if (error) {
      console.error('Error fetching deals:', error);
      throw error;
    }

    // Sync each deal
    for (const deal of deals || []) {
      if (!deal.lead_id) {
        errors.push(`Deal ${deal.id}: Missing lead`);
        failed++;
        continue;
      }

      // Get lead details from lead_scores or profiles
      let leadName = 'Unknown Lead';
      let leadEmail: string | null = null;
      let userId: string | null = null;

      // Try to get lead info from lead_scores
      const { data: leadScore } = await supabase
        .from('lead_scores')
        .select('user_id, user:profiles!lead_scores_user_id_fkey (full_name, email)')
        .eq('id', deal.lead_id)
        .maybeSingle();

      if (leadScore?.user) {
        leadName = leadScore.user.full_name || leadScore.user.email?.split('@')[0] || 'Unknown Lead';
        leadEmail = leadScore.user.email;
        userId = leadScore.user_id;
      } else {
        // Fallback: try profiles directly
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .eq('id', deal.lead_id)
          .maybeSingle();

        if (profile) {
          leadName = profile.full_name || profile.email?.split('@')[0] || 'Unknown Lead';
          leadEmail = profile.email;
          userId = profile.id;
        }
      }

      // Try to get property from leads table or user_behavior
      let property_id: string | null = null;
      let property: any = null;

      // First, try to get property from leads table
      if (leadEmail) {
        const { data: leadData } = await supabase
          .from('leads')
          .select('property_id')
          .eq('builder_id', builder_id)
          .eq('email', leadEmail)
          .maybeSingle();

        if (leadData?.property_id) {
          property_id = leadData.property_id;
        }
      }

      // If no property from leads, try user_behavior
      if (!property_id && userId) {
        const { data: behaviorData } = await supabase
          .from('user_behavior')
          .select('property_id')
          .eq('user_id', userId)
          .eq('behavior_type', 'property_view')
          .order('timestamp', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (behaviorData?.property_id) {
          property_id = behaviorData.property_id;
        }
      }

      // Get property details if we have a property_id
      if (property_id) {
        const { data: propData } = await supabase
          .from('properties')
          .select('id, title, price_inr, location, property_type')
          .eq('id', property_id)
          .single();
        property = propData;
      }

      // If no property found, use a placeholder
      if (!property_id) {
        property_id = deal.id; // Use deal ID as placeholder
      }

      const dealData = {
        property_title: property?.title || 'Property Deal',
        property_price: property?.price_inr || deal.deal_value || 0,
        property_location: property?.location || '',
        property_type: property?.property_type || '',
        stage: deal.stage || 'new',
        expected_close_date: deal.expected_close_date || null,
        deal_value: deal.deal_value || property?.price_inr || 0,
        lead_name: leadName,
      };

      const result = await zohoClient.syncDealToZoho({
        builder_id,
        lead_id: deal.lead_id,
        property_id: property_id,
        deal_data: dealData,
      });

      if (result.success) {
        successful++;
      } else {
        failed++;
        errors.push(`Deal ${deal.id}: ${result.error}`);
      }

      await new Promise(resolve => setTimeout(resolve, 600));
    }

    return { successful, failed, errors };
  } catch (error: any) {
    console.error('Error syncing deals to CRM:', error);
    return { successful, failed, errors: [...errors, error.message] };
  }
}
