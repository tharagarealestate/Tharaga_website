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

    const { billingCycle } = await request.json();

    if (!['monthly', 'yearly'].includes(billingCycle)) {
      return NextResponse.json(
        { error: 'Invalid billing cycle' },
        { status: 400 }
      );
    }

    const manager = new SubscriptionManager();
    const result = await manager.convertTrialToPaid(user.id, billingCycle);

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      razorpaySubscriptionId: result.razorpaySubscriptionId,
      razorpayOrderId: result.razorpayOrderId
    });

  } catch (error: any) {
    console.error('Convert trial API error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}




