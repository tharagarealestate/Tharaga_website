/**
 * LAYER 5: NEGOTIATION AUTOMATION
 * Price strategy and negotiation recommendations
 */

import { getSupabase } from '@/lib/supabase';

export interface NegotiationStrategy {
  suggestedPrice: number;
  suggestedDiscount: number;
  strategy: string;
  reasoning: string;
  expectedOutcome: string;
}

/**
 * Analyze and suggest negotiation strategy
 */
export async function analyzeNegotiationStrategy(
  propertyId: string,
  leadId: string,
  journeyId: string,
  builderId: string
): Promise<NegotiationStrategy> {
  const supabase = getSupabase();

  // Get property and lead details
  const { data: property } = await supabase
    .from('properties')
    .select('*')
    .eq('id', propertyId)
    .single();

  const { data: lead } = await supabase
    .from('generated_leads')
    .select('*')
    .eq('id', leadId)
    .single();

  if (!property || !lead) {
    throw new Error('Property or lead not found');
  }

  const listedPrice = property.price_inr || 0;
  const buyerBudgetMin = lead.budget_min || 0;
  const buyerBudgetMax = lead.budget_max || 0;
  const buyerBudgetMid = (buyerBudgetMin + buyerBudgetMax) / 2;

  // Get market comparables from analysis
  const { data: analysis } = await supabase
    .from('property_analysis')
    .select('comparable_properties')
    .eq('property_id', propertyId)
    .single();

  const comparables = analysis?.comparable_properties || [];
  const marketMin = comparables.length > 0 
    ? Math.min(...comparables.map((c: any) => c.price || listedPrice))
    : listedPrice * 0.9;
  const marketMax = comparables.length > 0
    ? Math.max(...comparables.map((c: any) => c.price || listedPrice))
    : listedPrice * 1.1;
  const marketAvg = comparables.length > 0
    ? comparables.reduce((sum: number, c: any) => sum + (c.price || 0), 0) / comparables.length
    : listedPrice;

  // Calculate strategy
  let suggestedPrice = listedPrice;
  let suggestedDiscount = 0;
  let strategy = 'hold_price';
  let reasoning = '';
  let expectedOutcome = '';

  // Strategy 1: Buyer budget is below listed price
  if (buyerBudgetMax < listedPrice) {
    const gap = listedPrice - buyerBudgetMax;
    const gapPercent = (gap / listedPrice) * 100;

    if (gapPercent <= 5) {
      // Small gap - suggest small discount
      suggestedPrice = buyerBudgetMax;
      suggestedDiscount = gapPercent;
      strategy = 'small_discount';
      reasoning = `Buyer budget (₹${buyerBudgetMax.toLocaleString('en-IN')}) is only ${gapPercent.toFixed(1)}% below listed price. Small discount will close the deal.`;
      expectedOutcome = 'High probability of acceptance';
    } else if (gapPercent <= 10) {
      // Medium gap - negotiate middle ground
      suggestedPrice = (listedPrice + buyerBudgetMax) / 2;
      suggestedDiscount = ((listedPrice - suggestedPrice) / listedPrice) * 100;
      strategy = 'negotiate_middle';
      reasoning = `Buyer budget gap is ${gapPercent.toFixed(1)}%. Suggest middle ground to maintain value while closing deal.`;
      expectedOutcome = 'Moderate probability, may need counter-offer';
    } else {
      // Large gap - hold or suggest alternative
      strategy = 'hold_or_alternative';
      reasoning = `Buyer budget gap is ${gapPercent.toFixed(1)}% - too large. Consider alternative property or hold price.`;
      expectedOutcome = 'Low probability, suggest alternative property';
    }
  }
  // Strategy 2: Buyer budget matches or exceeds
  else if (buyerBudgetMin >= listedPrice) {
    strategy = 'hold_price';
    suggestedPrice = listedPrice;
    reasoning = 'Buyer budget matches or exceeds listed price. Hold firm on price.';
    expectedOutcome = 'High probability buyer will accept listed price';
  }
  // Strategy 3: Buyer budget overlaps with listed price
  else {
    // Buyer can afford it, but may negotiate
    if (lead.payment_capacity === 'pre_approved' || lead.payment_capacity === 'cash_ready') {
      strategy = 'hold_price';
      reasoning = 'Buyer has strong payment capacity. Hold price, emphasize value.';
      expectedOutcome = 'High probability of acceptance at listed price';
    } else {
      // Suggest small discount for quick close
      suggestedPrice = buyerBudgetMid;
      suggestedDiscount = ((listedPrice - suggestedPrice) / listedPrice) * 100;
      strategy = 'quick_close_discount';
      reasoning = 'Buyer budget overlaps. Small discount can secure quick close.';
      expectedOutcome = 'High probability with discount';
    }
  }

  // Check market position
  if (listedPrice > marketAvg * 1.1) {
    reasoning += ' Property is priced above market average. Consider discount for competitiveness.';
    if (suggestedPrice === listedPrice) {
      suggestedPrice = marketAvg;
      suggestedDiscount = ((listedPrice - suggestedPrice) / listedPrice) * 100;
    }
  }

  // Save negotiation record
  await supabase
    .from('negotiations')
    .insert([{
      journey_id: journeyId,
      property_id: propertyId,
      lead_id: leadId,
      builder_id: builderId,
      listed_price: listedPrice,
      buyer_budget_min: buyerBudgetMin,
      buyer_budget_max: buyerBudgetMax,
      suggested_price: suggestedPrice,
      suggested_strategy: strategy,
      strategy_reasoning: reasoning,
      market_comparable_min: marketMin,
      market_comparable_max: marketMax,
      market_comparable_avg: marketAvg,
      status: 'initiated'
    }]);

  return {
    suggestedPrice,
    suggestedDiscount: Math.round(suggestedDiscount * 10) / 10,
    strategy,
    reasoning,
    expectedOutcome
  };
}

