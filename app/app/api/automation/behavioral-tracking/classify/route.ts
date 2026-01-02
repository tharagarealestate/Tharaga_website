import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

// Signal definitions
interface SignalDefinition {
  action: string;
  keywords?: string[];
  threshold?: number;
  points: number;
  amenities?: string[];
  types?: string[];
}

const MONKEY_SIGNALS: SignalDefinition[] = [
  { action: 'search_keyword_luxury', keywords: ['luxury', 'premium', 'exclusive', 'penthouse', 'high-end', 'vip', 'ultra-luxury'], points: 15 },
  { action: 'search_keyword_brand', keywords: ['branded', 'celebrity', 'gated community', 'prestigious'], points: 12 },
  { action: 'time_on_amenities_page_90sec', threshold: 90, points: 20 },
  { action: 'views_3d_virtual_tour_multiple', threshold: 2, points: 25 },
  { action: 'clicks_limited_units_badge', points: 30 },
  { action: 'saves_property_to_wishlist', points: 10 },
  { action: 'engagement_celebrity_residents', points: 35 },
  { action: 'checks_social_status_amenity', amenities: ['clubhouse', 'concierge', 'valet', 'butler', 'golf'], points: 15 },
  { action: 'views_lifestyle_gallery_multiple', threshold: 3, points: 18 },
  { action: 'engagement_scarcity_messaging', keywords: ['only 2 left', 'last units', 'closing soon'], points: 25 },
];

const LION_SIGNALS: SignalDefinition[] = [
  { action: 'downloads_spec_sheet', points: 25 },
  { action: 'downloads_floor_plan', points: 25 },
  { action: 'uses_roi_calculator', points: 40 },
  { action: 'time_on_pricing_breakdown_5min', threshold: 300, points: 30 },
  { action: 'compares_3plus_properties', threshold: 3, points: 35 },
  { action: 'checks_price_per_sqft_repeatedly', threshold: 3, points: 20 },
  { action: 'views_historical_price_trends', points: 30 },
  { action: 'downloads_financial_docs', types: ['payment_schedule', 'rera_docs', 'completion_certificate'], points: 25 },
  { action: 'engages_investment_analysis', points: 35 },
  { action: 'uses_emi_calculator_multiple', threshold: 2, points: 22 },
  { action: 'checks_resale_potential', points: 28 },
];

const DOG_SIGNALS: SignalDefinition[] = [
  { action: 'time_on_testimonials_2min', threshold: 120, points: 30 },
  { action: 'watches_community_video_tour', points: 35 },
  { action: 'clicks_family_friendly_filter', points: 20 },
  { action: 'views_schools_nearby_multiple', threshold: 2, points: 25 },
  { action: 'engages_lifestyle_image_gallery', points: 20 },
  { action: 'checks_playground_park_amenities', points: 25 },
  { action: 'reads_builder_history_page', points: 30 },
  { action: 'views_resident_stories', points: 40 },
  { action: 'engagement_community_events', points: 22 },
  { action: 'checks_safety_security_features', points: 18 },
  { action: 'views_neighborhood_walkthrough', points: 28 },
];

