/**
 * Enhanced AI-Powered Search with OpenAI Integration
 * Provides advanced natural language understanding and intelligent search capabilities
 */

export interface EnhancedSearchResult {
  intent: SearchIntent;
  properties: any[];
  insights: SearchInsights;
  recommendations: PropertyRecommendation[];
  marketAnalysis?: MarketAnalysis;
}

export interface SearchIntent {
  type: 'property_search' | 'location_query' | 'price_inquiry' | 'amenity_search' | 'investment_analysis' | 'comparison';
  confidence: number;
  extractedFilters: any;
  entities: ExtractedEntity[];
  suggestions: string[];
}

export interface ExtractedEntity {
  type: 'location' | 'budget' | 'bhk' | 'amenity' | 'property_type' | 'timeline';
  value: any;
  confidence: number;
}

export interface SearchInsights {
  totalResults: number;
  averagePrice: number;
  priceRange: { min: number; max: number };
  popularAreas: string[];
  marketTrend: 'rising' | 'stable' | 'declining';
  bestMatches: number;
}

export interface PropertyRecommendation {
  propertyId: string;
  reason: string;
  matchScore: number;
  features: string[];
}

export interface MarketAnalysis {
  area: string;
  averagePricePerSqft: number;
  priceGrowthRate: number;
  demandLevel: 'high' | 'medium' | 'low';
  futurePotential: number; // 0-100 score
  nearbyDevelopments: string[];
}

/**
 * Enhanced natural language processing with context understanding
 */
export async function processNaturalLanguageQuery(
  query: string,
  userContext?: any
): Promise<EnhancedSearchResult> {
  try {
    // Call OpenAI for advanced understanding
    const response = await fetch('/api/ai/enhanced-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, userContext })
    });

    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Enhanced search error:', error);
  }

  // Fallback to basic processing
  return processBasicQuery(query);
}

/**
 * Basic query processing fallback
 */
function processBasicQuery(query: string): EnhancedSearchResult {
  const intent = analyzeAdvancedIntent(query);
  return {
    intent,
    properties: [],
    insights: {
      totalResults: 0,
      averagePrice: 0,
      priceRange: { min: 0, max: 0 },
      popularAreas: [],
      marketTrend: 'stable',
      bestMatches: 0
    },
    recommendations: []
  };
}

/**
 * Advanced intent analysis with entity extraction
 */
export function analyzeAdvancedIntent(query: string): SearchIntent {
  const lowerQuery = query.toLowerCase();
  let type: SearchIntent['type'] = 'property_search';
  let confidence = 0.5;
  const filters: any = {};
  const entities: ExtractedEntity[] = [];
  const suggestions: string[] = [];

  // Detect advanced intent types
  if (lowerQuery.includes('compare') || lowerQuery.includes('vs') || lowerQuery.includes('difference')) {
    type = 'comparison';
    confidence = 0.9;
  } else if (lowerQuery.includes('investment') || lowerQuery.includes('roi') || lowerQuery.includes('return')) {
    type = 'investment_analysis';
    confidence = 0.85;
  } else if (lowerQuery.includes('where') || lowerQuery.includes('location')) {
    type = 'location_query';
    confidence = 0.8;
  } else if (lowerQuery.includes('price') || lowerQuery.includes('cost') || lowerQuery.includes('budget')) {
    type = 'price_inquiry';
    confidence = 0.85;
  } else if (lowerQuery.includes('gym') || lowerQuery.includes('pool') || lowerQuery.includes('parking')) {
    type = 'amenity_search';
    confidence = 0.9;
  }

  // Enhanced entity extraction
  extractAdvancedEntities(lowerQuery, entities, filters);

  // Generate intelligent suggestions
  if (entities.length === 0) {
    suggestions.push('Try specifying location (e.g., "in Anna Nagar")');
  }
  if (!filters.budget_max && !filters.budget_min) {
    suggestions.push('Add budget range for better results (e.g., "under 1 crore")');
  }
  if (type === 'investment_analysis' && !filters.area) {
    suggestions.push('Specify area for investment analysis');
  }

  return {
    type,
    confidence: Math.min(confidence, 1),
    extractedFilters: filters,
    entities,
    suggestions
  };
}

/**
 * Advanced entity extraction with confidence scoring
 */
