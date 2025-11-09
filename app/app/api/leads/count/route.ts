// =============================================
// LEADS COUNT API - LIGHTWEIGHT & FAST
// GET /api/leads/count
// Returns total lead count for the authenticated builder
// =============================================
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Use nodejs runtime for Supabase auth helpers compatibility
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // =============================================
    // AUTHENTICATION
    // =============================================
    
    let user;
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authData?.user) {
        return NextResponse.json(
          { error: 'Unauthorized', details: authError?.message },
          { status: 401 }
        );
      }
      
      user = authData.user;
    } catch (authErr: any) {
      console.error('[API/Leads/Count] Auth error:', authErr);
      return NextResponse.json(
        { error: 'Authentication failed', details: authErr?.message },
        { status: 401 }
      );
    }
    
    // Verify user is a builder
    let profile;
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
      
      if (profileError) {
        console.error('[API/Leads/Count] Profile fetch error:', profileError);
        return NextResponse.json(
          { error: 'Failed to verify user role', details: profileError.message },
          { status: 500 }
        );
      }
      
      profile = profileData;
    } catch (profileErr: any) {
      console.error('[API/Leads/Count] Profile error:', profileErr);
      return NextResponse.json(
        { error: 'Profile verification failed', details: profileErr?.message },
        { status: 500 }
      );
    }
    
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
    let totalCount = 0;
    try {
      const { count, error: countError } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('builder_id', user.id);
      
      if (countError) {
        console.error('[API/Leads/Count] Total count error:', countError);
        // Continue with 0 if count fails
      } else {
        totalCount = count || 0;
      }
    } catch (countErr: any) {
      console.error('[API/Leads/Count] Total count exception:', countErr);
      // Continue with 0
    }
    
    // Get counts by category efficiently using count queries
    // Hot leads (score >= 9)
    let hotCount = 0;
    try {
      const { count, error: hotError } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('builder_id', user.id)
        .gte('score', 9);
      
      if (hotError) {
        console.error('[API/Leads/Count] Hot leads count error:', hotError);
      } else {
        hotCount = count || 0;
      }
    } catch (hotErr: any) {
      console.error('[API/Leads/Count] Hot count exception:', hotErr);
    }
    
    // Warm leads (score >= 7 and < 9)
    let warmCount = 0;
    try {
      const { count, error: warmError } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('builder_id', user.id)
        .gte('score', 7)
        .lt('score', 9);
      
      if (warmError) {
        console.error('[API/Leads/Count] Warm leads count error:', warmError);
      } else {
        warmCount = count || 0;
      }
    } catch (warmErr: any) {
      console.error('[API/Leads/Count] Warm count exception:', warmErr);
    }
    
    // Get pending interactions count
    let pendingCount = 0;
    try {
      const { count, error: pendingError } = await supabase
        .from('lead_interactions')
        .select('*', { count: 'exact', head: true })
        .eq('builder_id', user.id)
        .eq('status', 'pending');
      
      if (pendingError) {
        console.error('[API/Leads/Count] Pending interactions count error:', pendingError);
      } else {
        pendingCount = count || 0;
      }
    } catch (pendingErr: any) {
      console.error('[API/Leads/Count] Pending count exception:', pendingErr);
    }
    
    return NextResponse.json({
      success: true,
      data: {
        total: totalCount,
        hot: hotCount,
        warm: warmCount,
        pending_interactions: pendingCount,
      },
    }, {
      // Cache for 10 seconds to reduce load, but allow real-time updates
      headers: {
        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
      },
    });
    
  } catch (error: any) {
    console.error('[API/Leads/Count] Unexpected server error:', error);
    console.error('[API/Leads/Count] Error stack:', error?.stack);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}

