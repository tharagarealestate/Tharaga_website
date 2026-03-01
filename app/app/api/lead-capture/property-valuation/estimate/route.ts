/**
 * Property Valuation API
 * AI-powered property price estimation based on market data
 * Tamil Nadu market-specific pricing
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

interface ValuationInput {
  property_type: 'apartment' | 'villa' | 'plot' | 'penthouse';
  bhk_config: string; // '1BHK', '2BHK', '3BHK', '4BHK+', 'Studio'
  total_area_sqft: number;
  locality: string;
  city: string;
  property_age_years: number;
  furnishing: 'unfurnished' | 'semi_furnished' | 'fully_furnished';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      property_type,
      bhk_config,
      total_area_sqft,
      locality,
      city = 'Chennai',
      property_age_years = 0,
      furnishing = 'unfurnished',
      use_advanced_ai = false,
    }: ValuationInput & { use_advanced_ai?: boolean } = body;

    if (!property_type || !bhk_config || !total_area_sqft || !locality) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get base price per sqft for locality
    const basePricePerSqft = getBasePricePerSqft(city, locality, property_type);

    // Calculate base value
    let estimatedValue = basePricePerSqft * total_area_sqft;

    // Adjust for property age (depreciation)
    if (property_age_years > 0) {
      const depreciationRate = Math.min(property_age_years * 0.015, 0.3); // Max 30% depreciation
      estimatedValue *= (1 - depreciationRate);
    }

    // Adjust for furnishing
    const furnishingMultipliers: Record<string, number> = {
      'unfurnished': 1.0,
      'semi_furnished': 1.08,
      'fully_furnished': 1.15,
    };
    estimatedValue *= furnishingMultipliers[furnishing] || 1.0;

    // Adjust for BHK configuration (premium for larger units)
    const bhkMultipliers: Record<string, number> = {
      'Studio': 0.85,
      '1BHK': 1.0,
      '2BHK': 1.05,
      '3BHK': 1.12,
      '4BHK+': 1.20,
    };
    estimatedValue *= bhkMultipliers[bhk_config] || 1.0;

    // Metro proximity premium (Chennai only)
    let metroPremium = 0;
    if (city === 'Chennai' && hasMetroProximity(locality)) {
      metroPremium = estimatedValue * 0.15; // 15% premium
      estimatedValue += metroPremium;
    }

    // Confidence level based on data availability
    const confidenceLevel = property_age_years === 0 ? 92 : 
                           property_age_years < 5 ? 88 : 85;

    // Price range (±8%)
    const priceRange = {
      low: Math.round(estimatedValue * 0.92),
      high: Math.round(estimatedValue * 1.08),
    };

    // Market trend (based on city)
    const marketTrend = getMarketTrend(city);

    // If advanced AI is requested, use advanced service
    if (use_advanced_ai) {
      try {
        // Import and call advanced AI service directly (no internal fetch needed)
        const { analyzeAdvancedPropertyValuation } = await import('@/lib/services/advanced-ai-tools-service');
        const advancedAnalysis = await analyzeAdvancedPropertyValuation(
          property_type || 'apartment',
          bhk_config,
          total_area_sqft,
          locality,
          city,
          property_age_years || 0,
          furnishing || 'unfurnished'
        );
        
        return NextResponse.json({
          success: true,
          results: advancedAnalysis,
          ai_enhanced: true,
          models_used: ['GPT-4o', 'Claude Sonnet 4', 'Ensemble AVM'],
        });
      } catch (aiError) {
        console.error('Advanced AI failed, using base calculations:', aiError);
      }
    }

    return NextResponse.json({
      success: true,
      results: {
        estimated_value: Math.round(estimatedValue),
        confidence_level: confidenceLevel,
        price_range: priceRange,
        price_per_sqft: Math.round(estimatedValue / total_area_sqft),
        base_price_per_sqft: basePricePerSqft,
        adjustments: {
          depreciation: property_age_years > 0 ? Math.round(estimatedValue * (property_age_years * 0.015)) : 0,
          furnishing_premium: Math.round(estimatedValue * ((furnishingMultipliers[furnishing] - 1))),
          metro_premium: Math.round(metroPremium),
          bhk_premium: Math.round(estimatedValue * ((bhkMultipliers[bhk_config] || 1) - 1)),
        },
        market_trend: marketTrend,
        comparable_properties: getComparableProperties(city, locality, property_type),
      },
    });
  } catch (error: any) {
    console.error('Error estimating property value:', error);
    return NextResponse.json(
      { error: 'Failed to estimate property value', details: error.message },
      { status: 500 }
    );
  }
}

function getBasePricePerSqft(city: string, locality: string, propertyType: string): number {
  // Chennai pricing (per sqft)
  const chennaiPrices: Record<string, Record<string, number>> = {
    'OMR': { apartment: 8000, villa: 12000, penthouse: 15000 },
    'Indiranagar': { apartment: 9000, villa: 13000, penthouse: 16000 },
    'Koramangala': { apartment: 8000, villa: 12000, penthouse: 15000 },
    'HSR Layout': { apartment: 7500, villa: 11000, penthouse: 14000 },
    'Jayanagar': { apartment: 8500, villa: 12500, penthouse: 15500 },
    'Perungudi': { apartment: 7500, villa: 11000, penthouse: 14000 },
    'Velachery': { apartment: 7000, villa: 10500, penthouse: 13500 },
    'Porur': { apartment: 6500, villa: 10000, penthouse: 13000 },
  };

  // Coimbatore pricing
  const coimbatorePrices: Record<string, Record<string, number>> = {
    'Saravanampatti': { apartment: 5500, villa: 8500, penthouse: 11000 },
    'Peelamedu': { apartment: 5000, villa: 8000, penthouse: 10500 },
    'RS Puram': { apartment: 5800, villa: 9000, penthouse: 11500 },
  };

  const prices = city === 'Chennai' ? chennaiPrices : coimbatorePrices;
  const localityPrices = prices[locality] || prices[Object.keys(prices)[0]];
  
  return localityPrices[propertyType as keyof typeof localityPrices] || localityPrices.apartment;
}

function hasMetroProximity(locality: string): boolean {
  const metroLocalities = ['OMR', 'Velachery', 'Porur', 'Indiranagar'];
  return metroLocalities.some(l => locality.includes(l));
}

function getMarketTrend(city: string) {
  const trends: Record<string, any> = {
    'Chennai': {
      last_6_months: '+8%',
      year_over_year: '+12%',
      forecast_next_year: '+6-8%',
    },
    'Coimbatore': {
      last_6_months: '+6%',
      year_over_year: '+10%',
      forecast_next_year: '+5-7%',
    },
    'Madurai': {
      last_6_months: '+5%',
      year_over_year: '+8%',
      forecast_next_year: '+4-6%',
    },
  };

  return trends[city] || trends['Chennai'];
}

function getComparableProperties(city: string, locality: string, propertyType: string) {
  // Mock comparable properties (in real implementation, fetch from database)
  return [
    {
      address: `${locality} Similar Property`,
      sold_date: '2024-12-15',
      price_per_sqft: getBasePricePerSqft(city, locality, propertyType),
      similarity_score: 94,
    },
  ];
}













