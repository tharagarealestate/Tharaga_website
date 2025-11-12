// =============================================
// SMS MESSAGING API ENDPOINT
// POST /api/messaging/sms
// =============================================
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTwilioClient } from '@/lib/integrations/messaging/twilioClient';
import { z } from 'zod';

// Force Node.js runtime (Twilio SDK requires Node.js built-ins)
export const runtime = 'nodejs';

// Validation schema
const sendSMSSchema = z.object({
  to: z.string().min(10, 'Phone number must be at least 10 characters'),
  message: z.string().min(1).max(1600).optional(),
  template_id: z.string().uuid().optional(),
  variables: z.record(z.any()).optional(),
  lead_id: z.string().uuid().optional(),
});

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

    // Parse and validate request body
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const validated = sendSMSSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validated.error.errors 
        },
        { status: 400 }
      );
    }

    const { to, message, template_id, variables, lead_id } = validated.data;

    // Validate that either message or template_id is provided
    if (!message && !template_id) {
      return NextResponse.json(
        { error: 'Either message or template_id is required' },
        { status: 400 }
      );
    }

    // Get Twilio client
    const twilioClient = getTwilioClient();

    let result;

    if (template_id) {
      // Send using template
      result = await twilioClient.sendTemplateSMS({
        template_id,
        to,
        variables: variables || {},
      });
    } else if (message) {
      // Send direct message
      result = await twilioClient.sendSMS({
        to,
        body: message,
      });
    } else {
      return NextResponse.json(
        { error: 'Either message or template_id is required' },
        { status: 400 }
      );
    }

    if (!result.success) {
      return NextResponse.json(
        { 
          error: result.error || 'Failed to send SMS',
          success: false 
        },
        { status: 500 }
      );
    }

    // Return success response with message details
    return NextResponse.json({
      success: true,
      message_id: result.message_id,
      status: result.status,
      cost: result.cost,
    });
  } catch (error: any) {
    console.error('Error sending SMS:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Internal server error',
        success: false 
      },
      { status: 500 }
    );
  }
}

// GET endpoint for SMS status/history (optional)
export async function GET(request: NextRequest) {
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

    const url = new URL(request.url);
    const phone = url.searchParams.get('phone');
    const messageId = url.searchParams.get('message_id');
    const limit = parseInt(url.searchParams.get('limit') || '50');

    const twilioClient = getTwilioClient();

    if (messageId) {
      // Get specific message details
      const messageDetails = await twilioClient.getMessageDetails(messageId);
      if (!messageDetails) {
        return NextResponse.json(
          { error: 'Message not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ message: messageDetails });
    }

    if (phone) {
      // Get message history for a phone number
      const history = await twilioClient.getMessageHistory(phone, limit);
      return NextResponse.json({ messages: history });
    }

    return NextResponse.json(
      { error: 'Either phone or message_id parameter is required' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error fetching SMS:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

