/**
 * LAYER 3: BUILDER COMMUNICATION AUTOMATION
 * AI-powered communication suggestions with context awareness
 */

import Anthropic from '@anthropic-ai/sdk';
import { getSupabase } from '@/lib/supabase';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY || '',
});

export interface CommunicationSuggestion {
  suggestionType: 'first_contact' | 'follow_up' | 'objection_handling' | 'price_negotiation' | 'viewing_pitch' | 'closing_pitch';
  suggestedMessage: string;
  suggestedSubject?: string;
  talkingPoints: string[];
  strategyReasoning: string;
  expectedOutcome: string;
  buyerContext: {
    buyerType: string;
    actions: string[];
    preferences: string[];
    objections?: string[];
  };
}

/**
 * Generate communication suggestion based on buyer context
 */
export async function generateCommunicationSuggestion(
  journeyId: string,
  builderId: string,
  suggestionType: CommunicationSuggestion['suggestionType'],
  context?: any
): Promise<CommunicationSuggestion> {
  const supabase = getSupabase();

  // Get journey and lead details
  const { data: journey } = await supabase
    .from('buyer_journey')
    .select(`
      *,
      lead:generated_leads(*),
      property:properties(*)
    `)
    .eq('id', journeyId)
    .single();

  if (!journey) {
    throw new Error('Journey not found');
  }

  const lead = (journey as any).lead;
  const property = (journey as any).property;

  // Determine buyer type
  const buyerType = determineBuyerType(lead, journey);

  // Get buyer actions and preferences
  const buyerActions = getBuyerActions(journey);
  const buyerPreferences = getBuyerPreferences(lead, property);
  const objections = context?.objections || [];

  // Use Claude to generate personalized message
  const prompt = buildCommunicationPrompt(
    suggestionType,
    buyerType,
    lead,
    property,
    buyerActions,
    buyerPreferences,
    objections,
    context
  );

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

    let suggestionText = content.text.trim();
    if (suggestionText.startsWith('```json')) {
      suggestionText = suggestionText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    }

    const suggestion: CommunicationSuggestion = JSON.parse(suggestionText);

    // Save suggestion
    await supabase
      .from('communication_suggestions')
      .insert([{
        journey_id: journeyId,
        builder_id: builderId,
        suggestion_type: suggestionType,
        buyer_context: {
          buyerType: suggestion.buyerContext.buyerType,
          actions: suggestion.buyerContext.actions,
          preferences: suggestion.buyerContext.preferences,
          objections: suggestion.buyerContext.objections
        },
        suggested_message: suggestion.suggestedMessage,
        suggested_subject: suggestion.suggestedSubject,
        talking_points: suggestion.talkingPoints,
        strategy_reasoning: suggestion.strategyReasoning,
        expected_outcome: suggestion.expectedOutcome
      }]);

    return suggestion;

  } catch (error) {
    console.error('[Layer 3] Error generating suggestion:', error);
    // Return fallback suggestion
    return generateFallbackSuggestion(suggestionType, buyerType, lead, property);
  }
}

function determineBuyerType(lead: any, journey: any): string {
  if (lead.buyer_persona) {
    return lead.buyer_persona;
  }

  // Determine from behavior
  if (lead.payment_capacity === 'pre_approved' || lead.payment_capacity === 'cash_ready') {
    return 'quality_focused';
  }
  if (lead.estimated_budget && lead.estimated_budget < (lead.property?.price_inr || 0) * 0.9) {
    return 'budget_conscious';
  }
  if (lead.timeline === 'immediate') {
    return 'time_sensitive';
  }

  return 'quality_focused';
}

function getBuyerActions(journey: any): string[] {
  const actions: string[] = [];
  
  if (journey.emails_opened > 0) actions.push('opened_email');
  if (journey.emails_clicked > 0) actions.push('clicked_link');
  if (journey.has_responded) actions.push('responded');
  if (journey.response_type) actions.push(`responded_${journey.response_type}`);
  
  return actions;
}

function getBuyerPreferences(lead: any, property: any): string[] {
  const preferences: string[] = [];
  
  if (lead.preferred_location) preferences.push(`location:${lead.preferred_location}`);
  if (lead.property_type_preference) preferences.push(`type:${lead.property_type_preference}`);
  if (lead.timeline) preferences.push(`timeline:${lead.timeline}`);
  if (lead.payment_capacity) preferences.push(`payment:${lead.payment_capacity}`);
  
  return preferences;
}

