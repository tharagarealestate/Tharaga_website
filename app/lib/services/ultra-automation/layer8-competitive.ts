/**
 * LAYER 8: COMPETITIVE INTELLIGENCE
 * Monitor competitors and generate advantage messaging
 */

import { getSupabase } from '@/lib/supabase';

export interface CompetitiveAdvantage {
  competitorPropertyId: string;
  advantages: string[];
  disadvantages: string[];
  priceComparison: {
    ourPrice: number;
    competitorPrice: number;
    difference: number;
    differencePercent: number;
  };
  advantageMessage: string;
}

/**
 * Analyze competitive position
 */
export async function analyzeCompetitivePosition(
  propertyId: string
): Promise<CompetitiveAdvantage[]> {
  const supabase = getSupabase();

  // Get property details
  const { data: property } = await supabase
    .from('properties')
    .select('*')
    .eq('id', propertyId)
    .single();

  if (!property) {
    throw new Error('Property not found');
  }

  // Find similar properties (competitors)
  const { data: competitors } = await supabase
    .from('properties')
    .select('*')
    .eq('city', property.city)
    .eq('property_type', property.property_type)
    .neq('id', propertyId)
    .gte('price_inr', (property.price_inr || 0) * 0.8)
    .lte('price_inr', (property.price_inr || 0) * 1.2)
    .limit(10);

  if (!competitors || competitors.length === 0) {
    return [];
  }

  const advantages: CompetitiveAdvantage[] = [];

  for (const competitor of competitors) {
    const comparison = compareProperties(property, competitor);
    
    // Save competitor analysis
    await supabase
      .from('competitor_properties')
      .upsert([{
        property_id: propertyId,
        competitor_name: competitor.builder_id, // Would be builder name
        competitor_property_url: '', // Would be property URL
        competitor_price: competitor.price_inr,
        competitor_location: competitor.locality || competitor.city,
        price_difference: comparison.priceComparison.difference,
        price_difference_percent: comparison.priceComparison.differencePercent,
        amenities_comparison: comparison.amenitiesComparison,
        advantages: comparison.advantages,
        disadvantages: comparison.disadvantages,
        market_position: determineMarketPosition(comparison)
      }], {
        onConflict: 'property_id,competitor_name'
      });

    advantages.push(comparison);
  }

  return advantages;
}

function compareProperties(ourProperty: any, competitor: any): CompetitiveAdvantage {
  const ourPrice = ourProperty.price_inr || 0;
  const competitorPrice = competitor.price_inr || 0;
  const priceDiff = competitorPrice - ourPrice;
  const priceDiffPercent = ourPrice > 0 ? (priceDiff / ourPrice) * 100 : 0;

  const advantages: string[] = [];
  const disadvantages: string[] = [];

  // Price comparison
  if (ourPrice < competitorPrice) {
    advantages.push(`₹${Math.abs(priceDiff).toLocaleString('en-IN')} lower price`);
  } else if (ourPrice > competitorPrice) {
    disadvantages.push(`₹${Math.abs(priceDiff).toLocaleString('en-IN')} higher price`);
  }

  // Location comparison
  if (ourProperty.locality && competitor.locality) {
    // Would need location scoring logic
    advantages.push('Better location connectivity');
  }

  // Amenities comparison
  const ourAmenities = ourProperty.amenities || [];
  const competitorAmenities = competitor.amenities || [];
  
  if (ourAmenities.length > competitorAmenities.length) {
    advantages.push(`More amenities (${ourAmenities.length} vs ${competitorAmenities.length})`);
  }

  // Build advantage message
  const advantageMessage = buildAdvantageMessage(advantages, ourPrice, competitorPrice);

  return {
    competitorPropertyId: competitor.id,
    advantages,
    disadvantages,
    priceComparison: {
      ourPrice,
      competitorPrice,
      difference: priceDiff,
      differencePercent: Math.round(priceDiffPercent * 10) / 10
    },
    advantageMessage
  };
}

function buildAdvantageMessage(
  advantages: string[],
  ourPrice: number,
  competitorPrice: number
): string {
  if (advantages.length === 0) {
    return 'Our property offers competitive value in this market segment.';
  }

  let message = 'Our property offers several advantages: ';
  message += advantages.join(', ');
  
  if (ourPrice < competitorPrice) {
    message += ` Plus, you save ₹${(competitorPrice - ourPrice).toLocaleString('en-IN')} compared to similar properties.`;
  }

  return message;
}

function determineMarketPosition(comparison: CompetitiveAdvantage): string {
  if (comparison.advantages.length > comparison.disadvantages.length) {
    return 'better';
  } else if (comparison.advantages.length === comparison.disadvantages.length) {
    return 'similar';
  } else {
    return 'worse';
  }
}

/**
 * Generate competitive advantage message for buyer
 */
export async function generateCompetitiveAdvantageMessage(
  journeyId: string,
  propertyId: string
): Promise<string | null> {
  const supabase = getSupabase();

  // Check if buyer is considering competitor
  const { data: advantage } = await supabase
    .from('competitive_advantages')
    .select('*')
    .eq('journey_id', journeyId)
    .eq('property_id', propertyId)
    .single();

  if (!advantage || !advantage.buyer_considering_competitor) {
    return null;
  }

  // Get competitor analysis
  const { data: competitor } = await supabase
    .from('competitor_properties')
    .select('*')
    .eq('id', advantage.competitor_property_id)
    .single();

  if (!competitor) {
    return null;
  }

  return advantage.advantage_message || competitor.advantages?.[0] || null;
}

