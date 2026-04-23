import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CHENNAI_BANKS } from '@/lib/chennai-market'
import {
  calcEMI,
  calcLoanEligibility,
  calcTotalInterest,
  calcAmortizationYearly,
} from '@/lib/ai-tools/calculations'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface LoanBody {
  monthlyIncome: number
  age: number
  existingEMIs?: number
  employmentType?: 'salaried' | 'self-employed' | 'business' | 'nri'
  creditScore?: number
  coApplicantIncome?: number
  propertyValue?: number
  desiredLoanAmount?: number
}

export async function POST(req: NextRequest) {
  try {
    const body: LoanBody = await req.json()

    const {
      monthlyIncome,
      age,
      existingEMIs = 0,
      employmentType = 'salaried',
      creditScore,
      coApplicantIncome = 0,
      propertyValue,
      desiredLoanAmount,
    } = body

    if (!monthlyIncome || monthlyIncome <= 0) {
      return NextResponse.json({ error: 'monthlyIncome is required and must be > 0' }, { status: 400 })
    }
    if (!age || age < 18 || age > 75) {
      return NextResponse.json({ error: 'age must be between 18 and 75' }, { status: 400 })
    }

    const combinedIncome = monthlyIncome + coApplicantIncome

    // Employment type multipliers (banks apply these to FOIR)
    const employmentMultiplier: Record<string, number> = {
      'salaried': 1.0,
      'self-employed': 0.85,  // banks apply higher scrutiny
      'business': 0.80,
      'nri': 1.05,            // NRI premium
    }
    const multiplier = employmentMultiplier[employmentType] ?? 1.0

    // Credit score adjustments
    let creditRateDiscount = 0
    let creditNote = ''
    if (creditScore) {
      if (creditScore >= 800) { creditRateDiscount = -0.25; creditNote = 'Excellent CIBIL — eligible for 0.25% rate discount' }
      else if (creditScore >= 750) { creditRateDiscount = 0; creditNote = 'Good CIBIL — standard rate applies' }
      else if (creditScore >= 700) { creditRateDiscount = 0.25; creditNote = 'Fair CIBIL — rate may be 0.25% higher' }
      else if (creditScore >= 650) { creditRateDiscount = 0.50; creditNote = 'Low CIBIL — rate may be 0.50% higher, co-applicant recommended' }
      else { creditRateDiscount = 1.0; creditNote = 'Poor CIBIL — loan approval unlikely. Improve score before applying.' }
    }

    // Base eligibility at standard 8.50%
    const baseEligibility = calcLoanEligibility(
      combinedIncome * multiplier,
      age,
      existingEMIs
    )

    // LTV (Loan to Value) limits per RBI:
    // <= 30L: 90% LTV, 30-75L: 80% LTV, >75L: 75% LTV
    const getLTV = (loanAmt: number): number => {
      if (loanAmt <= 3000000) return 0.90
      if (loanAmt <= 7500000) return 0.80
      return 0.75
    }

    const ltv = getLTV(baseEligibility.maxLoan)
    const maxPropertyValue = propertyValue || Math.round(baseEligibility.maxLoan / ltv)
    const minDownPayment = Math.round(maxPropertyValue * (1 - ltv))

    // Check desired loan feasibility
    let desiredFeasibility: {
      feasible: boolean
      gap: number
      recommendation: string
    } | null = null

    if (desiredLoanAmount) {
      const feasible = desiredLoanAmount <= baseEligibility.maxLoan
      const gap = feasible ? 0 : desiredLoanAmount - baseEligibility.maxLoan
      desiredFeasibility = {
        feasible,
        gap,
        recommendation: feasible
          ? `Your desired loan of ₹${(desiredLoanAmount / 100000).toFixed(0)}L is within eligibility.`
          : `Shortfall of ₹${(gap / 100000).toFixed(0)}L. Add co-applicant income of ₹${(gap / 50 / 1000).toFixed(0)}K/month to bridge gap.`,
      }
    }

    // Bank-wise recommendations with rate adjustments
    const bankRecommendations = CHENNAI_BANKS.map(bank => {
      const effectiveRate = Math.max(7.0, bank.rate + creditRateDiscount)
      const emiForMaxLoan = calcEMI(baseEligibility.maxLoan, effectiveRate, baseEligibility.maxTenure)
      const totalPayable = emiForMaxLoan * baseEligibility.maxTenure * 12
      const totalInterest = calcTotalInterest(emiForMaxLoan, baseEligibility.maxLoan, baseEligibility.maxTenure * 12)

      // Re-calculate eligibility at this bank's effective rate
      const bankEligibility = calcLoanEligibility(combinedIncome * multiplier, age, existingEMIs, baseEligibility.maxTenure)

      return {
        bank: bank.name,
        rate: effectiveRate,
        originalRate: bank.rate,
        benefit: bank.benefit,
        maxLoan: bankEligibility.maxLoan,
        emi: emiForMaxLoan,
        totalPayable: Math.round(totalPayable),
        totalInterest,
        processingFee: Math.round(Math.min(bankEligibility.maxLoan * 0.005, 15000)), // ~0.5% capped at 15K
        suitability: getSuitability(bank.name, employmentType, creditScore),
      }
    }).sort((a, b) => a.rate - b.rate)

    // Amortization at best rate
    const bestBank = bankRecommendations[0]
    const amortization = calcAmortizationYearly(
      baseEligibility.maxLoan,
      bestBank.rate,
      baseEligibility.maxTenure
    )

    // Documents required per employment type
    const documentsRequired = getDocuments(employmentType)

    // Eligibility improvement tips
    const improvementTips: string[] = []
    if (existingEMIs > 0) {
      improvementTips.push(`Closing existing EMIs of ₹${existingEMIs.toLocaleString('en-IN')}/month could increase eligibility by ₹${(existingEMIs * 100 / 0.0085 / 100000).toFixed(0)}L`)
    }
    if (coApplicantIncome === 0) {
      improvementTips.push('Adding co-applicant with ₹50K/month income can increase eligibility by ₹50-60 Lakhs')
    }
    if (creditScore && creditScore < 750) {
      improvementTips.push('Improving CIBIL score above 750 unlocks best interest rates and faster approvals')
    }
    if (employmentType === 'self-employed') {
      improvementTips.push('File ITR consistently for 2+ years to maximise self-employed eligibility')
    }
    if (baseEligibility.maxTenure < 20) {
      improvementTips.push(`Age ${age} limits tenure to ${baseEligibility.maxTenure} years — consider higher down payment to reduce loan amount`)
    }

    const result = {
      eligibility: {
        maxLoan: baseEligibility.maxLoan,
        eligibleEMI: baseEligibility.eligibleEMI,
        maxTenure: baseEligibility.maxTenure,
        ltv,
        maxPropertyValue,
        minDownPayment,
        combinedIncome,
        employmentType,
        creditScore: creditScore || null,
        creditNote,
      },
      desiredFeasibility,
      bankRecommendations,
      bestBank: {
        name: bestBank.bank,
        rate: bestBank.rate,
        emi: bestBank.emi,
        reason: `Lowest effective rate at ${bestBank.rate}% for your profile`,
      },
      amortization,
      documentsRequired,
      improvementTips,
      inputs: body,
    }

    // Persist to Supabase (gracefully skip)
    try {
      const supabase = await createClient()
      await supabase.from('tool_calculations').insert({
        tool: 'loan',
        input: body,
        result,
        created_at: new Date().toISOString(),
      })
    } catch {
      // Non-fatal
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('[API /tools/loan]', error)
    return NextResponse.json(
      { error: 'Failed to calculate loan eligibility. Please check your inputs.' },
      { status: 500 }
    )
  }
}

function getSuitability(
  bankName: string,
  employmentType: string,
  creditScore?: number
): string {
  if (employmentType === 'salaried') {
    if (bankName === 'SBI') return 'Best for salaried — Yono app, largest branch network'
    if (bankName === 'HDFC Bank') return 'Fast sanction in 3-5 days for salaried'
  }
  if (employmentType === 'self-employed') {
    if (bankName === 'HDFC Bank') return 'Most flexible for self-employed documentation'
    if (bankName === 'ICICI Bank') return 'Accepts lower ITR margins for self-employed'
  }
  if (employmentType === 'nri') {
    if (bankName === 'Axis Bank') return 'Dedicated NRI home loan desk'
    if (bankName === 'ICICI Bank') return 'NRI portal with digital KYC'
  }
  if (creditScore && creditScore >= 800 && bankName === 'Union Bank of India') {
    return 'Best rate for excellent CIBIL profile'
  }
  return 'Standard eligibility applies'
}

function getDocuments(employmentType: string): string[] {
  const common = [
    'Identity proof (Aadhaar / Passport / Voter ID)',
    'Address proof (utility bill / Aadhaar)',
    'PAN card',
    'Passport size photographs (4)',
    'Property documents (sale agreement, title deed)',
    'Bank statements (last 6 months)',
  ]

  if (employmentType === 'salaried') {
    return [
      ...common,
      'Salary slips (last 3 months)',
      'Form 16 / ITR (last 2 years)',
      'Appointment letter / employment certificate',
    ]
  }
  if (employmentType === 'self-employed') {
    return [
      ...common,
      'ITR with computation (last 3 years)',
      'Profit & Loss statement + Balance sheet (CA certified)',
      'Business existence proof (GST / Trade licence)',
      'Business bank statements (last 12 months)',
    ]
  }
  if (employmentType === 'nri') {
    return [
      ...common,
      'Passport + Visa / OCI card',
      'Work permit / Employment contract',
      'Overseas bank statements (last 6 months)',
      'NRE / NRO account statements',
      'Power of Attorney for Indian representative',
    ]
  }
  return [
    ...common,
    'ITR (last 3 years)',
    'Business registration documents',
  ]
}
