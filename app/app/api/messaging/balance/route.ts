// =============================================
// TWILIO ACCOUNT BALANCE API
// GET /api/messaging/balance
// =============================================
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTwilioClient } from '@/lib/integrations/messaging/twilioClient';

// Force Node.js runtime (Twilio SDK requires Node.js built-ins)
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const twilioClient = getTwilioClient();
    const balance = await twilioClient.getAccountBalance();

    if (!balance) {
      return NextResponse.json(
        { error: 'Failed to fetch balance' },
        { status: 500 }
      );
    }

    return NextResponse.json({ balance });
  } catch (error: any) {
    console.error('Error fetching balance:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

