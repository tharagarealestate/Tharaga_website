// =============================================
// LEADS COUNT API - LIGHTWEIGHT & FAST
// GET /api/leads/count
// Returns total lead count for the authenticated builder
// =============================================
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createClient();
    
    // =============================================
    // AUTHENTICATION
    // =============================================
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Verify user is a builder
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    
    if (!profile || profile.role !== 'builder') {
      return NextResponse.json(
        { error: 'Forbidden - Builders only' },
        { status: 403 }
      );
    }
    
    // =============================================
    // GET LEAD COUNT
    // =============================================
    
    // Fast count query - only count, no data fetching
    const { count, error: countError } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('builder_id', user.id);
    
    if (countError) {
      console.error('[API/Leads/Count] Error:', countError);
      return NextResponse.json(
        { error: 'Failed to fetch lead count' },
        { status: 500 }
      );
    }
    
    // Get counts by category efficiently using count queries
    // Hot leads (score >= 9)
    const { count: hotCount, error: hotError } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('builder_id', user.id)
      .gte('score', 9);
    
    if (hotError) {
      console.error('[API/Leads/Count] Hot leads count error:', hotError);
    }
    
    // Warm leads (score >= 7 and < 9)
    const { count: warmCount, error: warmError } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('builder_id', user.id)
      .gte('score', 7)
      .lt('score', 9);
    
    if (warmError) {
      console.error('[API/Leads/Count] Warm leads count error:', warmError);
    }
    
    // Get pending interactions count
    const { count: pendingCount, error: pendingError } = await supabase
      .from('lead_interactions')
      .select('*', { count: 'exact', head: true })
      .eq('builder_id', user.id)
      .eq('status', 'pending');
    
    if (pendingError) {
      console.error('[API/Leads/Count] Pending interactions count error:', pendingError);
    }
    
    return NextResponse.json({
      success: true,
      data: {
        total: count || 0,
        hot: hotCount || 0,
        warm: warmCount || 0,
        pending_interactions: pendingCount || 0,
      },
    }, {
      // Cache for 10 seconds to reduce load, but allow real-time updates
      headers: {
        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
      },
    });
    
  } catch (error) {
    console.error('[API/Leads/Count] Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

