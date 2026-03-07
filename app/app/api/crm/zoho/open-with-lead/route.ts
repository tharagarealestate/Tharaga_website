// =============================================
// ZOHO CRM - OPEN WITH LEAD DETAILS
// Opens Zoho CRM with lead details pre-filled
// =============================================
import { NextRequest, NextResponse } from 'next/server';
import { requireBuilder, createErrorResponse } from '@/lib/auth/api-auth-helper';
import { zohoClient } from '@/lib/integrations/crm/zohoClient';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { user, builder, supabase, error: authError } = await requireBuilder(request);
    
    if (authError) {
      const statusCode = authError.type === 'NOT_BUILDER' ? 403 : 
                        authError.type === 'CONFIG_ERROR' ? 500 : 401;
      return createErrorResponse(authError as any, statusCode);
    }
    
    if (!builder || !supabase) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Builder profile not found',
          errorType: 'NOT_FOUND',
          message: 'Please complete your builder profile setup to use Zoho CRM.',
        },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { lead_id } = body;

    if (!lead_id) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Lead ID is required',
          errorType: 'MISSING_PARAMETER',
        },
        { status: 400 }
      );
    }

    // Check if Zoho is connected
    const { data: integration, error: intError } = await supabase
      .from('integrations')
      .select('*')
      .eq('builder_id', builder.id)
      .eq('integration_type', 'crm')
      .eq('provider', 'zoho')
      .eq('is_active', true)
      .eq('is_connected', true)
      .single();

    if (intError || !integration) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Zoho CRM not connected',
          errorType: 'NOT_CONNECTED',
          message: 'Please connect your Zoho CRM account first.',
          connectUrl: '/builder/integrations?provider=zoho',
        },
        { status: 400 }
      );
    }

    // Get lead details
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*, property:properties(*)')
      .eq('id', lead_id)
      .eq('builder_id', builder.id)
      .single();

    if (leadError || !lead) {
      // Try alternative: get from lead_scores or profiles
      const { data: leadScore } = await supabase
        .from('lead_scores')
        .select('*, user:profiles!lead_scores_user_id_fkey(*)')
        .eq('id', lead_id)
        .maybeSingle();

      if (!leadScore) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Lead not found',
            errorType: 'NOT_FOUND',
          },
          { status: 404 }
        );
      }

      // Use lead score data
      const leadData = {
        email: leadScore.user?.email || '',
        phone: leadScore.user?.phone || '',
        name: leadScore.user?.full_name || leadScore.user?.email?.split('@')[0] || 'Unknown',
        score: leadScore.score || 0,
        category: leadScore.category || 'warm',
      };

      // Check if contact exists in Zoho
      const config = integration.config as any;

      // Try to find existing contact in Zoho
      const existingContact = await zohoClient.searchContacts({
        builder_id: builder.id,
        email: leadData.email,
      });

      if (existingContact && existingContact.length > 0) {
        // Contact exists - open Zoho with contact ID
        const contactId = existingContact[0].id;
        const zohoUrl = `${config.api_domain || 'https://www.zohoapis.in'}/crm/v2/Contacts/${contactId}`;
        
        return NextResponse.json({
          success: true,
          action: 'open_existing',
          zohoUrl: `https://crm.zoho.in/crm/${integration.crm_account_id}/tab/Contacts/${contactId}`,
          contactId,
          message: 'Opening existing contact in Zoho CRM',
        });
      } else {
        // Create new contact in Zoho
        const syncResult = await zohoClient.syncContactToZoho({
          builder_id: builder.id,
          lead_id: lead_id,
          lead_data: {
            email: leadData.email,
            phone: leadData.phone,
            raw_user_meta_data: {
              full_name: leadData.name,
            },
          },
        });

        if (syncResult.success && syncResult.zoho_id) {
          return NextResponse.json({
            success: true,
            action: 'created_and_open',
            zohoUrl: `https://crm.zoho.in/crm/${integration.crm_account_id}/tab/Contacts/${syncResult.zoho_id}`,
            contactId: syncResult.zoho_id,
            message: 'Contact created and opened in Zoho CRM',
          });
        } else {
          return NextResponse.json(
            { 
              success: false,
              error: syncResult.error || 'Failed to create contact',
              errorType: 'SYNC_ERROR',
            },
            { status: 500 }
          );
        }
      }
    }

    // Use lead data from leads table
    const leadData = {
      email: lead.email || '',
      phone: lead.phone || '',
      name: lead.name || lead.email?.split('@')[0] || 'Unknown',
      property: lead.property,
    };

    // Check if contact exists in Zoho
    const config = integration.config as any;

    // Try to find existing contact
    const existingContact = await zohoClient.searchContacts({
      builder_id: builder.id,
      email: leadData.email,
    });

    if (existingContact && existingContact.length > 0) {
      const contactId = existingContact[0].id;
      return NextResponse.json({
        success: true,
        action: 'open_existing',
        zohoUrl: `https://crm.zoho.in/crm/${integration.crm_account_id}/tab/Contacts/${contactId}`,
        contactId,
        message: 'Opening existing contact in Zoho CRM',
      });
    } else {
      // Create new contact
      const syncResult = await zohoClient.syncContactToZoho({
        builder_id: builder.id,
        lead_id: lead_id,
        lead_data: {
          email: leadData.email,
          phone: leadData.phone,
          raw_user_meta_data: {
            full_name: leadData.name,
          },
        },
      });

      if (syncResult.success && syncResult.zoho_id) {
        return NextResponse.json({
          success: true,
          action: 'created_and_open',
          zohoUrl: `https://crm.zoho.in/crm/${integration.crm_account_id}/tab/Contacts/${syncResult.zoho_id}`,
          contactId: syncResult.zoho_id,
          message: 'Contact created and opened in Zoho CRM',
        });
      } else {
        return NextResponse.json(
          { 
            success: false,
            error: syncResult.error || 'Failed to create contact',
            errorType: 'SYNC_ERROR',
          },
          { status: 500 }
        );
      }
    }
  } catch (error: any) {
    console.error('Error opening Zoho with lead:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to open Zoho CRM',
        errorType: 'UNKNOWN_ERROR',
      },
      { status: 500 }
    );
  }
}

