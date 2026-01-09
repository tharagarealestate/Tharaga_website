/**
 * Advanced Loan Eligibility API
 * Uses credit risk modeling and approval prediction
 */

import { NextRequest, NextResponse } from 'next/server';
import { analyzeAdvancedLoanEligibility } from '@/lib/services/advanced-ai-tools-service';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      monthly_income,
      existing_loans_emi = 0,
      property_price,
      preferred_tenure_years,
      cibil_score,
      employment_type,
      city,
    } = body;

    if (!monthly_income || !property_price || !preferred_tenure_years || !cibil_score || !employment_type || !city) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get advanced AI-powered loan eligibility analysis
    const advancedAnalysis = await analyzeAdvancedLoanEligibility(
      monthly_income,
      existing_loans_emi,
      property_price,
      preferred_tenure_years,
      cibil_score,
      employment_type,
      city
    );

    return NextResponse.json({
      success: true,
      results: advancedAnalysis,
      ai_enhanced: true,
      models_used: ['GPT-4o-mini', 'Claude Sonnet 4', 'Credit Risk ML'],
    });
  } catch (error: any) {
    console.error('Error in advanced loan eligibility analysis:', error);
    return NextResponse.json(
      { error: 'Failed to analyze loan eligibility', details: error.message },
      { status: 500 }
    );
  }
}









