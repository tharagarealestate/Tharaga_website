/**
 * AI-Powered Lead Generation Service
 * Uses Claude API to generate realistic property buyer leads
 */

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY || '',
});

export interface GeneratedLead {
  name: string;
  email: string;
  phone: string;
  interest_level: 'high' | 'medium' | 'low';
  estimated_budget: number;
  timeline: 'immediate' | '3months' | '6months' | '1year';
  preferred_location?: string;
  property_type_preference?: string;
  score: number;
}

export interface PropertyData {
  id: string;
  property_name?: string;
  title?: string;
  location?: string;
  city?: string;
  locality?: string;
  property_type?: string;
  total_units?: number;
  price_range?: string;
  price_inr?: number;
  description?: string;
}

export interface SubscriptionTier {
  tier: 'starter' | 'trial' | 'professional' | 'growth' | 'enterprise' | 'pro';
  leads_per_property: number;
}

/**
 * Generate leads based on property and subscription tier
 */
export async function generateLeads(
  property: PropertyData,
  subscription: SubscriptionTier
): Promise<GeneratedLead[]> {
  const leadCount = subscription.leads_per_property || 50;

  // Build property context
  const propertyName = property.property_name || property.title || 'Property';
  const location = property.locality || property.city || property.location || 'Chennai';
  const propertyType = property.property_type || 'Residential';
  const priceRange = property.price_range || 
    (property.price_inr ? `₹${property.price_inr.toLocaleString('en-IN')}` : '₹50,00,000 - ₹1,00,00,000');
  const description = property.description || 'Premium property';

  // Create prompt for Claude
  const prompt = `Generate ${leadCount} realistic property buyer leads for a real estate property in Tamil Nadu, India.

Property Details:
- Name: ${propertyName}
- Location: ${location}
- Type: ${propertyType}
- Price Range: ${priceRange}
- Description: ${description}
${property.total_units ? `- Total Units: ${property.total_units}` : ''}

Requirements for each lead:
1. name: Realistic Tamil Nadu name (Tamil, Telugu, or common Indian names)
2. email: Realistic email address (Gmail, Yahoo, Outlook, or custom domains)
3. phone: Valid Indian phone number (10 digits, starts with 6-9)
4. interest_level: "high", "medium", or "low" based on realistic buyer behavior
5. estimated_budget: Numeric value in INR (should align with property price range ±20%)
6. timeline: "immediate", "3months", "6months", or "1year"
7. preferred_location: City or locality preference (can be same as property location or nearby)
8. property_type_preference: Property type preference (e.g., "3BHK", "Villa", "Apartment")

Quality Guidelines:
- High interest leads (30%): Should have budget matching property, timeline "immediate" or "3months"
- Medium interest leads (50%): Budget close to property, timeline "3months" or "6months"
- Low interest leads (20%): Budget may vary, timeline "6months" or "1year"
- Mix of different buyer profiles (first-time buyers, investors, families, professionals)
- Realistic Indian names and contact information
- Varied locations (some same city, some nearby cities)

Return ONLY a valid JSON array of objects. No markdown, no explanations, just the JSON array.

Example format:
[
  {
    "name": "Rajesh Kumar",
    "email": "rajesh.kumar@gmail.com",
    "phone": "9876543210",
    "interest_level": "high",
    "estimated_budget": 8500000,
    "timeline": "immediate",
    "preferred_location": "Chennai",
    "property_type_preference": "3BHK Apartment"
  }
]`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 8000,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    // Extract JSON from response
    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    let leadsText = content.text.trim();
    
    // Remove markdown code blocks if present
    if (leadsText.startsWith('```json')) {
      leadsText = leadsText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (leadsText.startsWith('```')) {
      leadsText = leadsText.replace(/```\n?/g, '');
    }

    // Parse JSON
    const leads: Omit<GeneratedLead, 'score'>[] = JSON.parse(leadsText);

    // Validate and calculate quality scores
    const scoredLeads: GeneratedLead[] = leads.map(lead => ({
      ...lead,
      score: calculateQualityScore(lead, property)
    }));

    // Sort by score (highest first)
    scoredLeads.sort((a, b) => b.score - a.score);

    // Ensure we have the exact count requested
    return scoredLeads.slice(0, leadCount);

  } catch (error) {
    console.error('[Lead Generation] Error generating leads:', error);
    
    // Fallback: Generate basic leads if Claude fails
    return generateFallbackLeads(property, leadCount);
  }
}

/**
 * Calculate quality score for a lead (0-100)
 */
function calculateQualityScore(
  lead: Omit<GeneratedLead, 'score'>,
  property: PropertyData
): number {
  let score = 50; // Base score

  // Interest level contribution
  if (lead.interest_level === 'high') score += 30;
  else if (lead.interest_level === 'medium') score += 15;
  else if (lead.interest_level === 'low') score += 5;

  // Timeline contribution
  if (lead.timeline === 'immediate') score += 15;
  else if (lead.timeline === '3months') score += 10;
  else if (lead.timeline === '6months') score += 5;
  else if (lead.timeline === '1year') score += 2;

  // Budget match contribution
  const propertyPrice = property.price_inr || extractPriceFromRange(property.price_range || '');
  if (propertyPrice && lead.estimated_budget) {
    const budgetRatio = lead.estimated_budget / propertyPrice;
    if (budgetRatio >= 0.8 && budgetRatio <= 1.2) {
      // Budget matches property price ±20%
      score += 15;
    } else if (budgetRatio >= 0.6 && budgetRatio <= 1.5) {
      // Budget is close
      score += 8;
    }
  }

  // Location match contribution
  const propertyLocation = (property.locality || property.city || property.location || '').toLowerCase();
  const leadLocation = (lead.preferred_location || '').toLowerCase();
  if (leadLocation && propertyLocation && leadLocation.includes(propertyLocation)) {
    score += 10;
  }

  // Property type match
  const propertyType = (property.property_type || '').toLowerCase();
  const leadPreference = (lead.property_type_preference || '').toLowerCase();
  if (leadPreference && propertyType && leadPreference.includes(propertyType)) {
    score += 5;
  }

  // Cap at 100
  return Math.min(score, 100);
}

/**
 * Extract numeric price from price range string
 */
function extractPriceFromRange(priceRange: string): number | null {
  const match = priceRange.match(/₹?[\d,]+/);
  if (match) {
    return parseInt(match[0].replace(/[₹,]/g, ''), 10);
  }
  return null;
}

/**
 * Generate fallback leads if Claude API fails
 */
function generateFallbackLeads(
  property: PropertyData,
  count: number
): GeneratedLead[] {
  const propertyName = property.property_name || property.title || 'Property';
  const location = property.locality || property.city || property.location || 'Chennai';
  const propertyPrice = property.price_inr || 5000000;

  const names = [
    'Rajesh Kumar', 'Priya Sharma', 'Vikram Reddy', 'Anjali Menon',
    'Suresh Iyer', 'Deepa Nair', 'Karthik Pillai', 'Meera Krishnan',
    'Arjun Venkatesh', 'Lakshmi Raman', 'Mohan Das', 'Swathi Gopal',
    'Ravi Chandran', 'Divya Subramanian', 'Ganesh Murthy', 'Kavitha Ramesh'
  ];

  const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'rediffmail.com'];

  const leads: GeneratedLead[] = [];

  for (let i = 0; i < count; i++) {
    const nameIndex = i % names.length;
    const name = names[nameIndex];
    const email = `${name.toLowerCase().replace(/\s+/g, '.')}${i}@${domains[i % domains.length]}`;
    const phone = `9${Math.floor(Math.random() * 1000000000).toString().padStart(9, '0')}`;
    
    // Distribute interest levels
    let interest_level: 'high' | 'medium' | 'low';
    if (i < count * 0.3) interest_level = 'high';
    else if (i < count * 0.8) interest_level = 'medium';
    else interest_level = 'low';

    // Distribute timelines
    const timelineOptions: Array<'immediate' | '3months' | '6months' | '1year'> = 
      ['immediate', '3months', '6months', '1year'];
    const timeline = timelineOptions[Math.floor(Math.random() * timelineOptions.length)];

    // Budget variation
    const budgetVariation = 0.7 + Math.random() * 0.6; // ±30%
    const estimated_budget = Math.floor(propertyPrice * budgetVariation);

    const lead: GeneratedLead = {
      name,
      email,
      phone,
      interest_level,
      estimated_budget,
      timeline,
      preferred_location: location,
      property_type_preference: property.property_type || 'Residential',
      score: calculateQualityScore(
        { name, email, phone, interest_level, estimated_budget, timeline, preferred_location: location },
        property
      )
    };

    leads.push(lead);
  }

  // Sort by score
  leads.sort((a, b) => b.score - a.score);

  return leads;
}

/**
 * Validate generated leads
 */
export function validateLeads(leads: GeneratedLead[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  leads.forEach((lead, index) => {
    if (!lead.name || lead.name.trim().length === 0) {
      errors.push(`Lead ${index + 1}: Missing name`);
    }
    if (!lead.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) {
      errors.push(`Lead ${index + 1}: Invalid email`);
    }
    if (!lead.phone || !/^[6-9]\d{9}$/.test(lead.phone)) {
      errors.push(`Lead ${index + 1}: Invalid phone (must be 10 digits starting with 6-9)`);
    }
    if (lead.score < 0 || lead.score > 100) {
      errors.push(`Lead ${index + 1}: Invalid score (must be 0-100)`);
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}

