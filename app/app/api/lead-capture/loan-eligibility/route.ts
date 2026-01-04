/**
 * Home Loan Eligibility Calculator API
 * Calculates loan eligibility based on income, existing loans, and CIBIL score
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

interface LoanEligibilityInput {
  employment_type: 'salaried' | 'self_employed' | 'business_owner';
  monthly_income: number;
  existing_loans_emi: number;
  property_price: number;
  preferred_tenure_years: number;
  cibil_score_range: string; // '300-549', '550-649', '650-749', '750+'
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      employment_type,
      monthly_income,
      existing_loans_emi,
      property_price,
      preferred_tenure_years,
      cibil_score_range,
    }: LoanEligibilityInput = body;

    if (!monthly_income || !property_price || !cibil_score_range) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Tamil Nadu bank-specific FOIR limits based on CIBIL score
    const foirLimit = cibil_score_range === '750+' ? 0.60 :
                      cibil_score_range === '650-749' ? 0.50 :
                      cibil_score_range === '550-649' ? 0.40 : 0.30;

    // Calculate eligible EMI
    const eligibleEMI = (monthly_income * foirLimit) - (existing_loans_emi || 0);

    // Interest rates based on CIBIL score in Tamil Nadu
    const interestRate = cibil_score_range === '750+' ? 8.4 :
                         cibil_score_range === '650-749' ? 8.8 :
                         cibil_score_range === '550-649' ? 9.5 : 10.5;

    // Calculate max loan amount based on EMI
    const monthlyRate = interestRate / 12 / 100;
    const tenureMonths = preferred_tenure_years * 12;
    const maxLoanAmountByEMI = eligibleEMI > 0 ? 
      (eligibleEMI * ((Math.pow(1 + monthlyRate, tenureMonths) - 1) / 
      (monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)))) : 0;

    // LTV (Loan to Value) limits - TN banks typically allow 80-90%
    const ltvLimit = property_price <= 3000000 ? 0.90 : 
                     property_price <= 7500000 ? 0.80 : 0.75;

    const maxLoanByLTV = property_price * ltvLimit;

    // Final eligible loan is minimum of both calculations
    const finalEligibleLoan = Math.min(maxLoanAmountByEMI, maxLoanByLTV);
    const requiredDownPayment = property_price - finalEligibleLoan;

    // Recommended banks based on profile (Tamil Nadu specific)
    const recommendedBanks = employment_type === 'salaried' 
      ? ['SBI', 'HDFC', 'ICICI', 'Indian Bank', 'Axis Bank']
      : employment_type === 'self_employed'
      ? ['HDFC', 'Kotak Mahindra', 'Indian Bank', 'Canara Bank']
      : ['Indian Bank', 'Canara Bank', 'SBI', 'HDFC'];

    // Calculate approval probability
    let probability = 50;
    if (cibil_score_range === '750+') probability += 30;
    else if (cibil_score_range === '650-749') probability += 15;
    else if (cibil_score_range === '550-649') probability -= 10;
    else probability -= 30;

    if (existing_loans_emi === 0) probability += 10;
    else if (existing_loans_emi < monthly_income * 0.2) probability += 5;

    if (monthly_income >= 100000) probability += 10;
    else if (monthly_income >= 50000) probability += 5;

    probability = Math.min(Math.max(probability, 0), 95);

    return NextResponse.json({
      success: true,
      results: {
        eligible_loan_amount: Math.round(finalEligibleLoan),
        eligible_emi: Math.round(eligibleEMI),
        required_down_payment: Math.round(requiredDownPayment),
        interest_rate: interestRate,
        ltv_percentage: parseFloat((finalEligibleLoan / property_price * 100).toFixed(1)),
        total_interest: Math.round((eligibleEMI * tenureMonths) - finalEligibleLoan),
        recommended_banks: recommendedBanks,
        approval_probability: probability,
        foir_percentage: parseFloat((foirLimit * 100).toFixed(1)),
      },
    });
  } catch (error: any) {
    console.error('Error calculating loan eligibility:', error);
    return NextResponse.json(
      { error: 'Failed to calculate loan eligibility', details: error.message },
      { status: 500 }
    );
  }
}



