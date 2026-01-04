export interface SearchIntent {
  type: 'property_search' | 'location_query' | 'price_inquiry' | 'amenity_search';
  confidence: number;
  extractedFilters: any;
  suggestions: string[];
}

export function analyzeSearchIntent(query: string): SearchIntent {
  const lowerQuery = query.toLowerCase();
  let type: SearchIntent['type'] = 'property_search';
  let confidence = 0;
  const filters: any = {};
  const suggestions: string[] = [];

  // Detect intent type
  if (lowerQuery.includes('where') || lowerQuery.includes('location')) {
    type = 'location_query';
    confidence = 0.8;
  } else if (lowerQuery.includes('price') || lowerQuery.includes('cost') || lowerQuery.includes('budget')) {
    type = 'price_inquiry';
    confidence = 0.85;
  } else if (lowerQuery.includes('gym') || lowerQuery.includes('pool') || lowerQuery.includes('parking')) {
    type = 'amenity_search';
    confidence = 0.9;
  } else {
    type = 'property_search';
    confidence = 0.7;
  }

  // Extract entities
  
  // Location patterns
  const locationPatterns = [
    /in\s+([a-z\s]+?)(?:\s|$)/i,
    /near\s+([a-z\s]+?)(?:\s|$)/i,
    /at\s+([a-z\s]+?)(?:\s|$)/i,
    /([a-z\s]+?)\s+area/i
  ];

  for (const pattern of locationPatterns) {
    const match = lowerQuery.match(pattern);
    if (match) {
      filters.area = match[1].trim();
      confidence += 0.1;
      break;
    }
  }

  // Budget patterns
  const budgetPatterns = [
    /under\s+(\d+)\s*(lakh|crore)/i,
    /below\s+(\d+)\s*(lakh|crore)/i,
    /(\d+)\s*(lakh|crore)\s+budget/i,
    /(\d+)l/i // shorthand
  ];

  for (const pattern of budgetPatterns) {
    const match = lowerQuery.match(pattern);
    if (match) {
      const amount = parseInt(match[1]);
      const unit = match[2]?.toLowerCase() || 'lakh';
      
      if (unit === 'lakh' || match[0].includes('l')) {
        filters.budget_max = amount * 100000;
      } else {
        filters.budget_max = amount * 10000000;
      }
      confidence += 0.15;
      break;
    }
  }

  // BHK patterns
  const bhkMatch = lowerQuery.match(/(\d+)\s*(?:bhk|bedroom)/i);
  if (bhkMatch) {
    filters.bhk_type = `${bhkMatch[1]}BHK`;
    confidence += 0.1;
  }

  // Property type
  const propertyTypes = {
    'apartment': ['apartment', 'flat'],
    'villa': ['villa', 'independent house'],
    'plot': ['plot', 'land'],
    'penthouse': ['penthouse']
  };

  for (const [type, keywords] of Object.entries(propertyTypes)) {
    if (keywords.some(k => lowerQuery.includes(k))) {
      filters.property_type = type;
      confidence += 0.1;
      break;
    }
  }

  // Amenities
  const amenities = [
    'gym', 'pool', 'swimming pool', 'parking', 'security',
    'clubhouse', 'garden', 'playground', 'lift', 'power backup'
  ];

  const foundAmenities = amenities.filter(a => lowerQuery.includes(a));
  if (foundAmenities.length > 0) {
    filters.amenities = foundAmenities;
    confidence += 0.1;
  }

  // Generate suggestions
  if (!filters.area) {
    suggestions.push('Specify a location (e.g., "in Anna Nagar")');
  }
  if (!filters.budget_max) {
    suggestions.push('Add budget range (e.g., "under 80 lakhs")');
  }
  if (!filters.bhk_type) {
    suggestions.push('Specify BHK type (e.g., "3BHK")');
  }

  return {
    type,
    confidence: Math.min(confidence, 1),
    extractedFilters: filters,
    suggestions
  };
}

export function generateSearchSuggestions(partialQuery: string): string[] {
  const lowerQuery = partialQuery.toLowerCase();
  const suggestions: string[] = [];

  // Common search patterns
  const patterns = [
    '3BHK apartments in Chennai under 80 lakhs',
    '2BHK ready to move in Bangalore',
    'Villa with swimming pool in Hyderabad',
    'Properties near metro station',
    'RERA approved apartments',
    'Furnished flats in IT corridor'
  ];

  // Filter based on partial query
  if (lowerQuery.length > 0) {
    return patterns.filter(p => 
      p.toLowerCase().includes(lowerQuery)
    ).slice(0, 5);
  }

  return patterns.slice(0, 5);
}























































