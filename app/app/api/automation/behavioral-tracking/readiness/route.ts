import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

interface ReadinessSignal {
  check: (signals: any[]) => boolean;
  weight: number;
  description: string;
}

const READINESS_SIGNALS: Record<string, ReadinessSignal> = {
  time_spent_3min_plus: {
    check: (signals: any[]) => {
      return signals.some(s =>
        s.event_type === 'property_view' &&
        (s.event_metadata?.time_spent_seconds || 0) >= 180
      );
    },
    weight: 1,
    description: 'Spent 3+ minutes on a single property page',
  },
  visited_pricing_calculator: {
    check: (signals: any[]) => {
      return signals.some(s => s.event_type === 'emi_calculation' || s.event_type === 'roi_analysis');
    },
    weight: 1,
    description: 'Used pricing/EMI calculator',
  },
  viewed_3plus_images: {
    check: (signals: any[]) => {
      const imageViews = signals.filter(s => s.event_type === 'image_view' || s.event_type === 'image_zoom');
      return imageViews.length >= 3;
    },
    weight: 1,
    description: 'Viewed 3+ property images/floor plans',
  },
  downloaded_spec_sheet: {
    check: (signals: any[]) => {
      return signals.some(s =>
        s.event_type === 'document_download' &&
        (s.event_metadata?.document_type === 'spec_sheet' || s.event_metadata?.document_type === 'brochure')
      );
    },
    weight: 1,
    description: 'Downloaded specification sheet/brochure',
  },
  viewed_testimonials: {
    check: (signals: any[]) => {
      return signals.some(s => s.event_type === 'testimonial_view' || s.event_type === 'video_view');
    },
    weight: 1,
    description: 'Viewed customer testimonials/reviews',
  },
  searched_nearby_amenities: {
    check: (signals: any[]) => {
      return signals.some(s =>
        s.event_type === 'amenity_check' ||
        (s.event_metadata?.search_query && /mall|restaurant|park|gym/i.test(s.event_metadata.search_query))
      );
    },
    weight: 1,
    description: 'Searched for nearby amenities (malls, restaurants, parks)',
  },
  searched_schools_hospitals: {
    check: (signals: any[]) => {
      return signals.some(s =>
        s.event_metadata?.search_query && /school|hospital|medical|education/i.test(s.event_metadata.search_query)
      );
    },
    weight: 1,
    description: 'Searched for schools/hospitals nearby',
  },
  checked_traffic_commute: {
    check: (signals: any[]) => {
      return signals.some(s =>
        s.event_type === 'location_search' ||
        s.event_type === 'map_interaction' ||
        (s.event_metadata?.search_query && /commute|traffic|distance|metro/i.test(s.event_metadata.search_query))
      );
    },
    weight: 1,
    description: 'Checked traffic/commute information',
  },
  visited_community_page_2plus: {
    check: (signals: any[]) => {
      const communityViews = signals.filter(s =>
        s.event_metadata?.page_url && /community|lifestyle|residents/i.test(s.event_metadata.page_url)
      );
      return communityViews.length >= 2;
    },
    weight: 1,
    description: 'Visited community/lifestyle page 2+ times',
  },
  accessed_contact_booking: {
    check: (signals: any[]) => {
      return signals.some(s =>
        s.event_type === 'contact_builder_click' ||
        s.event_type === 'schedule_visit_click' ||
        s.event_type === 'chat_initiated'
      );
    },
    weight: 1,
    description: 'Clicked on contact/booking options',
  },
};

function getRecommendedAction(urgency: string, score: number): string {
  if (urgency === 'CRITICAL' && score >= 8) {
    return 'IMMEDIATE_PHONE_CALL';
  } else if (urgency === 'HIGH') {
    return 'SEND_PERSONALIZED_WHATSAPP';
  } else if (urgency === 'MEDIUM') {
    return 'TRIGGER_EMAIL_SEQUENCE';
  } else {
    return 'CONTINUE_NURTURING';
  }
}

async function calculateOptimalContactTime(buyerId: string): Promise<string> {
  const supabase = getSupabase();

  // Get buyer's past engagement patterns
  const { data: signals } = await supabase
    .from('buyer_behavioral_signals')
    .select('time_of_day, timestamp')
    .eq('buyer_id', buyerId)
    .order('timestamp', { ascending: false })
    .limit(20);

  if (!signals || signals.length === 0) {
    // Default to tomorrow 6 PM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(18, 0, 0, 0);
    return tomorrow.toISOString();
  }

  // Find most common engagement time
  const timeCounts: Record<string, number> = {};
  signals.forEach(s => {
    if (s.time_of_day) {
      timeCounts[s.time_of_day] = (timeCounts[s.time_of_day] || 0) + 1;
    }
  });

  const mostCommonTime = Object.entries(timeCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

  if (mostCommonTime) {
    const [hours, minutes] = mostCommonTime.split(':').map(Number);
    const optimalTime = new Date();
    optimalTime.setHours(hours, minutes, 0, 0);
    if (optimalTime < new Date()) {
      optimalTime.setDate(optimalTime.getDate() + 1);
    }
    return optimalTime.toISOString();
  }

  // Default to tomorrow 6 PM
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(18, 0, 0, 0);
  return tomorrow.toISOString();
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const { buyer_id, property_id } = await request.json();

    if (!buyer_id || !property_id) {
      return NextResponse.json(
        { error: 'buyer_id and property_id are required' },
        { status: 400 }
      );
    }

    // Fetch signals from last 24 hours for this specific property
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const { data: signals, error: signalsError } = await supabase
      .from('buyer_behavioral_signals')
      .select('*')
      .eq('buyer_id', buyer_id)
      .eq('property_id', property_id)
      .gte('timestamp', twentyFourHoursAgo.toISOString());

    if (signalsError) {
      console.error('Error fetching signals:', signalsError);
      return NextResponse.json(
        { error: 'Failed to fetch behavioral signals', details: signalsError.message },
        { status: 500 }
      );
    }

    const signalsMet: string[] = [];
    const signalsMissing: string[] = [];
    let readinessScore = 0;

    // Check each readiness signal
    for (const [signalName, signalDef] of Object.entries(READINESS_SIGNALS)) {
      if (signalDef.check(signals || [])) {
        signalsMet.push(signalName);
        readinessScore += signalDef.weight;

        // Log to readiness_signal_triggers table
        const sessionId = signals?.[0]?.session_id || crypto.randomUUID();
        await supabase.from('readiness_signal_triggers').insert({
          buyer_id,
          property_id,
          signal_name: signalName,
          signal_weight: signalDef.weight,
          session_id: sessionId,
        });
      } else {
        signalsMissing.push(signalName);
      }
    }

    // Determine urgency level
    let urgencyLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    if (readinessScore >= 8) urgencyLevel = 'CRITICAL';
    else if (readinessScore >= 6) urgencyLevel = 'HIGH';
    else if (readinessScore >= 4) urgencyLevel = 'MEDIUM';
    else urgencyLevel = 'LOW';

    // Calculate optimal contact time
    const optimalTime = await calculateOptimalContactTime(buyer_id);

    return NextResponse.json({
      buyer_id,
      property_id,
      readiness_score: readinessScore,
      signals_met: signalsMet,
      signals_missing: signalsMissing,
      urgency_level: urgencyLevel,
      recommended_action: getRecommendedAction(urgencyLevel, readinessScore),
      optimal_contact_time: optimalTime,
    });
  } catch (error: any) {
    console.error('Error in readiness check:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

