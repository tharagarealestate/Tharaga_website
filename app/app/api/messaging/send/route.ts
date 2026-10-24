// =============================================
// MESSAGING API - SEND SMS/WHATSAPP
// POST /api/messaging/send
// =============================================
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTwilioClient } from '@/lib/integrations/messaging/twilioClient';
import { z } from 'zod';

// Force Node.js runtime (Twilio SDK requires Node.js built-ins)
export const runtime = 'nodejs';

const sendMessageSchema = z.object({
  to: z.string().min(10),
  body: z.string().min(1).max(1600),
  type: z.enum(['sms', 'whatsapp']),
  mediaUrl: z.array(z.string().url()).optional(),
  lead_id: z.string().uuid().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const validated = sendMessageSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validated.error.errors },
        { status: 400 }
      );
    }

    const { to, body: messageBody, type, mediaUrl, lead_id } = validated.data;

    // Get Twilio client
    const twilioClient = getTwilioClient();

    // Send message
    let result;
    if (type === 'sms') {
      result = await twilioClient.sendSMS({
        to,
        body: messageBody,
        mediaUrl,
      });
    } else {
      result = await twilioClient.sendWhatsApp({
        to,
        body: messageBody,
        mediaUrl,
      });
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to send message' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message_id: result.message_id,
      status: result.status,
      cost: result.cost,
    });
  } catch (error: any) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

