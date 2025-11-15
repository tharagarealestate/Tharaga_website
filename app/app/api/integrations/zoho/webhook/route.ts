// =============================================
// ZOHO CRM WEBHOOK API
// POST /api/integrations/zoho/webhook
// Handles webhooks from Zoho
// =============================================
import { NextRequest, NextResponse } from 'next/server';
import { zohoClient } from '@/lib/integrations/crm/zohoClient';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();

    // Verify webhook (add signature verification if needed)
    // For now, we'll process the webhook

    await zohoClient.handleWebhook(payload);

    return NextResponse.json({
      success: true,
      message: 'Webhook processed',
    });
  } catch (error: any) {
    console.error('Error processing Zoho webhook:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process webhook' },
      { status: 500 }
    );
  }
}







