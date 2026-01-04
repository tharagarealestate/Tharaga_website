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
    }: EMIInput = body;

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



