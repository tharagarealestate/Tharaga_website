import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PricingEngine } from '@/lib/pricing/pricing-engine';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const engine = new PricingEngine();
    const quota = await engine.canAddProperty(user.id);

    return NextResponse.json({
      success: true,
      quota
    });

  } catch (error: any) {
    console.error('Check quota error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}


