import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { PricingEngine } from '@/lib/pricing/pricing-engine';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const engine = new PricingEngine();
    const suggestion = await engine.suggestUpgrade(user.id);

    return NextResponse.json({
      success: true,
      ...suggestion
    });

  } catch (error: any) {
    console.error('Suggest upgrade error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

