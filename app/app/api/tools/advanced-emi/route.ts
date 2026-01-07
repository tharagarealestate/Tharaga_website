/**
 * Advanced EMI Calculator API
 * Uses ML-based risk assessment and optimization strategies
 */

import { NextRequest, NextResponse } from 'next/server';
import { analyzeAdvancedEMI } from '@/lib/services/advanced-ai-tools-service';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      property_price,
      down_payment_percentage,
      loan_tenure_years,
      interest_rate,
      monthly_income,
      existing_loans_emi = 0,
      cibil_score = 750,
      employment_type = 'salaried',
    } = body;

    if (!property_price || !down_payment_percentage || !loan_tenure_years || !interest_rate || !monthly_income) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get advanced AI-powered EMI analysis
    const advancedAnalysis = await analyzeAdvancedEMI(
      property_price,
      down_payment_percentage,
      loan_tenure_years,
      interest_rate,
      monthly_income,
      existing_loans_emi,
      cibil_score,
      employment_type
    );

    return NextResponse.json({
      success: true,
      results: advancedAnalysis,
      ai_enhanced: true,
      models_used: ['GPT-4o-mini', 'Risk Assessment ML', 'Optimization Engine'],
    });
  } catch (error: any) {
    console.error('Error in advanced EMI analysis:', error);
    return NextResponse.json(
      { error: 'Failed to analyze EMI', details: error.message },
      { status: 500 }
    );
  }
}

