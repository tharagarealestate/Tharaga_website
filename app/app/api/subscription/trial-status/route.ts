import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { TrialManager } from '@/lib/subscription/trial-manager';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const trialManager = new TrialManager();
    const trialStatus = await trialManager.getTrialStatus(user.id);

    if (!trialStatus) {
      return NextResponse.json({
        success: false,
        message: 'No active trial found'
      });
    }

    return NextResponse.json({
      success: true,
      trial: trialStatus
    });

  } catch (error: any) {
    console.error('Get trial status API error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}




