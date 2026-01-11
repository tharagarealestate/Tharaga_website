import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const body = await request.json();

    const {
      buyer_id,
      session_id,
      event_type,
      event_metadata = {},
      property_id,
      builder_id,
      device_type,
      browser,
      location_city,
      time_of_day,
    } = body;

    // Validate required fields
    if (!buyer_id || !session_id || !event_type) {
      return NextResponse.json(
        { error: 'Missing required fields: buyer_id, session_id, event_type' },
        { status: 400 }
      );
    }

    // Validate event_type
    const validEventTypes = [
      'page_view', 'property_view', 'property_favorite',
      'calculator_use', 'document_download', 'image_view', 'image_zoom',
      'amenity_check', 'location_search', 'map_interaction',
      'pricing_check', 'emi_calculation', 'roi_analysis',
      'testimonial_view', 'video_view', 'comparison_action',
      'search_refinement', 'filter_application', 'share_action',
      'contact_builder_click', 'schedule_visit_click', 'chat_initiated'
    ];

    if (!validEventTypes.includes(event_type)) {
      return NextResponse.json(
        { error: `Invalid event_type. Must be one of: ${validEventTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Calculate signal weight based on event type
    const signalWeights: Record<string, number> = {
      'page_view': 1,
      'property_view': 5,
      'property_favorite': 10,
      'calculator_use': 15,
      'document_download': 20,
      'image_view': 3,
      'image_zoom': 5,
      'amenity_check': 8,
      'location_search': 10,
      'map_interaction': 12,
      'pricing_check': 15,
      'emi_calculation': 20,
      'roi_analysis': 25,
      'testimonial_view': 8,
      'video_view': 12,
      'comparison_action': 15,
      'search_refinement': 10,
      'filter_application': 8,
      'share_action': 5,
      'contact_builder_click': 30,
      'schedule_visit_click': 35,
      'chat_initiated': 25,
    };

    const signal_weight = signalWeights[event_type] || 0;

    // Get cumulative session score
    const { data: sessionSignals } = await supabase
      .from('buyer_behavioral_signals')
      .select('signal_weight')
      .eq('session_id', session_id)
      .order('timestamp', { ascending: false });

    const cumulative_session_score = (sessionSignals || []).reduce(
      (sum, signal) => sum + (signal.signal_weight || 0),
      0
    ) + signal_weight;

    // Insert behavioral signal
    const { data, error } = await supabase
      .from('buyer_behavioral_signals')
      .insert({
        buyer_id,
        session_id,
        event_type,
        event_metadata,
        property_id: property_id || null,
        builder_id: builder_id || null,
        device_type: device_type || null,
        browser: browser || null,
        location_city: location_city || null,
        time_of_day: time_of_day || null,
        signal_weight,
        cumulative_session_score,
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting behavioral signal:', error);
      return NextResponse.json(
        { error: 'Failed to track behavioral signal', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      signal_id: data.id,
      signal_weight,
      cumulative_session_score,
    });
  } catch (error: any) {
    console.error('Error in behavioral tracking:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

