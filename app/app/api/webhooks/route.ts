import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { z } from 'zod';
import * as crypto from 'crypto';

export const runtime = 'nodejs';

const CreateWebhookSchema = z.object({
  name: z.string().min(1).max(100),
  url: z.string().url(),
  events: z.array(z.string()).min(1),
  authType: z.enum(['none', 'bearer', 'basic', 'api_key', 'hmac']).default('none'),
  authConfig: z.record(z.any()).optional(),
  headers: z.record(z.string()).optional(),
});

// GET - List webhooks
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const builderId = searchParams.get('builderId');

    if (!builderId) {
      return NextResponse.json({ error: 'Builder ID required' }, { status: 400 });
    }

    // Verify builder ownership
    const { data: builderProfile } = await supabase
      .from('builder_profiles')
      .select('id')
      .eq('id', builderId)
      .eq('user_id', user.id)
      .single();

    if (!builderProfile) {
      return NextResponse.json({ error: 'Builder not found' }, { status: 404 });
    }

    const { data: webhooks, error } = await supabase
      .from('webhook_endpoints')
      .select('*')
      .eq('builder_id', builderId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Mask sensitive webhook secret
    const sanitizedWebhooks = webhooks.map((w: any) => ({
      ...w,
      webhook_secret: w.webhook_secret ? '***configured***' : null,
    }));

    return NextResponse.json({ webhooks: sanitizedWebhooks });
  } catch (error: any) {
    console.error('Webhooks API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create webhook
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const builderId = body.builderId;

    if (!builderId) {
      return NextResponse.json({ error: 'Builder ID required' }, { status: 400 });
    }

    // Verify builder ownership
    const { data: builderProfile } = await supabase
      .from('builder_profiles')
      .select('id')
      .eq('id', builderId)
      .eq('user_id', user.id)
      .single();

    if (!builderProfile) {
      return NextResponse.json({ error: 'Builder not found' }, { status: 404 });
    }

    const validation = CreateWebhookSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Generate webhook secret
    const webhookSecret = `whsec_${crypto.randomBytes(32).toString('hex')}`;

    const { data: webhook, error } = await supabase
      .from('webhook_endpoints')
      .insert({
        builder_id: builderId,
        name: data.name,
        url: data.url,
        allowed_events: data.events,
        webhook_secret: webhookSecret,
        require_signature: data.authType === 'hmac',
        signature_algorithm: data.authType === 'hmac' ? 'sha256' : null,
        signature_header: data.authType === 'hmac' ? 'X-Tharaga-Signature' : null,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ webhook }, { status: 201 });
  } catch (error: any) {
    console.error('Create webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

