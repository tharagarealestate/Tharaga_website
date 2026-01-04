/**
 * ROI Calculator API
 * Calculates comprehensive ROI for property investment
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export const runtime = 'nodejs';
export const maxDuration = 30;

interface ROIInput {
  property_price: number;
  down_payment_percentage: number;
  loan_amount?: number;
  interest_rate?: number;
  loan_tenure_years?: number;
  expected_rental_income: number;
  property_appreciation_rate?: number; // Annual percentage
  calculate_years?: number[]; // Array of years to calculate (e.g., [5, 10, 15])
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      property_price,
      down_payment_percentage,
      loan_amount,
      interest_rate = 8.5,
      loan_tenure_years = 20,
      expected_rental_income,
      property_appreciation_rate = 8, // Default 8% for Tamil Nadu
      calculate_years = [5, 10, 15],
    }: ROIInput = body;

    if (!property_price || !down_payment_percentage || !expected_rental_income) {
      return NextResponse.json(
        { error: 'Missing required fields: property_price, down_payment_percentage, expected_rental_income' },
        { status: 400 }
      );
    }

    const calculatedLoanAmount = loan_amount || property_price * (1 - down_payment_percentage / 100);
    const downPaymentAmount = property_price * (down_payment_percentage / 100);
    const monthlyRate = interest_rate / 12 / 100;
    const tenureMonths = loan_tenure_years * 12;

    // Calculate EMI
    const monthlyEMI = (calculatedLoanAmount * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
      (Math.pow(1 + monthlyRate, tenureMonths) - 1);

    // Calculate rental yield
    const annualRentalIncome = expected_rental_income * 12;
    const rentalYield = (annualRentalIncome / property_price) * 100;

    // Calculate ROI for different time periods
    const results: Record<string, any> = {
      property_price,
      down_payment_amount: downPaymentAmount,
      down_payment_percentage,
      loan_amount: calculatedLoanAmount,
      interest_rate,
      loan_tenure_years,
      monthly_emi: Math.round(monthlyEMI),
      expected_rental_income,
      annual_rental_income: annualRentalIncome,
      rental_yield_percentage: parseFloat(rentalYield.toFixed(2)),
      property_appreciation_rate,
    };

    // Calculate for each year period
    for (const years of calculate_years) {
      const propertyValueAfterYears = property_price * Math.pow(1 + property_appreciation_rate / 100, years);
      const capitalGain = propertyValueAfterYears - property_price;
      const totalRentalIncome = annualRentalIncome * years;

      // Calculate total interest paid
      const totalEMIPaid = monthlyEMI * (years * 12);
      const principalPaid = calculatedLoanAmount * (years / loan_tenure_years);
      const interestPaid = totalEMIPaid - principalPaid;

      // Tax benefits (Section 80C + 24B)
      // 80C: Principal repayment (max ₹1.5L/year)
      // 24B: Interest deduction (max ₹2L/year for self-occupied, unlimited for let-out)
      const annualPrincipalRepayment = calculatedLoanAmount / loan_tenure_years;
      const annualInterest = calculatedLoanAmount * (interest_rate / 100);
      
      const taxBenefit80C = Math.min(annualPrincipalRepayment, 150000) * years;
      const taxBenefit24B = Math.min(annualInterest, 200000) * years;
      const totalTaxBenefits = taxBenefit80C + taxBenefit24B;

      // Net profit calculation
      const netProfit = capitalGain + totalRentalIncome + totalTaxBenefits - interestPaid - downPaymentAmount;
      const totalROIPercentage = (netProfit / downPaymentAmount) * 100;

      results[`years_${years}`] = {
        property_value: Math.round(propertyValueAfterYears),
        capital_gain: Math.round(capitalGain),
        total_rental_income: Math.round(totalRentalIncome),
        interest_paid: Math.round(interestPaid),
        tax_benefits: Math.round(totalTaxBenefits),
        net_profit: Math.round(netProfit),
        total_roi_percentage: parseFloat(totalROIPercentage.toFixed(2)),
        annualized_roi_percentage: parseFloat((totalROIPercentage / years).toFixed(2)),
      };
    }

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error: any) {
    console.error('Error calculating ROI:', error);
    return NextResponse.json(
      { error: 'Failed to calculate ROI', details: error.message },
      { status: 500 }
    );
  }
}




