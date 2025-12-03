import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { webhookService } from '@/lib/webhooks/webhook-service';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership
    const { data: endpoint } = await supabase
      .from('webhook_endpoints')
      .select('builder_id')
      .eq('id', params.id)
      .single();

    if (!endpoint) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    }

    // Verify builder ownership
    const { data: builderProfile } = await supabase
      .from('builder_profiles')
      .select('id')
      .eq('id', endpoint.builder_id)
      .eq('user_id', user.id)
      .single();

    if (!builderProfile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const result = await webhookService.testEndpoint(params.id);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Test webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

