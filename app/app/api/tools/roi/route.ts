import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getLocality } from '@/lib/chennai-market'
import {
  calcEMI,
  calcTotalInterest,
  calcNetRentalYield,
  calcFutureValue,
  calcInvestmentVerdict,
  calcAmortizationYearly,
  calcTaxSavings,
  calcPrepaymentSavings,
} from '@/lib/ai-tools/calculations'
import {
  STAMP_DUTY_RATE,
  REGISTRATION_FEE_RATE,
  GST_UNDER_CONSTRUCTION,
} from '@/lib/chennai-market'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface ROIBody {
  propertyPrice: number
  downPayment: number
  loanAmount?: number
  interestRate?: number
  loanTenure?: number
  expectedRent: number
  maintenanceCost?: number
  propertyTax?: number
  appreciationRate?: number
  locality?: string
  monthlyIncome?: number
  propertyType?: string
  propertyAge?: number
  underConstruction?: boolean
}

export async function POST(req: NextRequest) {
  try {
    const body: ROIBody = await req.json()

    const {
      propertyPrice,
      downPayment,
      interestRate = 8.50,
      loanTenure = 20,
      expectedRent,
      maintenanceCost = propertyPrice * 0.005 / 12, // 0.5% pa as monthly
      propertyTax = propertyPrice * 0.003 / 12,    // 0.3% pa as monthly
      appreciationRate,
      locality = 'OMR',
      monthlyIncome = 0,
      propertyAge = 0,
      underConstruction = false,
    } = body

    if (!propertyPrice || propertyPrice <= 0) {
      return NextResponse.json({ error: 'propertyPrice is required and must be > 0' }, { status: 400 })
    }
    if (!expectedRent || expectedRent <= 0) {
      return NextResponse.json({ error: 'expectedRent is required and must be > 0' }, { status: 400 })
    }

    const loanAmount = body.loanAmount ?? (propertyPrice - downPayment)
    const localityData = getLocality(locality)
    const effectiveAppreciation = appreciationRate ?? localityData.appreciation

    // Stamp duty + registration costs (only on ready-to-move; GST for UC)
    const stampDuty = Math.round(propertyPrice * STAMP_DUTY_RATE)
    const registrationFee = Math.round(propertyPrice * REGISTRATION_FEE_RATE)
    const gst = underConstruction ? Math.round(propertyPrice * GST_UNDER_CONSTRUCTION) : 0
    const totalAcquisitionCost = propertyPrice + stampDuty + registrationFee + gst

    // Monthly financials
    const monthlyEMI = loanAmount > 0 ? calcEMI(loanAmount, interestRate, loanTenure) : 0
    const totalInterestPaid = loanAmount > 0 ? calcTotalInterest(monthlyEMI, loanAmount, loanTenure * 12) : 0

    const annualRent = expectedRent * 12
    const annualCosts = (maintenanceCost + propertyTax) * 12
    const netRentalYield = calcNetRentalYield(annualRent, annualCosts, propertyPrice)

    const monthlyNetCashflow = expectedRent - monthlyEMI - maintenanceCost - propertyTax

    // Projections
    const projectedValue5yr  = calcFutureValue(propertyPrice, effectiveAppreciation, 5)
    const projectedValue10yr = calcFutureValue(propertyPrice, effectiveAppreciation, 10)
    const projectedValue15yr = calcFutureValue(propertyPrice, effectiveAppreciation, 15)

    const totalReturn10yr = parseFloat(
      (((projectedValue10yr - totalAcquisitionCost + annualRent * 10 - annualCosts * 10) / totalAcquisitionCost) * 100).toFixed(1)
    )

    // Break-even: when total rent collected covers total investment (downPayment + costs)
    const totalEquityInvested = downPayment + stampDuty + registrationFee + gst
    const breakEvenYears = annualRent > annualCosts
      ? parseFloat((totalEquityInvested / (annualRent - annualCosts)).toFixed(1))
      : 99

    // EMI to income ratio
    const emiToIncomeRatio = monthlyIncome > 0
      ? parseFloat(((monthlyEMI / monthlyIncome) * 100).toFixed(1))
      : 40 // assume moderate if not provided

    const amortizationYearly = loanAmount > 0
      ? calcAmortizationYearly(loanAmount, interestRate, loanTenure)
      : []

    const taxSavings = loanAmount > 0
      ? calcTaxSavings(monthlyEMI, interestRate, loanAmount)
      : { principalDeduction: 0, interestDeduction: 0, annualTaxSaving: 0 }

    const prepayment5yr = loanAmount > 0
      ? calcPrepaymentSavings(loanAmount, interestRate, loanTenure, loanAmount * 0.10, 5)
      : null

    // Investment verdict
    const verdictResult = calcInvestmentVerdict({
      rentalYield: netRentalYield,
      appreciation: effectiveAppreciation,
      emiToIncomeRatio,
      locality,
      propertyAge,
    })

    // Risk assessment
    const riskFactors: string[] = []
    if (emiToIncomeRatio > 50) riskFactors.push(`EMI is ${emiToIncomeRatio}% of income — above safe 50% threshold`)
    if (netRentalYield < 2.5) riskFactors.push('Rental yield below 2.5% — poor income generation')
    if (localityData.vacancy > 10) riskFactors.push(`High vacancy rate of ${localityData.vacancy}% in this locality`)
    if (underConstruction) riskFactors.push('Under-construction property — delivery delay and builder risk')
    if (propertyAge > 20) riskFactors.push('Older property may need significant renovation in 5-7 years')
    if (monthlyNetCashflow < -20000) riskFactors.push('Significant negative cashflow requires strong savings buffer')
    riskFactors.push(...localityData.redFlags.slice(0, 2))

    const riskLevel = riskFactors.length >= 4 ? 'HIGH' : riskFactors.length >= 2 ? 'MEDIUM' : 'LOW'

    // Recommendations
    const recommendations: string[] = []
    if (downPayment < propertyPrice * 0.25) {
      recommendations.push('Consider increasing down payment to 25% to reduce EMI burden and interest outgo')
    }
    if (netRentalYield < 3) {
      recommendations.push('Negotiate rent up by 10-15% or look at higher-yield sub-areas within this locality')
    }
    if (loanTenure > 20) {
      recommendations.push('Consider 20-year tenure — saves significant interest vs 25-30 year while EMI increase is marginal')
    }
    if (effectiveAppreciation >= 9) {
      recommendations.push(`${locality} has strong ${effectiveAppreciation}% annual appreciation — hold for 10+ years for maximum returns`)
    }
    if (taxSavings.annualTaxSaving > 0) {
      recommendations.push(`Claim ₹${(taxSavings.annualTaxSaving / 1000).toFixed(0)}K annual tax saving under 80C + 24B`)
    }
    if (prepayment5yr && prepayment5yr.interestSaved > 100000) {
      recommendations.push(`Prepaying 10% of loan at year 5 saves ₹${(prepayment5yr.interestSaved / 100000).toFixed(1)}L interest`)
    }
    recommendations.push(...localityData.greenFlags.slice(0, 2))

    // Smart follow-up questions
    const smartQuestions = [
      `What is the current under-construction vs ready-to-move availability in ${locality}?`,
      `How does ${locality} compare to ${getLocality(locality) === localityData ? 'Sholinganallur' : 'OMR'} for the same budget?`,
      'What are the RERA-registered projects in this price range?',
      `If I increase down payment by ₹${(loanAmount * 0.05 / 100000).toFixed(0)} Lakhs, how much EMI drops?`,
      'What is the historical rental vacancy rate for 2BHK in this area?',
    ]

    const analysis = {
      verdict: {
        action: verdictResult.verdict,
        confidence: verdictResult.confidence,
        summary: verdictResult.reason,
      },
      financial: {
        monthlyEMI,
        netRentalYield,
        breakEvenYears,
        projectedValue5yr,
        projectedValue10yr,
        projectedValue15yr,
        totalReturn10yr,
        totalInterestPaid,
        monthlyNetCashflow: Math.round(monthlyNetCashflow),
        totalAcquisitionCost,
        stampDuty,
        registrationFee,
        gst,
        emiToIncomeRatio,
        amortizationYearly,
        taxSavings,
        prepayment: prepayment5yr,
      },
      risk: {
        level: riskLevel,
        factors: riskFactors,
      },
      locality: {
        name: locality,
        marketStatus: localityData.marketStatus,
        pricePerSqft: localityData.pricePerSqft,
        rentalYield: localityData.rentalYield,
        appreciation: localityData.appreciation,
        infrastructure: localityData.infrastructure,
        metroDistance: localityData.metroDistance,
        itHubDistance: localityData.itHubDistance,
        schools: localityData.schools,
        demandLevel: localityData.demandLevel,
        vacancy: localityData.vacancy,
        greenFlags: localityData.greenFlags,
        redFlags: localityData.redFlags,
        subAreas: localityData.subAreas,
      },
      recommendations,
      smartQuestions,
    }

    // Persist to Supabase (gracefully skip if table missing)
    try {
      const supabase = await createClient()
      await supabase.from('tool_calculations').insert({
        tool: 'roi',
        input: body,
        result: analysis,
        created_at: new Date().toISOString(),
      })
    } catch {
      // Non-fatal — table may not exist yet
    }

    return NextResponse.json(analysis)
  } catch (error) {
    console.error('[API /tools/roi]', error)
    return NextResponse.json(
      { error: 'Failed to calculate ROI analysis. Please check your inputs.' },
      { status: 500 }
    )
  }
}
