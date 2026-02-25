import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

// Use nodejs runtime for proper cookie support
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Admin check — admin sees aggregate stats across ALL builders
    const isAdmin = user.email === 'tharagarealestate@gmail.com';

    // Get builder profile (optional for admin)
    const { data: builderProfile } = await supabase
      .from('builder_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    // Non-admin users MUST have a builder profile
    if (!isAdmin && !builderProfile) {
      return NextResponse.json({ error: 'Builder not found' }, { status: 404 });
    }

    const builderId = builderProfile?.id || user.id;

    // Build queries — admin sees ALL, builder sees only their own
    const leadsQuery = supabase
      .from('leads')
      .select('id, status, score', { count: 'exact', head: false });
    const propertiesQuery = supabase
      .from('properties')
      .select('id, listing_status', { count: 'exact', head: false });
    const viewsQuery = supabase
      .from('properties')
      .select('view_count');
    const inquiriesQuery = supabase
      .from('leads')
      .select('id', { count: 'exact', head: true });

    if (!isAdmin) {
      leadsQuery.eq('builder_id', builderId);
      propertiesQuery.eq('builder_id', builderId);
      viewsQuery.eq('builder_id', builderId);
      inquiriesQuery.eq('builder_id', builderId);
    }

    // Get real-time stats
    const [leadsResult, propertiesResult, viewsResult, inquiriesResult] = await Promise.all([
      leadsQuery,
      propertiesQuery,
      viewsQuery,
      inquiriesQuery,
    ]);

    const totalLeads = leadsResult.count || 0;
    const hotLeads = (leadsResult.data || []).filter((l: any) => (l.score || 0) >= 80).length;
    const warmLeads = (leadsResult.data || []).filter((l: any) => {
      const score = l.score || 0;
      return score >= 50 && score < 80;
    }).length;

    const totalProperties = propertiesResult.count || 0;
    const activeProperties = (propertiesResult.data || []).filter(
      (p: any) => (p.listing_status || 'active') === 'active'
    ).length;

    const totalViews = (viewsResult.data || []).reduce(
      (sum: number, p: any) => sum + (p.view_count || 0),
      0
    );

    const totalInquiries = inquiriesResult.count || 0;
    const conversionRate = totalViews > 0 
      ? ((totalInquiries / totalViews) * 100).toFixed(1)
      : '0.0';

    const res = NextResponse.json({
      totalLeads,
      hotLeads,
      warmLeads,
      totalProperties,
      activeProperties,
      totalViews,
      totalInquiries,
      conversionRate: parseFloat(conversionRate),
      timestamp: new Date().toISOString(),
    });
    res.headers.set('Cache-Control', 'private, s-maxage=30, stale-while-revalidate=60');
    return res;
  } catch (error: any) {
    console.error('Realtime stats API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}











