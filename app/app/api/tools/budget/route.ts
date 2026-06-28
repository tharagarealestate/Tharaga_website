import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  CHENNAI_LOCALITIES,
  CHENNAI_BANKS,
  STAMP_DUTY_RATE,
  REGISTRATION_FEE_RATE,
  getLocality,
  getComparableLocalities,
} from '@/lib/chennai-market'
import {
  calcEMI,
  calcLoanEligibility,
  calcFutureValue,
} from '@/lib/ai-tools/calculations'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface BudgetBody {
  monthlyIncome: number
  currentSavings: number
  targetLocalities?: string[]
  propertyType?: 'apartment' | 'villa' | 'plot' | 'commercial'
  timeline?: number           // years to buy
  existingEMIs?: number
  age?: number
  coApplicantIncome?: number
}

export async function POST(req: NextRequest) {
  try {
    const body: BudgetBody = await req.json()

    const {
      monthlyIncome,
      currentSavings,
      targetLocalities = ['OMR', 'Velachery', 'Porur'],
      propertyType = 'apartment',
      timeline = 1,
      existingEMIs = 0,
      age = 35,
      coApplicantIncome = 0,
    } = body

    if (!monthlyIncome || monthlyIncome <= 0) {
      return NextResponse.json({ error: 'monthlyIncome is required and must be > 0' }, { status: 400 })
    }

    const combinedIncome = monthlyIncome + coApplicantIncome

    // Loan eligibility
    const eligibility = calcLoanEligibility(combinedIncome, age, existingEMIs)

    // Projected savings at timeline
    const monthlySavingsCapacity = Math.max(0, combinedIncome * 0.30 - existingEMIs)
    const projectedSavings = currentSavings + monthlySavingsCapacity * timeline * 12

    // Typical down payment: 20-25% of property value
    // Max property budget = savings / 0.22 (22% accounts for stamp duty + registration + margin)
    const maxPropertyFromSavings = Math.round(projectedSavings / 0.22)
    const maxPropertyBudget = Math.round(eligibility.maxLoan + projectedSavings / 0.22 * 0.22)
    const totalBudget = Math.min(
      eligibility.maxLoan + projectedSavings,
      eligibility.maxLoan + maxPropertyFromSavings * 0.22
    )

    // Practical budget: loan + down payment capacity
    const downPaymentCapacity = Math.round(projectedSavings * 0.80) // keep 20% liquid
    const recommendedBudget = eligibility.maxLoan + downPaymentCapacity
    const conservativeBudget = Math.round(eligibility.maxLoan * 0.85 + downPaymentCapacity * 0.70)
    const aggressiveBudget = Math.round(eligibility.maxLoan * 1.0 + projectedSavings * 0.90)

    // Stamp duty and registration on recommended budget
    const acquisitionCosts = {
      stampDuty: Math.round(recommendedBudget * STAMP_DUTY_RATE),
      registration: Math.round(recommendedBudget * REGISTRATION_FEE_RATE),
      total: Math.round(recommendedBudget * (STAMP_DUTY_RATE + REGISTRATION_FEE_RATE)),
    }

    // Analyse each target locality
    const localityOptions = (targetLocalities.length > 0 ? targetLocalities : ['OMR', 'Velachery', 'Porur'])
      .slice(0, 5)
      .map(localityName => {
        const data = getLocality(localityName)
        const avgPricePerSqft = data.pricePerSqft.avg

        // What size flat can you get at each budget tier?
        const sqftAtConservative = Math.round(conservativeBudget / avgPricePerSqft)
        const sqftAtRecommended  = Math.round(recommendedBudget / avgPricePerSqft)
        const sqftAtAggressive   = Math.round(aggressiveBudget / avgPricePerSqft)

        // BHK mapping (approx carpet area):
        // 1BHK: 450-550 sqft, 2BHK: 700-900 sqft, 3BHK: 1000-1300 sqft
        const getBHK = (sqft: number) => {
          if (sqft < 550) return '1 BHK'
          if (sqft < 950) return '2 BHK'
          if (sqft < 1400) return '3 BHK'
          return '4 BHK / Villa'
        }

        const emi = calcEMI(
          recommendedBudget - downPaymentCapacity,
          CHENNAI_BANKS[3].rate, // SBI rate
          eligibility.maxTenure
        )

        const futureValue5yr = calcFutureValue(recommendedBudget, data.appreciation, 5)

        return {
          locality: localityName,
          marketStatus: data.marketStatus,
          pricePerSqft: data.pricePerSqft,
          demandLevel: data.demandLevel,
          appreciation: data.appreciation,
          rentalYield: data.rentalYield,
          metroDistance: data.metroDistance,
          options: {
            conservative: { budget: conservativeBudget, sqft: sqftAtConservative, bhk: getBHK(sqftAtConservative) },
            recommended:  { budget: recommendedBudget,  sqft: sqftAtRecommended,  bhk: getBHK(sqftAtRecommended) },
            aggressive:   { budget: aggressiveBudget,   sqft: sqftAtAggressive,   bhk: getBHK(sqftAtAggressive) },
          },
          estimatedEMI: emi,
          futureValue5yr,
          subAreas: data.subAreas,
          greenFlags: data.greenFlags,
          redFlags: data.redFlags,
        }
      })

    // Best value locality recommendation
    const bestValueLocality = localityOptions.reduce((best, current) => {
      const score = current.appreciation * 0.4 + current.rentalYield * 0.4 +
        (current.marketStatus === 'Hot' ? 2 : current.marketStatus === 'Emerging' ? 1.5 : 1)
      const bestScore = best.appreciation * 0.4 + best.rentalYield * 0.4 +
        (best.marketStatus === 'Hot' ? 2 : best.marketStatus === 'Emerging' ? 1.5 : 1)
      return score > bestScore ? current : best
    }, localityOptions[0])

    // Comparable localities not in the list
    const comparables = getComparableLocalities(targetLocalities[0] || 'OMR', recommendedBudget)
      .filter(c => !targetLocalities.includes(c))
      .slice(0, 2)

    // Savings plan
    const monthlyShortfall = Math.max(0, downPaymentCapacity - currentSavings)
    const monthsToTarget = monthlyShortfall > 0 && monthlySavingsCapacity > 0
      ? Math.ceil(monthlyShortfall / monthlySavingsCapacity)
      : 0

    // Budget breakdown for recommended
    const budgetBreakdown = {
      propertyPrice: recommendedBudget,
      downPayment: downPaymentCapacity,
      loanAmount: recommendedBudget - downPaymentCapacity,
      stampDuty: acquisitionCosts.stampDuty,
      registrationFee: acquisitionCosts.registration,
      movingAndInterior: Math.round(recommendedBudget * 0.02), // 2% estimate
      emergencyReserve: Math.round(combinedIncome * 6),        // 6 months income
      totalCashRequired: Math.round(
        downPaymentCapacity + acquisitionCosts.total + recommendedBudget * 0.02 + combinedIncome * 6
      ),
    }

    // Recommendations
    const recommendations: string[] = []
    if (coApplicantIncome === 0 && age < 55) {
      recommendations.push('Adding a co-applicant spouse can increase loan eligibility by 40-60%')
    }
    if (eligibility.maxTenure < 20 && age > 45) {
      recommendations.push(`At age ${age}, max tenure is ${eligibility.maxTenure} years — focus on ready-to-move properties`)
    }
    if (currentSavings < budgetBreakdown.totalCashRequired * 0.5) {
      recommendations.push(`Build savings to ₹${(budgetBreakdown.totalCashRequired / 100000).toFixed(0)}L before committing. Currently short by ₹${((budgetBreakdown.totalCashRequired - currentSavings) / 100000).toFixed(0)}L`)
    }
    if (bestValueLocality) {
      recommendations.push(`${bestValueLocality.locality} offers the best appreciation (${bestValueLocality.appreciation}%) + yield (${bestValueLocality.rentalYield}%) combination in your list`)
    }
    if (comparables.length > 0) {
      recommendations.push(`Also consider ${comparables.join(', ')} — similar price range with different growth profiles`)
    }

    const result = {
      eligibility: {
        maxLoan: eligibility.maxLoan,
        eligibleEMI: eligibility.eligibleEMI,
        maxTenure: eligibility.maxTenure,
        combinedIncome,
      },
      budgetScenarios: {
        conservative: conservativeBudget,
        recommended: recommendedBudget,
        aggressive: aggressiveBudget,
      },
      budgetBreakdown,
      savings: {
        current: currentSavings,
        projectedAtTimeline: Math.round(projectedSavings),
        monthlySavingsCapacity: Math.round(monthlySavingsCapacity),
        monthsToDownPayment: monthsToTarget,
        timelineYears: timeline,
      },
      localityOptions,
      bestValueLocality: bestValueLocality?.locality || null,
      comparableLocalities: comparables,
      acquisitionCosts,
      recommendations,
      inputs: body,
    }

    // Persist to Supabase (gracefully skip)
    try {
      const supabase = await createClient()
      await supabase.from('tool_calculations').insert({
        tool: 'budget',
        input: body,
        result,
        created_at: new Date().toISOString(),
      })
    } catch {
      // Non-fatal
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('[API /tools/budget]', error)
    return NextResponse.json(
      { error: 'Failed to calculate budget analysis. Please check your inputs.' },
      { status: 500 }
    )
  }
}
