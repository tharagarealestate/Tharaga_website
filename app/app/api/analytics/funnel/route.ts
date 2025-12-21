import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verify authentication and admin access
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (!userRole) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get conversion funnel data from database or calculate from events
    const { data: funnelData } = await supabase
      .from('conversion_funnels')
      .select('*')
      .eq('funnel_type', 'buyer')
      .order('funnel_date', { ascending: false })
      .limit(1)
      .single();

    if (funnelData) {
      const funnel = [
        { step: 'Page Visit', count: funnelData.step_1_count, dropoff: 0 },
        { step: 'Search', count: funnelData.step_2_count, dropoff: funnelData.drop_off_1_2 || 0 },
        { step: 'View Property', count: funnelData.step_3_count, dropoff: funnelData.drop_off_2_3 || 0 },
        { step: 'Inquiry', count: funnelData.step_4_count, dropoff: funnelData.drop_off_3_4 || 0 },
        { step: 'Conversion', count: funnelData.step_5_count, dropoff: funnelData.drop_off_4_5 || 0 },
      ];
      return NextResponse.json({ funnel });
    }

    // If no funnel data exists, calculate from events (fallback)
    const { data: pageViews } = await supabase
      .from('user_events')
      .select('*', { count: 'exact', head: true })
      .eq('event_category', 'page_view');

    const { data: searches } = await supabase
      .from('user_events')
      .select('*', { count: 'exact', head: true })
      .eq('event_category', 'search');

    const { data: propertyViews } = await supabase
      .from('user_events')
      .select('*', { count: 'exact', head: true })
      .eq('event_category', 'property_interaction')
      .eq('event_name', 'view');

    const { data: inquiries } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true });

    const { data: conversions } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .in('status', ['won', 'converted']);

    const step1 = pageViews?.count || 0;
    const step2 = searches?.count || 0;
    const step3 = propertyViews?.count || 0;
    const step4 = inquiries?.count || 0;
    const step5 = conversions?.count || 0;

    const funnel = [
      { step: 'Page Visit', count: step1, dropoff: 0 },
      { step: 'Search', count: step2, dropoff: step1 > 0 ? ((step1 - step2) / step1 * 100) : 0 },
      { step: 'View Property', count: step3, dropoff: step2 > 0 ? ((step2 - step3) / step2 * 100) : 0 },
      { step: 'Inquiry', count: step4, dropoff: step3 > 0 ? ((step3 - step4) / step3 * 100) : 0 },
      { step: 'Conversion', count: step5, dropoff: step4 > 0 ? ((step4 - step5) / step4 * 100) : 0 },
    ];

    return NextResponse.json({ funnel });

  } catch (error: any) {
    console.error('Funnel analytics error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

