// =============================================
// ZOHO CRM SYNC API
// POST /api/integrations/zoho/sync
// Syncs leads/deals to/from Zoho
// =============================================
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { zohoClient } from '@/lib/integrations/crm/zohoClient';
import { z } from 'zod';

export const runtime = 'nodejs';

const syncSchema = z.object({
  sync_type: z.enum(['lead', 'deal', 'batch']),
  lead_id: z.string().uuid().optional(),
  property_id: z.string().uuid().optional(),
  lead_ids: z.array(z.string().uuid()).optional(),
  direction: z.enum(['to_crm', 'from_crm']).default('to_crm'),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validated = syncSchema.parse(body);

    const builder_id = user.id;

    // Check connection status
    const status = await zohoClient.getConnectionStatus(builder_id);
    if (!status.connected) {
      return NextResponse.json(
        { error: 'Zoho CRM not connected. Please connect first.' },
        { status: 400 }
      );
    }

    let result;

    if (validated.sync_type === 'batch' && validated.lead_ids) {
      // Batch sync
      result = await zohoClient.batchSyncContacts({
        builder_id,
        lead_ids: validated.lead_ids,
      });

      return NextResponse.json({
        success: true,
        ...result,
      });
    } else if (validated.sync_type === 'lead' && validated.lead_id) {
      // Single lead sync
      if (validated.direction === 'from_crm') {
        // This would require contact_id from Zoho
        return NextResponse.json(
          { error: 'Use /api/integrations/zoho/sync-contact endpoint for from_crm sync' },
          { status: 400 }
        );
      }

      // Get lead data
      const { data: lead, error: leadError } = await supabase
        .from('auth.users')
        .select('*')
        .eq('id', validated.lead_id)
        .single();

      if (leadError || !lead) {
        return NextResponse.json(
          { error: 'Lead not found' },
          { status: 404 }
        );
      }

      result = await zohoClient.syncContactToZoho({
        builder_id,
        lead_id: validated.lead_id,
        lead_data: lead,
      });

      return NextResponse.json({
        success: result.success,
        zoho_id: result.zoho_id,
        error: result.error,
      });
    } else if (validated.sync_type === 'deal' && validated.lead_id && validated.property_id) {
      // Deal sync
      // Get deal data (you'll need to fetch this from your database)
      const deal_data = {
        property_title: 'Property Deal',
        property_price: 0,
        stage: 'new',
        // Add more fields as needed
      };

      result = await zohoClient.syncDealToZoho({
        builder_id,
        lead_id: validated.lead_id,
        property_id: validated.property_id,
        deal_data,
      });

      return NextResponse.json({
        success: result.success,
        zoho_id: result.zoho_id,
        error: result.error,
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid sync parameters' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error syncing to Zoho:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to sync' },
      { status: 500 }
    );
  }
}








