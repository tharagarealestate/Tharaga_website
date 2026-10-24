/**
 * LAYER 1: INTELLIGENT LEAD GENERATION
 * AI-powered lead generation with intent matching and market analysis
 */

import Anthropic from '@anthropic-ai/sdk';
import { getSupabase } from '@/lib/supabase';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY || '',
});

export interface PropertyAnalysis {
  marketPosition: 'premium' | 'mid' | 'budget';
  comparableProperties: Array<{
    price: number;
    location: string;
    features: string[];
  }>;
  demandScore: number;
  idealBuyerPersona: {
    buyerType: string;
    budgetRange: { min: number; max: number };
    timeline: string;
    preferences: string[];
  };
}

export interface IntentMatchedLead {
  name: string;
  email: string;
  phone: string;
  interest_level: 'high' | 'medium' | 'low';
  estimated_budget: number;
  budget_min: number;
  budget_max: number;
  timeline: 'immediate' | '3months' | '6months' | '1year';
  buyer_persona: 'young_couple' | 'investor' | 'family' | 'professional';
  payment_capacity: 'pre_approved' | 'savings' | 'needs_loan' | 'cash_ready';
  preferred_location: string;
  property_type_preference: string;
  intent_score: number;
  quality_score: number;
}

/**
 * Analyze property for market positioning and buyer persona
 */
export async function analyzeProperty(propertyId: string): Promise<PropertyAnalysis> {
  const supabase = getSupabase();

  // Get property details
  const { data: property, error } = await supabase
    .from('properties')
    .select('*')
    .eq('id', propertyId)
    .single();

  if (error || !property) {
    throw new Error(`Property not found: ${error?.message}`);
  }

  // Check if analysis already exists
  const { data: existingAnalysis } = await supabase
    .from('property_analysis')
    .select('*')
    .eq('property_id', propertyId)
    .order('analyzed_at', { ascending: false })
    .limit(1)
    .single();

  if (existingAnalysis && existingAnalysis.analysis_version >= 1) {
    return {
      marketPosition: existingAnalysis.market_position as any,
      comparableProperties: existingAnalysis.comparable_properties as any,
      demandScore: existingAnalysis.demand_score,
      idealBuyerPersona: existingAnalysis.ideal_buyer_persona as any
    };
  }

  // Use Claude to analyze property
  const prompt = `Analyze this real estate property in Tamil Nadu, India for market positioning and ideal buyer persona:

Property Details:
- Name: ${property.property_name || property.title}
- Location: ${property.locality || property.city || property.location}
- Type: ${property.property_type}
- Price: ₹${property.price_inr?.toLocaleString('en-IN') || property.price_range}
- Description: ${property.description || 'N/A'}
- Units: ${property.total_units || 'N/A'}

Provide analysis in JSON format:
{
  "marketPosition": "premium" | "mid" | "budget",
  "comparableProperties": [
    {
      "price": number,
      "location": "string",
      "features": ["string"]
    }
  ],
  "demandScore": number (0-100),
  "idealBuyerPersona": {
    "buyerType": "young_couple" | "investor" | "family" | "professional",
    "budgetRange": { "min": number, "max": number },
    "timeline": "immediate" | "3months" | "6months" | "1year",
    "preferences": ["string"]
  }
}`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    let analysisText = content.text.trim();
    if (analysisText.startsWith('```json')) {
      analysisText = analysisText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    }

    const analysis: PropertyAnalysis = JSON.parse(analysisText);

    // Save analysis to database
    await supabase
      .from('property_analysis')
      .insert([{
        property_id: propertyId,
        market_position: analysis.marketPosition,
        comparable_properties: analysis.comparableProperties,
        demand_score: analysis.demandScore,
        ideal_buyer_persona: analysis.idealBuyerPersona,
        analyzed_at: new Date().toISOString()
      }]);

    return analysis;

  } catch (error) {
    console.error('[Layer 1] Error analyzing property:', error);
    // Return default analysis
    return {
      marketPosition: 'mid',
      comparableProperties: [],
      demandScore: 50,
      idealBuyerPersona: {
        buyerType: 'family',
        budgetRange: { min: property.price_inr * 0.8 || 4000000, max: property.price_inr * 1.2 || 6000000 },
        timeline: '3months',
        preferences: []
      }
    };
  }
}

/**
 * Generate intent-matched leads based on property analysis
 */
