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

    // Get geographic distribution from user events
    const { data: events } = await supabase
      .from('user_events')
      .select('city, country')
      .not('city', 'is', null)
      .limit(10000);

    // Count users by city
    const cityCounts: Record<string, number> = {};
    events?.forEach(event => {
      if (event.city) {
        cityCounts[event.city] = (cityCounts[event.city] || 0) + 1;
      }
    });

    // Convert to array and sort
    const locations = Object.entries(cityCounts)
      .map(([city, count]) => ({
        city,
        count,
        percentage: 0 // Will calculate below
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 cities

    // Calculate percentages
    const totalUsers = locations.reduce((sum, loc) => sum + loc.count, 0);
    locations.forEach(loc => {
      loc.percentage = totalUsers > 0 ? Math.round((loc.count / totalUsers) * 100) : 0;
    });

    // Return empty array if no data - no fallback dummy data

    return NextResponse.json({ locations });

  } catch (error: any) {
    console.error('Geographic analytics error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

