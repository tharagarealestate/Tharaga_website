/**
 * Budget Planner API
 * Calculates home affordability based on income, expenses, and savings
 * Tamil Nadu market-specific calculations
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

interface BudgetInput {
  primary_income_monthly: number;
  secondary_income_monthly?: number;
  other_income_monthly?: number;
  family_type: 'single' | 'couple' | 'joint_family';
  monthly_expenses: number;
  existing_loans_emi?: number;
  savings_available: number;
  city: string; // Chennai, Coimbatore, Madurai, etc.
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      primary_income_monthly,
      secondary_income_monthly = 0,
      other_income_monthly = 0,
      family_type,
      monthly_expenses,
      existing_loans_emi = 0,
      savings_available,
      city = 'Chennai',
    }: BudgetInput = body;

    if (!primary_income_monthly || !monthly_expenses || !savings_available) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Calculate total income
    const totalIncome = primary_income_monthly + secondary_income_monthly + other_income_monthly;
    const disposableIncome = totalIncome - monthly_expenses - existing_loans_emi;

    // FOIR (Fixed Obligation to Income Ratio) - Tamil Nadu banks typically use 50%
    const foirLimit = 0.50;
    const maxEMI = Math.min(disposableIncome * foirLimit, totalIncome * foirLimit);

    // Calculate max loan amount (20 years @ 8.5% interest)
    const interestRate = 8.5;
    const tenureYears = 20;
    const monthlyRate = interestRate / 12 / 100;
    const tenureMonths = tenureYears * 12;
    const maxLoanAmount = maxEMI > 0 ?
      (maxEMI * ((Math.pow(1 + monthlyRate, tenureMonths) - 1) /
        (monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)))) : 0;

    // Add savings for down payment
    const totalBudget = maxLoanAmount + savings_available;

    // City-specific price ranges (per sq.ft)
    const cityPricePerSqft: Record<string, number> = {
      'Chennai': 7500,
      'Coimbatore': 5000,
      'Madurai': 3800,
      'Trichy': 3500,
      'Salem': 3200,
      'Tirunelveli': 3000,
    };

    const avgPrice = cityPricePerSqft[city] || 5000;
    const affordableAreaSqft = Math.floor(totalBudget / avgPrice);

    // Recommend BHK type based on area
    let recommendedBHK = '1BHK';
    if (affordableAreaSqft >= 1800) recommendedBHK = '3BHK';
    else if (affordableAreaSqft >= 1200) recommendedBHK = '2BHK';
    else if (affordableAreaSqft >= 900) recommendedBHK = '1.5BHK';

    // Calculate affordability health metrics
    const foirPercentage = (maxEMI / totalIncome) * 100;
    const downPaymentPercentage = (savings_available / totalBudget) * 100;
    const isHealthyFOIR = foirPercentage <= 40;
    const hasGoodDownPayment = downPaymentPercentage >= 20;

    return NextResponse.json({
      success: true,
      results: {
        total_monthly_income: totalIncome,
        disposable_income: disposableIncome,
        max_emi: Math.round(maxEMI),
        max_loan_amount: Math.round(maxLoanAmount),
        down_payment_available: savings_available,
        total_budget: Math.round(totalBudget),
        affordable_area_sqft: affordableAreaSqft,
        recommended_bhk: recommendedBHK,
        foir_percentage: parseFloat(foirPercentage.toFixed(1)),
        down_payment_percentage: parseFloat(downPaymentPercentage.toFixed(1)),
        is_healthy_foir: isHealthyFOIR,
        has_good_down_payment: hasGoodDownPayment,
        city: city,
        avg_price_per_sqft: avgPrice,
        affordability_score: calculateAffordabilityScore(foirPercentage, downPaymentPercentage, totalIncome),
      },
    });
  } catch (error: any) {
    console.error('Error calculating budget:', error);
    return NextResponse.json(
      { error: 'Failed to calculate budget', details: error.message },
      { status: 500 }
    );
  }
}

function calculateAffordabilityScore(foir: number, downPayment: number, income: number): number {
  let score = 50;

  // FOIR impact (lower is better)
  if (foir <= 30) score += 25;
  else if (foir <= 40) score += 15;
  else if (foir <= 50) score += 5;
  else score -= 10;

  // Down payment impact (higher is better)
  if (downPayment >= 30) score += 15;
  else if (downPayment >= 20) score += 10;
  else if (downPayment >= 10) score += 5;
  else score -= 5;

  // Income level impact
  if (income >= 150000) score += 10;
  else if (income >= 100000) score += 5;
  else if (income < 50000) score -= 10;

  return Math.min(Math.max(score, 0), 100);
}



