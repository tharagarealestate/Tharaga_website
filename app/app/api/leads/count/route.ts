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
      .single();
    
    if (profile?.role !== 'builder') {
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
    
    // Also get counts by category for potential future use
    const { data: categoryCounts } = await supabase
      .from('leads')
      .select('score')
      .eq('builder_id', user.id);
    
    // Calculate category breakdown
    const hotLeads = categoryCounts?.filter(l => (l.score || 0) >= 9).length || 0;
    const warmLeads = categoryCounts?.filter(l => {
      const score = l.score || 0;
      return score >= 7 && score < 9;
    }).length || 0;
    
    // Get pending interactions count
    const { count: pendingCount } = await supabase
      .from('lead_interactions')
      .select('*', { count: 'exact', head: true })
      .eq('builder_id', user.id)
      .eq('status', 'pending');
    
    return NextResponse.json({
      success: true,
      data: {
        total: count || 0,
        hot: hotLeads,
        warm: warmLeads,
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

