import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Use service role to bypass RLS — behavioral signals are platform-level data
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const body = await request.json();

    const {
      buyer_id,      // optional — anonymous visitors won't have this
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

    // Only session_id and event_type are required (buyer_id optional for anonymous tracking)
    if (!session_id || !event_type) {
      return NextResponse.json(
        { error: 'Missing required fields: session_id, event_type' },
        { status: 400 }
      );
    }

    // Normalize session_id to UUID format (DB column is uuid type)
    // If already a valid UUID, use as-is. Otherwise generate a deterministic UUID-like string.
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    let normalizedSessionId = session_id
    if (!UUID_RE.test(session_id)) {
      // Pad/hash any string into a UUID-like format using simple char codes
      const padded = (session_id + '00000000000000000000000000000000').replace(/[^a-f0-9]/gi, '0').slice(0, 32)
      normalizedSessionId = `${padded.slice(0,8)}-${padded.slice(8,12)}-4${padded.slice(12,15)}-a${padded.slice(15,18)}-${padded.slice(18,30)}`
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

    // buyer_behavioral_signals.buyer_id is NOT NULL FK to leads.id
    // Only write to DB when we have a valid buyer_id (i.e. an existing lead)
    // For anonymous visitors (no lead yet), return success without DB write
    let signalId: string | null = null

    if (buyer_id) {
      const { data, error } = await supabase
        .from('buyer_behavioral_signals')
        .insert({
          buyer_id: Number(buyer_id),
          session_id: normalizedSessionId,
          event_type,
          event_metadata: event_metadata || {},
          property_id: property_id || null,
          builder_id: builder_id || null,
          device_type: device_type || null,
          browser: browser || null,
          location_city: location_city || null,
          time_of_day: time_of_day || null,
          signal_weight,
          cumulative_session_score,
        })
        .select('id')
        .single();

      if (error) {
        console.error('[BehavioralTrack] Insert error:', error.message)
        // Non-fatal — still return success so frontend tracking doesn't break
      } else {
        signalId = data?.id || null
      }
    } else {
      // Anonymous visitor — log signal locally but don't require DB write
      console.log(`[BehavioralTrack] Anonymous signal: ${event_type} | session: ${normalizedSessionId} | property: ${property_id} | weight: ${signal_weight}`)
    }

    return NextResponse.json({
      success: true,
      signal_id: signalId,
      signal_weight,
      cumulative_session_score,
      tracked: !!buyer_id,      // true = written to DB, false = anonymous (still valid)
    });
  } catch (error: any) {
    console.error('Error in behavioral tracking:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

