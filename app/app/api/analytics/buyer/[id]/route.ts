import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const buyerId = params.id;

    // Verify authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user has access to this buyer's data
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    // Check if user is admin or the buyer themselves
    const { data: buyerProfile } = await supabase
      .from('buyer_profiles')
      .select('user_id')
      .eq('id', buyerId)
      .single();

    const isAdmin = userRole?.role === 'admin';
    const isBuyerOwner = buyerProfile?.user_id === user.id;

    if (!isAdmin && !isBuyerOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get user events for this buyer
    const { data: events } = await supabase
      .from('user_events')
      .select('*')
      .eq('user_id', buyerProfile?.user_id || user.id)
      .order('created_at', { ascending: false })
      .limit(1000);

    // Calculate analytics from events
    const totalSearches = events?.filter(e => e.event_category === 'search').length || 0;
    const propertiesViewed = events?.filter(e => e.event_category === 'property_interaction' && e.event_name === 'view').length || 0;
    
    // Get saved properties from buyer profile
    const { data: buyerData } = await supabase
      .from('buyer_profiles')
      .select('saved_properties')
      .eq('user_id', buyerProfile?.user_id || user.id)
      .single();
    
    const savedProperties = buyerData?.saved_properties?.length || 0;

    // Count site visits booked
    const siteVisitsBooked = events?.filter(e => e.event_name === 'site_visit_booked').length || 0;

    // Calculate average session duration
    const sessions = events?.reduce((acc: Record<string, number[]>, event) => {
      if (event.session_id && event.duration) {
        if (!acc[event.session_id]) {
          acc[event.session_id] = [];
        }
        acc[event.session_id].push(event.duration);
      }
      return acc;
    }, {});

    const sessionDurations = Object.values(sessions || {}).map(sessionEvents => {
      return sessionEvents.reduce((sum, dur) => sum + (dur || 0), 0);
    });

    const avgSessionDuration = sessionDurations.length > 0
      ? Math.round(sessionDurations.reduce((sum, dur) => sum + dur, 0) / sessionDurations.length)
      : 0;

    // Get search history
    const searchHistory = events
      ?.filter(e => e.event_category === 'search')
      .map(e => ({
        query_text: e.event_properties?.query || e.event_properties?.search_query || null,
        searched_at: e.created_at
      }))
      .slice(0, 10) || [];

    // Get view history
    const viewHistory = await Promise.all(
      (events?.filter(e => e.event_category === 'property_interaction' && e.event_name === 'view') || [])
        .slice(0, 10)
        .map(async (event) => {
          const propertyId = event.event_properties?.property_id;
          if (propertyId) {
            const { data: property } = await supabase
              .from('properties')
              .select('title')
              .eq('id', propertyId)
              .single();
            return {
              property: property ? { title: property.title } : null,
              view_duration: event.duration || 0,
              viewed_at: event.created_at
            };
          }
          return {
            property: null,
            view_duration: event.duration || 0,
            viewed_at: event.created_at
          };
        })
    );

    return NextResponse.json({
      totalSearches,
      propertiesViewed,
      savedProperties,
      siteVisitsBooked,
      avgSessionDuration,
      searchHistory,
      viewHistory
    });

  } catch (error: any) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