export async function generateIntentMatchedLeads(
  propertyId: string,
  analysis: PropertyAnalysis,
  leadCount: number
): Promise<IntentMatchedLead[]> {
  const supabase = getSupabase();

  const { data: property } = await supabase
    .from('properties')
    .select('*')
    .eq('id', propertyId)
    .single();

  if (!property) throw new Error('Property not found');

  const prompt = `Generate ${leadCount} INTENT-MATCHED property buyer leads for this exact property in Tamil Nadu, India.

Property Analysis:
- Market Position: ${analysis.marketPosition}
- Demand Score: ${analysis.demandScore}/100
- Ideal Buyer: ${analysis.idealBuyerPersona.buyerType}
- Target Budget: ₹${analysis.idealBuyerPersona.budgetRange.min.toLocaleString('en-IN')} - ₹${analysis.idealBuyerPersona.budgetRange.max.toLocaleString('en-IN')}
- Timeline: ${analysis.idealBuyerPersona.timeline}

Property Details:
- Name: ${property.property_name || property.title}
- Location: ${property.locality || property.city}
- Type: ${property.property_type}
- Price: ₹${property.price_inr?.toLocaleString('en-IN')}

Requirements:
1. Each lead MUST specifically want THIS property type in THIS location
2. Budget MUST match property price range (±20%)
3. Timeline MUST align with property availability
4. Payment capacity should be realistic (pre_approved, savings, needs_loan, cash_ready)
5. Buyer persona should match ideal buyer type

Return JSON array with:
{
  "name": "realistic Tamil Nadu name",
  "email": "realistic email",
  "phone": "10-digit Indian phone starting with 6-9",
  "interest_level": "high" | "medium" | "low",
  "estimated_budget": number,
  "budget_min": number,
  "budget_max": number,
  "timeline": "immediate" | "3months" | "6months" | "1year",
  "buyer_persona": "young_couple" | "investor" | "family" | "professional",
  "payment_capacity": "pre_approved" | "savings" | "needs_loan" | "cash_ready",
  "preferred_location": "string (should match property location)",
  "property_type_preference": "string (should match property type)"
}

Quality distribution:
- 30% high interest (immediate timeline, exact budget match)
- 50% medium interest (3-6 months, close budget match)
- 20% low interest (6-12 months, budget variation)

Return ONLY valid JSON array. No markdown.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 8000,
      messages: [{ role: 'user', content: prompt }]
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    let leadsText = content.text.trim();
    if (leadsText.startsWith('```json')) {
      leadsText = leadsText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    }

    const leads: Omit<IntentMatchedLead, 'intent_score' | 'quality_score'>[] = JSON.parse(leadsText);

    // Calculate intent and quality scores
    const scoredLeads: IntentMatchedLead[] = leads.map(lead => {
      const intentScore = calculateIntentScore(lead, property, analysis);
      const qualityScore = calculateQualityScore(lead, property, analysis);
      
      return {
        ...lead,
        intent_score: intentScore,
        quality_score: qualityScore
      };
    });

    // Sort by quality score (highest first)
    scoredLeads.sort((a, b) => b.quality_score - a.quality_score);

    return scoredLeads.slice(0, leadCount);

  } catch (error) {
    console.error('[Layer 1] Error generating intent-matched leads:', error);
    throw error;
  }
}

/**
 * Calculate intent score (0-100) - how well lead matches property intent
 */
function calculateIntentScore(
  lead: Omit<IntentMatchedLead, 'intent_score' | 'quality_score'>,
  property: any,
  analysis: PropertyAnalysis
): number {
  let score = 0;

  // Budget match (40 points)
  const propertyPrice = property.price_inr || 5000000;
  const budgetMatch = (lead.budget_min + lead.budget_max) / 2;
  const budgetRatio = budgetMatch / propertyPrice;
  
  if (budgetRatio >= 0.9 && budgetRatio <= 1.1) score += 40; // Perfect match
  else if (budgetRatio >= 0.8 && budgetRatio <= 1.2) score += 30; // Close match
  else if (budgetRatio >= 0.7 && budgetRatio <= 1.3) score += 20; // Acceptable
  else score += 10; // Poor match

  // Location match (20 points)
  const propertyLocation = (property.locality || property.city || '').toLowerCase();
  const leadLocation = (lead.preferred_location || '').toLowerCase();
  if (leadLocation.includes(propertyLocation) || propertyLocation.includes(leadLocation)) {
    score += 20;
  } else if (leadLocation.includes('chennai') && propertyLocation.includes('chennai')) {
    score += 15; // Same city
  } else {
    score += 5; // Different location
  }

  // Property type match (20 points)
  const propertyType = (property.property_type || '').toLowerCase();
  const leadPreference = (lead.property_type_preference || '').toLowerCase();
  if (leadPreference.includes(propertyType) || propertyType.includes(leadPreference)) {
    score += 20;
  } else {
    score += 10;
  }

  // Timeline match (10 points)
  if (lead.timeline === 'immediate') score += 10;
  else if (lead.timeline === '3months') score += 8;
  else if (lead.timeline === '6months') score += 5;
  else score += 2;

  // Buyer persona match (10 points)
  if (lead.buyer_persona === analysis.idealBuyerPersona.buyerType) {
    score += 10;
  } else {
    score += 5;
  }

  return Math.min(score, 100);
}

/**
 * Calculate quality score (0-100) - overall lead quality
 */
function calculateQualityScore(
  lead: Omit<IntentMatchedLead, 'intent_score' | 'quality_score'>,
  property: any,
  analysis: PropertyAnalysis
): number {
  let score = 50; // Base score

  // Intent score contribution (30%)
  const intentScore = calculateIntentScore(lead, property, analysis);
  score += intentScore * 0.3;

  // Interest level (20%)
  if (lead.interest_level === 'high') score += 20;
  else if (lead.interest_level === 'medium') score += 10;
  else score += 5;

  // Payment capacity (20%)
  if (lead.payment_capacity === 'pre_approved') score += 20;
  else if (lead.payment_capacity === 'cash_ready') score += 18;
  else if (lead.payment_capacity === 'savings') score += 12;
  else score += 8;

  // Timeline urgency (15%)
  if (lead.timeline === 'immediate') score += 15;
  else if (lead.timeline === '3months') score += 10;
  else if (lead.timeline === '6months') score += 5;
  else score += 2;

  // Budget alignment (15%)
  const propertyPrice = property.price_inr || 5000000;
  const budgetMid = (lead.budget_min + lead.budget_max) / 2;
  const alignment = 1 - Math.abs(budgetMid - propertyPrice) / propertyPrice;
  score += alignment * 15;

  return Math.min(score, 100);
}

