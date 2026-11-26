/**
 * LAYER 9: MULTI-PROPERTY CROSS-SELLING
 * Recommend alternative properties based on objections
 */

import { getSupabase } from '@/lib/supabase';

export interface CrossSellRecommendation {
  recommendedPropertyId: string;
  recommendationReason: string;
  objectionAddressed: string;
  matchScore: number;
  matchFactors: {
    price: boolean;
    location: boolean;
    type: boolean;
    amenities: boolean;
  };
}

/**
 * Generate cross-sell recommendations
 */
export async function generateCrossSellRecommendations(
  sourceJourneyId: string,
  sourcePropertyId: string,
  builderId: string,
  objection?: string
): Promise<CrossSellRecommendation[]> {
  const supabase = getSupabase();

  // Get source property and lead
  const { data: sourceProperty } = await supabase
    .from('properties')
    .select('*')
    .eq('id', sourcePropertyId)
    .single();

  const { data: journey } = await supabase
    .from('buyer_journey')
    .select('lead_id')
    .eq('id', sourceJourneyId)
    .single();

  if (!sourceProperty || !journey) {
    return [];
  }

  const { data: lead } = await supabase
    .from('generated_leads')
    .select('*')
    .eq('id', journey.lead_id)
    .single();

  if (!lead) {
    return [];
  }

  // Find alternative properties from same builder
  const { data: alternatives } = await supabase
    .from('properties')
    .select('*')
    .eq('builder_id', builderId)
    .neq('id', sourcePropertyId)
    .eq('listing_status', 'active')
    .limit(10);

  if (!alternatives || alternatives.length === 0) {
    return [];
  }

  const recommendations: CrossSellRecommendation[] = [];

  for (const altProperty of alternatives) {
    const match = calculateMatch(sourceProperty, altProperty, lead, objection);
    
    if (match.matchScore >= 60) { // Only recommend if good match
      recommendations.push(match);

      // Save recommendation
      await supabase
        .from('cross_sell_recommendations')
        .insert([{
          source_journey_id: sourceJourneyId,
          source_property_id: sourcePropertyId,
          recommended_property_id: altProperty.id,
          lead_id: journey.lead_id,
          builder_id: builderId,
          recommendation_reason: match.recommendationReason,
          objection_addressed: objection || 'none',
          match_score: match.matchScore,
          match_factors: match.matchFactors
        }]);
    }
  }

  // Sort by match score
  recommendations.sort((a, b) => b.matchScore - a.matchScore);

  return recommendations.slice(0, 3); // Top 3 recommendations
}

function calculateMatch(
  sourceProperty: any,
  altProperty: any,
  lead: any,
  objection?: string
): CrossSellRecommendation {
  let matchScore = 0;
  const matchFactors = {
    price: false,
    location: false,
    type: false,
    amenities: false
  };

  let recommendationReason = '';
  let objectionAddressed = objection || 'none';

  // Price match
  const leadBudgetMid = (lead.budget_min + lead.budget_max) / 2;
  const altPrice = altProperty.price_inr || 0;
  const priceDiff = Math.abs(altPrice - leadBudgetMid) / leadBudgetMid;

  if (priceDiff <= 0.1) {
    matchScore += 30;
    matchFactors.price = true;
  } else if (priceDiff <= 0.2) {
    matchScore += 15;
  }

  // Address price objection
  if (objection?.toLowerCase().includes('price') || objection?.toLowerCase().includes('expensive')) {
    if (altPrice < sourceProperty.price_inr) {
      recommendationReason = 'Lower price option that fits your budget';
      objectionAddressed = 'price_too_high';
      matchScore += 20;
    }
  }

  // Location match
  const sourceLocation = (sourceProperty.locality || sourceProperty.city || '').toLowerCase();
  const altLocation = (altProperty.locality || altProperty.city || '').toLowerCase();
  
  if (altLocation === sourceLocation) {
    matchScore += 25;
    matchFactors.location = true;
  } else if (altLocation.includes('chennai') && sourceLocation.includes('chennai')) {
    matchScore += 15;
  }

  // Address location objection
  if (objection?.toLowerCase().includes('location') || objection?.toLowerCase().includes('far')) {
    if (altLocation !== sourceLocation) {
      recommendationReason = 'Better location that addresses your concern';
      objectionAddressed = 'location_issue';
      matchScore += 15;
    }
  }

  // Property type match
  if (altProperty.property_type === sourceProperty.property_type) {
    matchScore += 20;
    matchFactors.type = true;
  } else {
    // Check if alternative type matches lead preference
    if (lead.property_type_preference && 
        altProperty.property_type?.toLowerCase().includes(lead.property_type_preference.toLowerCase())) {
      matchScore += 15;
      matchFactors.type = true;
    }
  }

  // Address size/type objection
  if (objection?.toLowerCase().includes('small') || objection?.toLowerCase().includes('size')) {
    // Recommend larger property
    const sourceSize = sourceProperty.bedrooms || 2;
    const altSize = altProperty.bedrooms || 2;
    if (altSize > sourceSize) {
      recommendationReason = `Larger ${altSize}BHK option available`;
      objectionAddressed = 'size_too_small';
      matchScore += 20;
    }
  }

  // Amenities match
  const sourceAmenities = sourceProperty.amenities || [];
  const altAmenities = altProperty.amenities || [];
  const commonAmenities = sourceAmenities.filter((a: string) => altAmenities.includes(a));
  
  if (commonAmenities.length > 0) {
    matchScore += 10;
    matchFactors.amenities = true;
  }

  // Address amenities objection
  if (objection?.toLowerCase().includes('amenity') || objection?.toLowerCase().includes('gym') || 
      objection?.toLowerCase().includes('pool')) {
    if (altAmenities.length > sourceAmenities.length) {
      recommendationReason = 'More amenities including what you\'re looking for';
      objectionAddressed = 'missing_amenities';
      matchScore += 15;
    }
  }

  // Default reason if none set
  if (!recommendationReason) {
    recommendationReason = 'Alternative property that matches your requirements';
  }

  return {
    recommendedPropertyId: altProperty.id,
    recommendationReason,
    objectionAddressed,
    matchScore: Math.min(matchScore, 100),
    matchFactors
  };
}

/**
 * Present cross-sell recommendation to buyer
 */
export async function presentCrossSellRecommendation(
  recommendationId: string
): Promise<void> {
  const supabase = getSupabase();

  const { data: recommendation } = await supabase
    .from('cross_sell_recommendations')
    .select('*')
    .eq('id', recommendationId)
    .single();

  if (!recommendation) {
    throw new Error('Recommendation not found');
  }

  // Update recommendation status
  await supabase
    .from('cross_sell_recommendations')
    .update({
      presented_to_buyer: true,
      presented_at: new Date().toISOString()
    })
    .eq('id', recommendationId);

  // This would trigger Layer 2 email sequence with cross-sell content
  // For now, just log
  console.log(`[Layer 9] Cross-sell recommendation presented for property ${recommendation.recommended_property_id}`);
}

