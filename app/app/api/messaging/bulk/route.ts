// =============================================
// BULK MESSAGING API
// POST /api/messaging/bulk
// API endpoint for bulk messaging campaigns
// =============================================
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { twilioClient } from '@/lib/integrations/messaging/twilioClient';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { type, recipients, message, template_id, campaign_id } = body;

    // Validate type
    if (!['sms', 'whatsapp'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be "sms" or "whatsapp"' },
        { status: 400 }
      );
    }

    // Validate recipients
    if (!Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        { error: 'Recipients array is required and must not be empty' },
        { status: 400 }
      );
    }

    // Limit bulk size
    if (recipients.length > 100) {
      return NextResponse.json(
        { error: 'Maximum 100 recipients per bulk request' },
        { status: 400 }
      );
    }

    let result;

    if (type === 'sms') {
      result = await twilioClient.sendBulkSMS({
        recipients,
        body: message,
        template_id,
        campaign_id,
      });
    } else {
      result = await twilioClient.sendBulkWhatsApp({
        recipients,
        body: message,
        template_id,
        campaign_id,
      });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error sending bulk messages:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

