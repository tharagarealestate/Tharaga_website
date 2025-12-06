/**
 * Ultra Automation - Deal Lifecycle API
 * GET /api/ultra-automation/deal-lifecycle?builder_id=xxx
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const builderId = searchParams.get('builder_id') || user.id;
    const stage = searchParams.get('stage'); // Specific lifecycle stage

    let query = supabase
      .from('deal_lifecycle')
      .select(`
        *,
        journey:buyer_journey(
          *,
          lead:generated_leads(*),
          property:properties(*)
        )
      `)
      .eq('builder_id', builderId)
      .order('created_at', { ascending: false });

    if (stage) {
      query = query.eq('current_stage', stage);
    }

    const { data: lifecycles, error } = await query;

    if (error) {
      console.error('[Ultra Automation] Deal Lifecycle API Error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch deal lifecycles' },
        { status: 500 }
      );
    }

    // Fetch payment milestones
    const lifecycleIds = (lifecycles || []).map((l: any) => l.id);
    let milestones: any[] = [];
    
    if (lifecycleIds.length > 0) {
      const { data: milestonesData } = await supabase
        .from('payment_milestones')
        .select('*')
        .in('lifecycle_id', lifecycleIds)
        .order('due_date', { ascending: true });
      
      milestones = milestonesData || [];
    }

    return NextResponse.json({
      success: true,
      data: {
        lifecycles: lifecycles || [],
        milestones,
      },
    });

  } catch (error) {
    console.error('[Ultra Automation] Deal Lifecycle API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

