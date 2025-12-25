import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { PlanManager } from '@/lib/pricing/plan-manager';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { planId, reason } = await request.json();

    if (!planId) {
      return NextResponse.json(
        { error: 'Plan ID is required' },
        { status: 400 }
      );
    }

    const manager = new PlanManager();
    const result = await manager.upgradePlan(user.id, planId, reason || 'User upgrade');

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      proratedAmount: result.proratedAmount
    });

  } catch (error: any) {
    console.error('Upgrade API error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