function extractAdvancedEntities(
  query: string,
  entities: ExtractedEntity[],
  filters: any
) {
  // Location extraction with confidence
  const locationPatterns = [
    { pattern: /in\s+([a-z\s]+?)(?:\s+under|\s+for|\s+with|$)/i, confidence: 0.9 },
    { pattern: /near\s+([a-z\s]+?)(?:\s|$)/i, confidence: 0.85 },
    { pattern: /([a-z\s]+?)\s+area/i, confidence: 0.8 }
  ];

  for (const { pattern, confidence } of locationPatterns) {
    const match = query.match(pattern);
    if (match) {
      filters.area = match[1].trim();
      entities.push({
        type: 'location',
        value: match[1].trim(),
        confidence
      });
      break;
    }
  }

  // Budget extraction with range detection
  const budgetPatterns = [
    { pattern: /between\s+(\d+)\s*(?:and|-)\s+(\d+)\s*(lakh|crore)/i, isRange: true },
    { pattern: /under\s+(\d+)\s*(lakh|crore)/i, isRange: false },
    { pattern: /above\s+(\d+)\s*(lakh|crore)/i, isRange: false },
    { pattern: /(\d+)\s*(lakh|crore)\s+budget/i, isRange: false }
  ];

  for (const { pattern, isRange } of budgetPatterns) {
    const match = query.match(pattern);
    if (match) {
      const unit = (match[3] || match[2] || 'lakh').toLowerCase();
      const multiplier = unit === 'crore' ? 10000000 : 100000;
      
      if (isRange && match[1] && match[2]) {
        filters.budget_min = parseInt(match[1]) * multiplier;
        filters.budget_max = parseInt(match[2]) * multiplier;
        entities.push({
          type: 'budget',
          value: { min: filters.budget_min, max: filters.budget_max },
          confidence: 0.9
        });
      } else {
        const amount = parseInt(match[1]) * multiplier;
        if (pattern.source.includes('under')) {
          filters.budget_max = amount;
        } else if (pattern.source.includes('above')) {
          filters.budget_min = amount;
        } else {
          filters.budget_max = amount;
        }
        entities.push({
          type: 'budget',
          value: amount,
          confidence: 0.85
        });
      }
      break;
    }
  }

  // BHK extraction
  const bhkMatch = query.match(/(\d+)\s*(?:bhk|bedroom|bed)/i);
  if (bhkMatch) {
    filters.bhk_type = `${bhkMatch[1]}BHK`;
    entities.push({
      type: 'bhk',
      value: `${bhkMatch[1]}BHK`,
      confidence: 0.95
    });
  }

  // Timeline extraction
  const timelinePatterns = [
    { pattern: /ready\s+to\s+move/i, value: 'ready_to_move', confidence: 0.9 },
    { pattern: /within\s+(\d+)\s*months?/i, value: 'months', confidence: 0.8 },
    { pattern: /by\s+(\d{4})/i, value: 'year', confidence: 0.85 }
  ];

  for (const { pattern, value, confidence } of timelinePatterns) {
    if (pattern.test(query)) {
      filters.possession_status = value;
      entities.push({
        type: 'timeline',
        value,
        confidence
      });
      break;
    }
  }

  // Amenity extraction
  const amenities = [
    'gym', 'pool', 'swimming pool', 'parking', 'security',
    'clubhouse', 'garden', 'playground', 'lift', 'power backup',
    'park', 'school', 'hospital', 'metro', 'mall'
  ];

  const foundAmenities = amenities.filter(a => query.includes(a));
  if (foundAmenities.length > 0) {
    filters.amenities = foundAmenities;
    entities.push({
      type: 'amenity',
      value: foundAmenities,
      confidence: 0.8
    });
  }
}

/**
 * Generate personalized recommendations based on user history
 */
export async function generatePersonalizedRecommendations(
  userId: string,
  searchFilters: any
): Promise<PropertyRecommendation[]> {
  try {
    const response = await fetch(`/api/ai/recommendations?userId=${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filters: searchFilters })
    });

    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Recommendation error:', error);
  }

  return [];
}

/**
 * Get market analysis for an area
 */
export async function getMarketAnalysis(area: string): Promise<MarketAnalysis | null> {
  try {
    const response = await fetch(`/api/ai/market-analysis?area=${encodeURIComponent(area)}`);
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Market analysis error:', error);
  }

  return null;
}


