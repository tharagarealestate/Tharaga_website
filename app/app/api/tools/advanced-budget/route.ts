/**
 * Advanced Budget Planner API
 * Uses AI financial advisor capabilities
 */

import { NextRequest, NextResponse } from 'next/server';
import { analyzeAdvancedBudget } from '@/lib/services/advanced-ai-tools-service';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      primary_income_monthly,
      secondary_income_monthly = 0,
      monthly_expenses,
      existing_loans_emi = 0,
      savings_available,
      city,
      family_type,
    } = body;

    if (!primary_income_monthly || !monthly_expenses || !savings_available || !city || !family_type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get advanced AI-powered budget analysis
    const advancedAnalysis = await analyzeAdvancedBudget(
      primary_income_monthly,
      secondary_income_monthly,
      monthly_expenses,
      existing_loans_emi,
      savings_available,
      city,
      family_type
    );

    return NextResponse.json({
      success: true,
      results: advancedAnalysis,
      ai_enhanced: true,
      models_used: ['Claude Sonnet 4', 'GPT-4o', 'Financial Advisor AI'],
    });
  } catch (error: any) {
    console.error('Error in advanced budget analysis:', error);
    return NextResponse.json(
      { error: 'Failed to analyze budget', details: error.message },
      { status: 500 }
    );
  }
}

