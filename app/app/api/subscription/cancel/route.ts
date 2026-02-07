import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { SubscriptionManager } from '@/lib/subscription/subscription-manager';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reason, immediate } = await request.json();

    const manager = new SubscriptionManager();
    const result = await manager.cancelSubscription(
      user.id,
      reason || 'User requested cancellation',
      immediate || false
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      effectiveDate: result.effectiveDate
    });

  } catch (error: any) {
    console.error('Cancel subscription API error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}




