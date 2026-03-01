import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { SubscriptionManager } from '@/lib/subscription/subscription-manager';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const manager = new SubscriptionManager();
    const status = await manager.getSubscriptionStatus(user.id);

    return NextResponse.json({
      success: true,
      subscription: status
    });

  } catch (error: any) {
    console.error('Get status API error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}




