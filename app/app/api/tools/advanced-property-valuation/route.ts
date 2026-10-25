/**
 * Advanced Property Valuation API
 * Uses ensemble AVM models with ML
 */

import { NextRequest, NextResponse } from 'next/server';
import { analyzeAdvancedPropertyValuation } from '@/lib/services/advanced-ai-tools-service';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      property_type,
      bhk_config,
      total_area_sqft,
      locality,
      city,
      property_age_years = 0,
      furnishing = 'unfurnished',
    } = body;

    if (!property_type || !bhk_config || !total_area_sqft || !locality || !city) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get advanced AI-powered property valuation
    const advancedAnalysis = await analyzeAdvancedPropertyValuation(
      property_type,
      bhk_config,
      total_area_sqft,
      locality,
      city,
      property_age_years,
      furnishing
    );

    return NextResponse.json({
      success: true,
      results: advancedAnalysis,
      ai_enhanced: true,
      models_used: ['Ensemble AVM', 'GPT-4o', 'Regression ML', 'Comparable Sales ML'],
    });
  } catch (error: any) {
    console.error('Error in advanced property valuation:', error);
    return NextResponse.json(
      { error: 'Failed to value property', details: error.message },
      { status: 500 }
    );
  }
}




