function buildCommunicationPrompt(
  type: string,
  buyerType: string,
  lead: any,
  property: any,
  actions: string[],
  preferences: string[],
  objections: string[],
  context?: any
): string {
  const basePrompt = `You are an expert real estate communication advisor helping a builder communicate with a potential buyer.

Buyer Profile:
- Name: ${lead.lead_buyer_name}
- Type: ${buyerType}
- Budget: ₹${lead.budget_min?.toLocaleString('en-IN')} - ₹${lead.budget_max?.toLocaleString('en-IN')}
- Timeline: ${lead.timeline}
- Payment: ${lead.payment_capacity}
- Preferences: ${preferences.join(', ')}
- Actions: ${actions.join(', ')}

Property:
- Name: ${property.property_name || property.title}
- Location: ${property.locality || property.city}
- Price: ₹${property.price_inr?.toLocaleString('en-IN')}
- Type: ${property.property_type}

Communication Type: ${type}
${objections.length > 0 ? `Objections: ${objections.join(', ')}` : ''}

Generate a personalized communication suggestion in JSON format:
{
  "suggestedMessage": "Complete message to send (2-3 paragraphs, warm and professional)",
  "suggestedSubject": "Email subject line (if email)",
  "talkingPoints": ["point1", "point2", "point3"],
  "strategyReasoning": "Why this approach works for this buyer",
  "expectedOutcome": "What response to expect",
  "buyerContext": {
    "buyerType": "${buyerType}",
    "actions": ${JSON.stringify(actions)},
    "preferences": ${JSON.stringify(preferences)},
    "objections": ${JSON.stringify(objections)}
  }
}

Guidelines:
- For budget_conscious: Emphasize value, no pressure
- For time_sensitive: Emphasize urgency, quick process
- For quality_focused: Emphasize features, neighborhood
- For investors: Emphasize ROI, rental potential
- Address objections directly but positively
- Keep tone warm, professional, helpful
- Include specific property details
- Make it personal, not template-like

Return ONLY valid JSON. No markdown.`;

  // Add type-specific guidance
  const typeGuidance: Record<string, string> = {
    'first_contact': 'This is the first message. Introduce property, highlight key match points, invite for viewing.',
    'follow_up': 'Buyer hasn\'t responded. Re-engage with new angle, address potential concerns, offer flexibility.',
    'objection_handling': 'Address specific objections. Provide solutions, alternatives, or reassurance.',
    'price_negotiation': 'Discuss pricing. Show value, justify price, suggest win-win solution.',
    'viewing_pitch': 'Encourage property viewing. Highlight unique features, convenient timing, special offer.',
    'closing_pitch': 'Move toward decision. Create urgency, offer incentives, simplify process.'
  };

  return `${basePrompt}\n\n${typeGuidance[type] || ''}`;
}

function generateFallbackSuggestion(
  type: string,
  buyerType: string,
  lead: any,
  property: any
): CommunicationSuggestion {
  const templates: Record<string, string> = {
    'first_contact': `Hi ${lead.lead_buyer_name}, I found a property that matches your requirements perfectly. ${property.property_name} in ${property.locality} is exactly what you're looking for. Would you like to schedule a viewing?`,
    'follow_up': `Hi ${lead.lead_buyer_name}, I wanted to follow up on ${property.property_name}. I have some exciting updates about this property. When would be a good time to connect?`,
    'objection_handling': `Hi ${lead.lead_buyer_name}, I understand your concerns about ${property.property_name}. Let me address those and show you how this property actually meets your needs better than you might think.`,
    'price_negotiation': `Hi ${lead.lead_buyer_name}, regarding the price of ${property.property_name}, I'd like to discuss a solution that works for both of us. The property offers exceptional value at this price point.`,
    'viewing_pitch': `Hi ${lead.lead_buyer_name}, ${property.property_name} is even better in person. I'd love to show you around this weekend. What time works for you?`,
    'closing_pitch': `Hi ${lead.lead_buyer_name}, ${property.property_name} is generating a lot of interest. To secure this property, let's finalize the details. I can make the process smooth and quick for you.`
  };

  return {
    suggestionType: type as any,
    suggestedMessage: templates[type] || templates['first_contact'],
    talkingPoints: ['Property matches buyer requirements', 'Flexible viewing schedule', 'Quick decision process'],
    strategyReasoning: `Tailored for ${buyerType} buyer type`,
    expectedOutcome: 'Positive response and viewing request',
    buyerContext: {
      buyerType,
      actions: [],
      preferences: []
    }
  };
}

/**
 * Get communication suggestions for a journey
 */
export async function getCommunicationSuggestions(
  journeyId: string
): Promise<CommunicationSuggestion[]> {
  const supabase = getSupabase();

  const { data: suggestions } = await supabase
    .from('communication_suggestions')
    .select('*')
    .eq('journey_id', journeyId)
    .eq('was_used', false)
    .order('created_at', { ascending: false })
    .limit(5);

  if (!suggestions) return [];

  return suggestions.map(s => ({
    suggestionType: s.suggestion_type as any,
    suggestedMessage: s.suggested_message,
    suggestedSubject: s.suggested_subject || undefined,
    talkingPoints: s.talking_points as string[],
    strategyReasoning: s.strategy_reasoning || '',
    expectedOutcome: s.expected_outcome || '',
    buyerContext: s.buyer_context as any
  }));
}

