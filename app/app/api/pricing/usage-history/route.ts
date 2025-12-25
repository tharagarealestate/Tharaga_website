import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30days';
    
    let days = 30;
    if (period === '7days') days = 7;
    else if (period === '90days') days = 90;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: usage, error } = await supabase
      .from('property_quota_usage')
      .select('*')
      .eq('builder_id', user.id)
      .gte('snapshot_date', startDate.toISOString().split('T')[0])
      .order('snapshot_date', { ascending: true });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      usage: usage || []
    });

  } catch (error: any) {
    console.error('Usage history error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

