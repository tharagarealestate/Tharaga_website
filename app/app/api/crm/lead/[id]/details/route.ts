// =============================================
// CRM LEAD DETAILS API
// GET /api/crm/lead/[id]/details
// =============================================

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { secureApiRoute } from '@/lib/security/api-security';
import { Permissions } from '@/lib/security/permissions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = secureApiRoute(
  async (request: NextRequest, user, context) => {
    const supabase = createRouteHandlerClient({ cookies });
    const { params } = context as { params: { id: string } };
    const leadId = params.id;

    try {
      // Check if lead exists in CRM mapping
      const { data: mapping } = await supabase
        .from('crm_record_mappings')
        .select('crm_id, last_synced_at')
        .eq('tharaga_id', leadId)
        .eq('record_type', 'lead')
        .maybeSingle();

      if (!mapping?.crm_id) {
        return NextResponse.json({
          success: true,
          synced: false,
          message: 'Lead not synced with Zoho CRM yet',
        });
      }

      // Get builder ID from lead
      const { data: lead } = await supabase
        .from('leads')
        .select('builder_id')
        .eq('id', leadId)
        .single();

      if (!lead) {
        return NextResponse.json({
          success: false,
          error: 'Lead not found',
        }, { status: 404 });
      }

      // Check authorization
      if (user.role !== 'admin' && lead.builder_id !== user.id) {
        return NextResponse.json({
          success: false,
          error: 'Not authorized',
        }, { status: 403 });
      }

      // Get Zoho credentials
      const { data: integration } = await supabase
        .from('integrations')
        .select('credentials')
        .eq('builder_id', lead.builder_id)
        .eq('platform', 'zoho_crm')
        .eq('status', 'active')
        .maybeSingle();

      if (!integration?.credentials) {
        return NextResponse.json({
          success: true,
          synced: false,
          message: 'Zoho CRM not connected',
        });
      }

      const creds = integration.credentials as any;

      // Fetch from Zoho CRM
      const response = await fetch(
        `${creds.api_domain}/crm/v2/Contacts/${mapping.crm_id}`,
        {
          headers: {
            'Authorization': `Zoho-oauthtoken ${creds.access_token}`,
          },
        }
      );

      if (!response.ok) {
        console.error('[API/CRM/Details] Zoho error:', await response.text());
        return NextResponse.json({
          success: false,
          error: 'Failed to fetch from Zoho CRM',
        }, { status: 500 });
      }

      const zohoData = await response.json();
      const contact = zohoData.data?.[0];

      if (!contact) {
        return NextResponse.json({
          success: false,
          error: 'Contact not found in Zoho',
        }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        synced: true,
        last_synced_at: mapping.last_synced_at,
        zoho_id: mapping.crm_id,
        data: {
          Full_Name: contact.Full_Name,
          Email: contact.Email,
          Mobile: contact.Mobile,
          Lead_Status: contact.Lead_Status,
          Lead_Source: contact.Lead_Source,
          Budget_Min: contact.Budget_Min,
          Budget_Max: contact.Budget_Max,
          Property_Type: contact.Property_Type,
          Preferred_Location: contact.Preferred_Location,
          Description: contact.Description,
        },
      });

    } catch (error: any) {
      console.error('[API/CRM/Details] Error:', error);
      return NextResponse.json({
        success: false,
        error: error.message || 'Failed to fetch CRM details',
      }, { status: 500 });
    }
  },
  {
    requireAuth: true,
    requireRole: ['builder', 'admin'],
    requirePermission: Permissions.INTEGRATION_VIEW,
    rateLimit: 'api',
  }
);
