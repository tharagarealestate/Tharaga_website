// =============================================
// LEADS COUNT API - LIGHTWEIGHT & FAST
// GET /api/leads/count
// Returns total lead count for the authenticated builder
// =============================================
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: true, data: { total: 0, hot: 0, warm: 0, pending_interactions: 0 } },
        { status: 200 }
      );
    }
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    
    if (!profile || profile.role !== 'builder') {
      return NextResponse.json(
        { success: true, data: { total: 0, hot: 0, warm: 0, pending_interactions: 0 } },
        { status: 200 }
      );
    }
    
    // Get counts - use Promise.all for parallel queries
    const [totalResult, hotResult, warmResult, pendingResult] = await Promise.all([
      supabase.from('leads').select('*', { count: 'exact', head: true }).eq('builder_id', user.id),
      supabase.from('leads').select('*', { count: 'exact', head: true }).eq('builder_id', user.id).gte('score', 9),
      supabase.from('leads').select('*', { count: 'exact', head: true }).eq('builder_id', user.id).gte('score', 7).lt('score', 9),
      supabase.from('lead_interactions').select('*', { count: 'exact', head: true }).eq('builder_id', user.id).eq('status', 'pending'),
    ]);
    
    return NextResponse.json({
      success: true,
      data: {
        total: totalResult.count || 0,
        hot: hotResult.count || 0,
        warm: warmResult.count || 0,
        pending_interactions: pendingResult.count || 0,
      },
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
      },
    });
    
  } catch (error: any) {
    console.error('[API/Leads/Count] Error:', error);
    // Always return 200 with zero counts to prevent 502
    return NextResponse.json({
      success: true,
      data: {
        total: 0,
        hot: 0,
        warm: 0,
        pending_interactions: 0,
      },
    }, { status: 200 });
  }
}
