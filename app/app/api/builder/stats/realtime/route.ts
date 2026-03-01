import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';

// Use nodejs runtime for proper cookie support
export const runtime = 'nodejs';

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase env not configured');
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function GET(request: NextRequest) {
  try {
    // Use cookie-based auth client — reads session from browser cookies
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Admin check — admin sees aggregate stats across ALL builders
    const isAdmin = user.email === 'tharagarealestate@gmail.com';
    const builderId = user.id;

    // Use service role client for data queries to bypass RLS
    const svc = getServiceSupabase();

    // Build queries — admin sees ALL, builder sees only their own
    let leadsQuery = svc.from('leads').select('id, status, score', { count: 'exact', head: false });
    let propertiesQuery = svc.from('properties').select('id, listing_status', { count: 'exact', head: false });
    let viewsQuery = svc.from('properties').select('view_count');
    let inquiriesQuery = svc.from('leads').select('id', { count: 'exact', head: true });

    if (!isAdmin) {
      leadsQuery = leadsQuery.eq('builder_id', builderId);
      propertiesQuery = propertiesQuery.eq('builder_id', builderId);
      viewsQuery = viewsQuery.eq('builder_id', builderId);
      inquiriesQuery = inquiriesQuery.eq('builder_id', builderId);
    }

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
      (p: any) => ['active', 'available'].includes(p.listing_status || 'active')
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
