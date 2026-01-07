/**
 * Advanced ROI Calculator API
 * Uses top-tier AI models for predictive analytics and market forecasting
 */

import { NextRequest, NextResponse } from 'next/server';
import { analyzeAdvancedROI } from '@/lib/services/advanced-ai-tools-service';

export const runtime = 'nodejs';
export const maxDuration = 60; // Extended for AI processing

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      property_price,
      down_payment_percentage,
      expected_rental_income,
      city,
      locality,
      property_type,
    } = body;

    if (!property_price || !down_payment_percentage || !expected_rental_income || !city || !locality) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get advanced AI-powered ROI analysis
    const advancedAnalysis = await analyzeAdvancedROI(
      property_price,
      down_payment_percentage,
      expected_rental_income,
      city,
      locality,
      property_type || 'apartment'
    );

    return NextResponse.json({
      success: true,
      results: advancedAnalysis,
      ai_enhanced: true,
      models_used: ['GPT-4o', 'Claude Sonnet 4', 'Ensemble Forecasting'],
    });
  } catch (error: any) {
    console.error('Error in advanced ROI analysis:', error);
    return NextResponse.json(
      { error: 'Failed to analyze ROI', details: error.message },
      { status: 500 }
    );
  }
}

