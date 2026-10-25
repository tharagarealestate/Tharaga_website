// =============================================
// WHATSAPP MESSAGING API ENDPOINT
// POST /api/messaging/whatsapp
// =============================================
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { twilioClient } from '@/lib/integrations/messaging/twilioClient';

// Force Node.js runtime (Twilio SDK requires Node.js built-ins)
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { to, message, template_id, variables, media_url } = body;

    let result;

    if (template_id) {
      // Send using template
      result = await twilioClient.sendTemplateWhatsApp({
        template_id,
        to,
        variables: variables || {},
      });
    } else if (message) {
      // Send direct message
      result = await twilioClient.sendWhatsApp({
        to,
        body: message,
        mediaUrl: media_url,
      });
    } else {
      return NextResponse.json(
        { error: 'Either message or template_id is required' },
        { status: 400 }
      );
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error sending WhatsApp:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

