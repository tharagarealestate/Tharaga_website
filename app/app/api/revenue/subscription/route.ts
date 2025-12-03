import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { revenueService } from '@/lib/services/revenue';
import { z } from 'zod';

const CreateSubscriptionSchema = z.object({
  planSlug: z.string(),
  billingCycle: z.enum(['monthly', 'yearly']),
  couponCode: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get builder profile
    const { data: builderProfile } = await supabase
      .from('builder_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!builderProfile) {
      return NextResponse.json({ error: 'Builder profile not found' }, { status: 404 });
    }

    const subscription = await revenueService.getSubscription(builderProfile.id);
    return NextResponse.json({ subscription });
  } catch (error: any) {
    console.error('Subscription API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = CreateSubscriptionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    // Get builder profile
    const { data: builderProfile } = await supabase
      .from('builder_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!builderProfile) {
      return NextResponse.json({ error: 'Builder profile not found' }, { status: 404 });
    }

    const result = await revenueService.createSubscription(
      builderProfile.id,
      validation.data.planSlug,
      validation.data.billingCycle,
      validation.data.couponCode
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Create subscription API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create subscription' },
      { status: 500 }
    );
  }
}



