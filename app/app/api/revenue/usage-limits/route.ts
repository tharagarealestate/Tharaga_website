import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { revenueService } from '@/lib/services/revenue';

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

    const limits = await revenueService.checkUsageLimits(builderProfile.id);
    return NextResponse.json(limits);
  } catch (error: any) {
    console.error('Usage limits API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch usage limits' },
      { status: 500 }
    );
  }
}



