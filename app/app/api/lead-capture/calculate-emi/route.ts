/**
 * EMI Calculator API
 * Calculates home loan EMI, total interest, and loan eligibility
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

interface EMIInput {
  property_price: number;
  down_payment_percentage: number;
  loan_tenure_years: number;
  interest_rate: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      property_price,
      down_payment_percentage,
      loan_tenure_years,
      interest_rate,
      use_advanced_ai = false,
      monthly_income,
      existing_loans_emi,
      cibil_score,
      employment_type,
    }: EMIInput & { 
      use_advanced_ai?: boolean;
      monthly_income?: number;
      existing_loans_emi?: number;
      cibil_score?: number;
      employment_type?: string;
    } = body;

    if (!property_price || !down_payment_percentage || !loan_tenure_years || !interest_rate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const loanAmount = property_price * (1 - down_payment_percentage / 100);
    const monthlyRate = interest_rate / 12 / 100;
    const numPayments = loan_tenure_years * 12;

    // Calculate EMI using standard formula
    const emi = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
      (Math.pow(1 + monthlyRate, numPayments) - 1);

    const totalPayment = emi * numPayments;
    const totalInterest = totalPayment - loanAmount;

    // Calculate amortization breakdown (first 12 months)
    const amortizationSchedule: Array<{
      month: number;
      principal: number;
      interest: number;
      balance: number;
    }> = [];

    let balance = loanAmount;
    for (let month = 1; month <= 12; month++) {
      const interestPayment = balance * monthlyRate;
      const principalPayment = emi - interestPayment;
      balance -= principalPayment;

      amortizationSchedule.push({
        month,
        principal: Math.round(principalPayment),
        interest: Math.round(interestPayment),
        balance: Math.round(balance),
      });
    }

    // If advanced AI is requested, use advanced service
    if (use_advanced_ai && monthly_income) {
      try {
        const advancedUrl = new URL('/api/tools/advanced-emi', request.url);
        const advancedResponse = await fetch(advancedUrl.toString(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            property_price,
            down_payment_percentage,
            loan_tenure_years,
            interest_rate,
            monthly_income,
            existing_loans_emi: existing_loans_emi || 0,
            cibil_score: cibil_score || 750,
            employment_type: employment_type || 'salaried',
          }),
        });
        
        if (advancedResponse.ok) {
          const advancedData = await advancedResponse.json();
          return NextResponse.json({
            success: true,
            results: advancedData.results,
            ai_enhanced: true,
          });
        }
      } catch (aiError) {
        console.error('Advanced AI failed, using base calculations:', aiError);
      }
    }

    return NextResponse.json({
      success: true,
      results: {
        loan_amount: Math.round(loanAmount),
        down_payment_amount: Math.round(property_price * (down_payment_percentage / 100)),
        monthly_emi: Math.round(emi),
        total_interest: Math.round(totalInterest),
        total_payment: Math.round(totalPayment),
        interest_to_principal_ratio: parseFloat((totalInterest / loanAmount).toFixed(2)),
        amortization_schedule: amortizationSchedule,
      },
    });
  } catch (error: any) {
    console.error('Error calculating EMI:', error);
    return NextResponse.json(
      { error: 'Failed to calculate EMI', details: error.message },
      { status: 500 }
    );
  }
}













