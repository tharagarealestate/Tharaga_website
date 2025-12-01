/**
 * Ultra Automation - Negotiations API
 * GET /api/ultra-automation/negotiations?builder_id=xxx
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
    const status = searchParams.get('status'); // 'active', 'completed', 'cancelled'

    let query = supabase
      .from('negotiations')
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

    if (status) {
      query = query.eq('status', status);
    }

    const { data: negotiations, error } = await query;

    if (error) {
      console.error('[Ultra Automation] Negotiations API Error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch negotiations' },
        { status: 500 }
      );
    }

    // Fetch price strategy insights
    const negotiationIds = (negotiations || []).map((n: any) => n.id);
    let insights: any[] = [];
    
    if (negotiationIds.length > 0) {
      const { data: insightsData } = await supabase
        .from('price_strategy_insights')
        .select('*')
        .in('negotiation_id', negotiationIds)
        .order('created_at', { ascending: false });
      
      insights = insightsData || [];
    }

    return NextResponse.json({
      success: true,
      data: {
        negotiations: negotiations || [],
        insights,
      },
    });

  } catch (error) {
    console.error('[Ultra Automation] Negotiations API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