function matchesSignal(
  signal: any,
  signalDef: SignalDefinition,
  metadata: any
): boolean {
  const eventType = signal.event_type;
  const eventMetadata = signal.event_metadata || {};

  // Check action-specific matches
  if (signalDef.action.includes('search_keyword')) {
    const searchQuery = eventMetadata.search_query?.toLowerCase() || '';
    return signalDef.keywords?.some(keyword => searchQuery.includes(keyword.toLowerCase())) || false;
  }

  if (signalDef.action.includes('time_on')) {
    const timeSpent = eventMetadata.time_spent_seconds || 0;
    return timeSpent >= (signalDef.threshold || 0);
  }

  if (signalDef.action.includes('views_') || signalDef.action.includes('downloads_')) {
    // Count occurrences
    const count = eventMetadata.count || 1;
    return count >= (signalDef.threshold || 1);
  }

  if (signalDef.action.includes('uses_') && signalDef.action.includes('calculator')) {
    return eventType === 'emi_calculation' || eventType === 'roi_analysis';
  }

  if (signalDef.action.includes('downloads_')) {
    const docType = eventMetadata.document_type || '';
    return signalDef.types?.includes(docType) || eventType === 'document_download';
  }

  if (signalDef.action.includes('checks_') && signalDef.amenities) {
    const amenity = eventMetadata.amenity?.toLowerCase() || '';
    return signalDef.amenities.some(a => amenity.includes(a.toLowerCase()));
  }

  if (signalDef.action.includes('watches_') || signalDef.action.includes('views_')) {
    return eventType === 'video_view' || eventType === 'testimonial_view';
  }

  // Default: check if event type matches
  return false;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const { buyer_id } = await request.json();

    if (!buyer_id) {
      return NextResponse.json(
        { error: 'buyer_id is required' },
        { status: 400 }
      );
    }

    // Fetch last 30 days of behavioral signals
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: signals, error: signalsError } = await supabase
      .from('buyer_behavioral_signals')
      .select('*')
      .eq('buyer_id', buyer_id)
      .gte('timestamp', thirtyDaysAgo.toISOString())
      .order('timestamp', { ascending: false });

    if (signalsError) {
      console.error('Error fetching signals:', signalsError);
      return NextResponse.json(
        { error: 'Failed to fetch behavioral signals', details: signalsError.message },
        { status: 500 }
      );
    }

    if (!signals || signals.length === 0) {
      // Return default classification
      return NextResponse.json({
        buyer_id,
        primary_type: 'DOG',
        confidence_score: 0,
        scores: { monkey: 0, lion: 0, dog: 0 },
        top_indicators: [],
        recommended_automation: [],
      });
    }

    // Calculate scores for each type
    let monkeyScore = 0;
    let lionScore = 0;
    let dogScore = 0;
    const topIndicators: string[] = [];

    signals.forEach(signal => {
      const metadata = signal.event_metadata || {};

      // Check MONKEY signals
      MONKEY_SIGNALS.forEach(monkeySignal => {
        if (matchesSignal(signal, monkeySignal, metadata)) {
          monkeyScore += monkeySignal.points;
          topIndicators.push(monkeySignal.action);
        }
      });

      // Check LION signals
      LION_SIGNALS.forEach(lionSignal => {
        if (matchesSignal(signal, lionSignal, metadata)) {
          lionScore += lionSignal.points;
          topIndicators.push(lionSignal.action);
        }
      });

      // Check DOG signals
      DOG_SIGNALS.forEach(dogSignal => {
        if (matchesSignal(signal, dogSignal, metadata)) {
          dogScore += dogSignal.points;
          topIndicators.push(dogSignal.action);
        }
      });
    });

    // Determine primary and secondary types
    const scores = [
      { type: 'MONKEY' as const, score: monkeyScore },
      { type: 'LION' as const, score: lionScore },
      { type: 'DOG' as const, score: dogScore },
    ].sort((a, b) => b.score - a.score);

    const primary_type = scores[0].type;
    const secondary_type = scores[1].score >= 50 ? scores[1].type : undefined;

    // Calculate confidence
    const totalPoints = monkeyScore + lionScore + dogScore;
    const confidence_score = totalPoints > 0
      ? Math.min(100, (scores[0].score / totalPoints) * 100)
      : 0;

    // Get top 3 unique indicators
    const top3 = [...new Set(topIndicators)].slice(0, 3);

    // Store profile in database
    const { error: profileError } = await supabase
      .from('buyer_psychological_profile')
      .upsert({
        buyer_id,
        primary_type,
        secondary_type,
        confidence_score: Math.round(confidence_score * 100) / 100,
        type_indicators: {
          monkey_signals: monkeyScore,
          lion_signals: lionScore,
          dog_signals: dogScore,
          signal_breakdown: {
            status_keywords: topIndicators.filter(i => i.includes('keyword') || i.includes('status')),
            data_actions: topIndicators.filter(i => i.includes('download') || i.includes('calculator') || i.includes('compare')),
            emotional_actions: topIndicators.filter(i => i.includes('testimonial') || i.includes('community') || i.includes('video')),
          },
          top_3_indicators: top3,
        },
        total_sessions_analyzed: signals.length,
        classification_timestamp: new Date().toISOString(),
      }, {
        onConflict: 'buyer_id',
      });

    if (profileError) {
      console.error('Error storing profile:', profileError);
    }

    // Generate automation recommendations
    const recommended_automation = generateAutomationRecommendations(primary_type, scores[0].score);

    return NextResponse.json({
      buyer_id,
      primary_type,
      secondary_type,
      confidence_score: Math.round(confidence_score * 100) / 100,
      scores: {
        monkey: monkeyScore,
        lion: lionScore,
        dog: dogScore,
      },
      top_indicators: top3,
      recommended_automation,
    });
  } catch (error: any) {
    console.error('Error in classification:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

function generateAutomationRecommendations(
  buyerType: 'MONKEY' | 'LION' | 'DOG',
  score: number
): any[] {
  const recommendations = [];

  if (buyerType === 'MONKEY') {
    recommendations.push({
      action: 'send_email',
      template: 'luxury_property_showcase',
      timing: 'immediate',
      message_tone: 'exclusive',
    });
  } else if (buyerType === 'LION') {
    recommendations.push({
      action: 'send_email',
      template: 'roi_analysis_report',
      timing: 'immediate',
      message_tone: 'data_driven',
    });
  } else if (buyerType === 'DOG') {
    recommendations.push({
      action: 'send_email',
      template: 'community_lifestyle_guide',
      timing: 'immediate',
      message_tone: 'warm',
    });
  }

  return recommendations;
}

