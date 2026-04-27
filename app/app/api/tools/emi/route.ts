import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CHENNAI_BANKS } from '@/lib/chennai-market'
import {
  calcEMI,
  calcTotalInterest,
  calcAmortizationYearly,
  calcTaxSavings,
  calcPrepaymentSavings,
} from '@/lib/ai-tools/calculations'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface EMIBody {
  loanAmount: number
  interestRate?: number
  loanTenure?: number          // years
  monthlyIncome?: number
  existingEMIs?: number
  propertyType?: string
}

export async function POST(req: NextRequest) {
  try {
    const body: EMIBody = await req.json()

    const {
      loanAmount,
      interestRate = 8.50,
      loanTenure = 20,
      monthlyIncome = 0,
      existingEMIs = 0,
      propertyType = 'apartment',
    } = body

    if (!loanAmount || loanAmount <= 0) {
      return NextResponse.json({ error: 'loanAmount is required and must be > 0' }, { status: 400 })
    }

    const tenureMonths = loanTenure * 12
    const monthlyEMI = calcEMI(loanAmount, interestRate, loanTenure)
    const totalPayable = monthlyEMI * tenureMonths
    const totalInterest = calcTotalInterest(monthlyEMI, loanAmount, tenureMonths)

    // EMI to income ratio
    const totalObligations = monthlyEMI + existingEMIs
    const emiToIncomeRatio = monthlyIncome > 0
      ? parseFloat(((totalObligations / monthlyIncome) * 100).toFixed(1))
      : null

    // Affordability status
    let affordabilityStatus: 'COMFORTABLE' | 'MANAGEABLE' | 'STRETCHED' | 'RISKY'
    let affordabilityReason: string
    if (emiToIncomeRatio === null) {
      affordabilityStatus = 'MANAGEABLE'
      affordabilityReason = 'Provide monthly income for a personalised affordability assessment.'
    } else if (emiToIncomeRatio <= 35) {
      affordabilityStatus = 'COMFORTABLE'
      affordabilityReason = `Total EMI obligations are ${emiToIncomeRatio}% of income — well within the 40% safe zone. You can absorb income shocks easily.`
    } else if (emiToIncomeRatio <= 45) {
      affordabilityStatus = 'MANAGEABLE'
      affordabilityReason = `Total EMI obligations are ${emiToIncomeRatio}% of income — manageable but leaves limited buffer. Avoid new credit.`
    } else if (emiToIncomeRatio <= 55) {
      affordabilityStatus = 'STRETCHED'
      affordabilityReason = `Total EMI obligations are ${emiToIncomeRatio}% of income — stretching finances. Consider increasing down payment or longer tenure.`
    } else {
      affordabilityStatus = 'RISKY'
      affordabilityReason = `Total EMI obligations are ${emiToIncomeRatio}% of income — exceeds safe 55% FOIR. Most banks will reject this application. Reduce loan amount.`
    }

    // Optimization suggestions
    const optimization: Array<{ action: string; saving: string }> = []

    // 1. Increase down payment by 5L
    const downPaymentIncrease = 500000
    if (loanAmount > downPaymentIncrease) {
      const newEMI = calcEMI(loanAmount - downPaymentIncrease, interestRate, loanTenure)
      const newTotal = newEMI * tenureMonths
      const saving = totalPayable - newTotal
      optimization.push({
        action: `Increase down payment by ₹5 Lakhs`,
        saving: `Saves ₹${(saving / 100000).toFixed(1)}L total interest, reduces EMI by ₹${(monthlyEMI - newEMI).toLocaleString('en-IN')}`,
      })
    }

    // 2. Reduce tenure by 5 years (if > 10 years)
    if (loanTenure > 10) {
      const shorterTenure = Math.max(10, loanTenure - 5)
      const higherEMI = calcEMI(loanAmount, interestRate, shorterTenure)
      const newTotalInterest = calcTotalInterest(higherEMI, loanAmount, shorterTenure * 12)
      const interestSaved = totalInterest - newTotalInterest
      optimization.push({
        action: `Reduce tenure by 5 years (to ${shorterTenure} years)`,
        saving: `Saves ₹${(interestSaved / 100000).toFixed(1)}L interest. EMI increases by ₹${(higherEMI - monthlyEMI).toLocaleString('en-IN')}`,
      })
    }

    // 3. Best rate scenario
    const bestRate = Math.min(...CHENNAI_BANKS.map(b => b.rate))
    if (interestRate > bestRate + 0.10) {
      const bestRateEMI = calcEMI(loanAmount, bestRate, loanTenure)
      const bestRateTotal = bestRateEMI * tenureMonths
      const saving = totalPayable - bestRateTotal
      optimization.push({
        action: `Switch to best available rate (${bestRate}%)`,
        saving: `Saves ₹${(saving / 100000).toFixed(1)}L over loan tenure`,
      })
    }

    // 4. Prepay 10% at year 5
    if (loanTenure > 5) {
      const prepay5yr = calcPrepaymentSavings(loanAmount, interestRate, loanTenure, loanAmount * 0.10, 5)
      if (prepay5yr.interestSaved > 50000) {
        optimization.push({
          action: `Prepay 10% of loan (₹${(loanAmount * 0.10 / 100000).toFixed(1)}L) at year 5`,
          saving: `Saves ₹${(prepay5yr.interestSaved / 100000).toFixed(1)}L interest, reduces tenure by ${prepay5yr.yearsSaved} years`,
        })
      }
    }

    // Prepayment scenarios
    const prepayment5yr = loanTenure > 5
      ? calcPrepaymentSavings(loanAmount, interestRate, loanTenure, loanAmount * 0.10, 5)
      : null
    const prepayment3yr = loanTenure > 3
      ? calcPrepaymentSavings(loanAmount, interestRate, loanTenure, loanAmount * 0.05, 3)
      : null

    // Tax benefits
    const taxBenefits = calcTaxSavings(monthlyEMI, interestRate, loanAmount)

    // Bank comparison
    const bankComparisons = CHENNAI_BANKS.map(bank => {
      const bankEMI = calcEMI(loanAmount, bank.rate, loanTenure)
      const bankTotal = bankEMI * tenureMonths
      const totalSaving = totalPayable - bankTotal // vs current rate
      return {
        bank: bank.name,
        rate: bank.rate,
        emi: bankEMI,
        totalPayable: Math.round(bankTotal),
        totalSaving: Math.round(totalSaving),
        benefit: bank.benefit,
      }
    }).sort((a, b) => a.rate - b.rate)

    const amortizationYearly = calcAmortizationYearly(loanAmount, interestRate, loanTenure)

    const result = {
      emi: {
        monthly: monthlyEMI,
        totalPayable: Math.round(totalPayable),
        totalInterest,
        emiToIncomeRatio,
        principalPercentage: parseFloat((loanAmount / totalPayable * 100).toFixed(1)),
        interestPercentage: parseFloat((totalInterest / totalPayable * 100).toFixed(1)),
      },
      affordability: {
        status: affordabilityStatus,
        reason: affordabilityReason,
        totalMonthlyObligation: Math.round(totalObligations),
      },
      optimization,
      prepayment: {
        scenario3yr: prepayment3yr,
        scenario5yr: prepayment5yr,
      },
      taxBenefits: {
        principalDeduction: taxBenefits.principalDeduction,
        interestDeduction: taxBenefits.interestDeduction,
        annualTaxSaving: taxBenefits.annualTaxSaving,
        note: 'Section 80C (principal up to ₹1.5L) + Section 24B (interest up to ₹2L) for self-occupied property',
      },
      bankComparisons,
      amortizationYearly,
      inputs: { loanAmount, interestRate, loanTenure, propertyType },
    }

    // Persist to Supabase (gracefully skip)
    try {
      const supabase = await createClient()
      await supabase.from('tool_calculations').insert({
        tool: 'emi',
        input: body,
        result,
        created_at: new Date().toISOString(),
      })
    } catch {
      // Non-fatal
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('[API /tools/emi]', error)
    return NextResponse.json(
      { error: 'Failed to calculate EMI. Please check your inputs.' },
      { status: 500 }
    )
  }
}
