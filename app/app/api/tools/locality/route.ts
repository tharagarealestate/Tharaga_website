import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  CHENNAI_LOCALITIES,
  getLocality,
  getComparableLocalities,
} from '@/lib/chennai-market'
import {
  calcEMI,
  calcFutureValue,
  calcNetRentalYield,
} from '@/lib/ai-tools/calculations'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface LocalityBody {
  locality: string
  propertyType?: 'apartment' | 'villa' | 'plot' | 'commercial'
  budget?: number
  priority?: 'investment' | 'self-use' | 'rental' | 'resale'
}

export async function POST(req: NextRequest) {
  try {
    const body: LocalityBody = await req.json()

    const {
      locality,
      propertyType = 'apartment',
      budget = 8000000, // 80L default
      priority = 'investment',
    } = body

    if (!locality) {
      return NextResponse.json({ error: 'locality is required' }, { status: 400 })
    }

    const data = getLocality(locality)
    const comparables = getComparableLocalities(locality, budget)

    // What can you buy at this budget?
    const sqftAtBudget = Math.round(budget / data.pricePerSqft.avg)
    const getBHKFromSqft = (sqft: number): string => {
      if (sqft < 450)  return 'Studio / 1 RK'
      if (sqft < 550)  return '1 BHK'
      if (sqft < 950)  return '2 BHK'
      if (sqft < 1400) return '3 BHK'
      return '4 BHK / Villa'
    }
    const configurableAt = getBHKFromSqft(sqftAtBudget)

    // Price sensitivity analysis
    const budgetVariants = [
      { label: 'Budget -20%', budget: Math.round(budget * 0.80), sqft: Math.round(budget * 0.80 / data.pricePerSqft.avg) },
      { label: 'Budget (yours)', budget, sqft: sqftAtBudget },
      { label: 'Budget +20%', budget: Math.round(budget * 1.20), sqft: Math.round(budget * 1.20 / data.pricePerSqft.avg) },
    ].map(v => ({ ...v, bhk: getBHKFromSqft(v.sqft) }))

    // Future value projections
    const futureValues = [3, 5, 7, 10].map(years => ({
      years,
      value: calcFutureValue(budget, data.appreciation, years),
      gain: calcFutureValue(budget, data.appreciation, years) - budget,
      gainPct: parseFloat(((calcFutureValue(budget, data.appreciation, years) - budget) / budget * 100).toFixed(1)),
    }))

    // Rental analysis
    const estimatedMonthlyRent = Math.round(budget * data.rentalYield / 100 / 12)
    const maintenancePa = Math.round(budget * 0.005)   // 0.5% pa
    const propertyTaxPa = Math.round(budget * 0.003)   // 0.3% pa
    const netRentalYield = calcNetRentalYield(
      estimatedMonthlyRent * 12,
      maintenancePa + propertyTaxPa,
      budget
    )
    const vacancyAdjustedRent = Math.round(estimatedMonthlyRent * (1 - data.vacancy / 100))

    // Comparable localities analysis
    const comparableAnalysis = comparables.map(compLocality => {
      const compData = CHENNAI_LOCALITIES[compLocality]
      if (!compData) return null
      const compSqft = Math.round(budget / compData.pricePerSqft.avg)
      const compRent = Math.round(budget * compData.rentalYield / 100 / 12)
      return {
        locality: compLocality,
        pricePerSqft: compData.pricePerSqft.avg,
        sqftAtBudget: compSqft,
        bhkAtBudget: getBHKFromSqft(compSqft),
        rentalYield: compData.rentalYield,
        estimatedRent: compRent,
        appreciation: compData.appreciation,
        marketStatus: compData.marketStatus,
        metroDistance: compData.metroDistance,
        demandLevel: compData.demandLevel,
      }
    }).filter(Boolean)

    // Priority-specific insights
    const priorityInsights = getPriorityInsights(priority, data, locality, budget, estimatedMonthlyRent)

    // Livability score (0-100)
    const livabilityScore = calcLivabilityScore(data, priority)

    // Investment score (0-100)
    const investmentScore = calcInvestmentScore(data)

    // Negotiation insights (based on market status)
    const negotiationInsights = getNegotiationInsights(data.marketStatus, data.vacancy)

    // Market timing recommendation
    const timingRecommendation = getTimingRecommendation(data.marketStatus, data.appreciation)

    // Sub-area recommendations based on budget
    const subAreaRecs = data.subAreas.slice(0, 3).map(area => ({
      area,
      note: `${area} in ${locality} — ${data.marketStatus === 'Hot' ? 'high demand' : 'emerging value'} sub-pocket`,
    }))

    const result = {
      locality: {
        name: locality,
        marketStatus: data.marketStatus,
        demandLevel: data.demandLevel,
        pricePerSqft: data.pricePerSqft,
        rentalYield: data.rentalYield,
        appreciation: data.appreciation,
        infrastructure: data.infrastructure,
        metroDistance: data.metroDistance,
        itHubDistance: data.itHubDistance,
        schools: data.schools,
        greenFlags: data.greenFlags,
        redFlags: data.redFlags,
        vacancy: data.vacancy,
        subAreas: data.subAreas,
      },
      budget: {
        amount: budget,
        sqftAtAvgPrice: sqftAtBudget,
        configurableAs: configurableAt,
        variants: budgetVariants,
      },
      rental: {
        estimatedMonthlyRent,
        vacancyAdjustedRent,
        netRentalYield,
        annualRent: Math.round(estimatedMonthlyRent * 12),
        vacancy: data.vacancy,
        maintenancePa,
        propertyTaxPa,
      },
      appreciation: {
        rate: data.appreciation,
        futureValues,
      },
      scores: {
        livability: livabilityScore,
        investment: investmentScore,
        overall: Math.round((livabilityScore * 0.4 + investmentScore * 0.6)),
      },
      comparables: comparableAnalysis,
      priorityInsights,
      negotiationInsights,
      timingRecommendation,
      subAreaRecommendations: subAreaRecs,
      inputs: body,
    }

    // Persist to Supabase (gracefully skip)
    try {
      const supabase = await createClient()
      await supabase.from('tool_calculations').insert({
        tool: 'locality',
        input: body,
        result,
        created_at: new Date().toISOString(),
      })
    } catch {
      // Non-fatal
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('[API /tools/locality]', error)
    return NextResponse.json(
      { error: 'Failed to analyse locality. Please check your inputs.' },
      { status: 500 }
    )
  }
}

function calcLivabilityScore(data: ReturnType<typeof getLocality>, priority: string): number {
  let score = 50
  if (data.schools.length >= 3) score += 10
  if (data.metroDistance.includes('km') && parseFloat(data.metroDistance) < 1.5) score += 15
  if (data.infrastructure.length >= 4) score += 10
  if (data.demandLevel === 'High') score += 10
  if (data.vacancy < 7) score += 5
  if (data.redFlags.length > 3) score -= 10
  return Math.min(100, Math.max(0, score))
}

function calcInvestmentScore(data: ReturnType<typeof getLocality>): number {
  let score = 40
  if (data.appreciation >= 9) score += 25
  else if (data.appreciation >= 7) score += 15
  if (data.rentalYield >= 4) score += 20
  else if (data.rentalYield >= 3) score += 10
  if (data.marketStatus === 'Hot') score += 10
  else if (data.marketStatus === 'Emerging') score += 8
  if (data.demandLevel === 'High') score += 5
  if (data.vacancy < 7) score += 5
  if (data.metroDistance.toLowerCase().includes('planned')) score += 5  // metro upside
  return Math.min(100, Math.max(0, score))
}

function getPriorityInsights(
  priority: string,
  data: ReturnType<typeof getLocality>,
  locality: string,
  budget: number,
  estimatedRent: number
): string[] {
  if (priority === 'investment') {
    return [
      `${data.appreciation}% annual appreciation on ₹${(budget / 100000).toFixed(0)}L → adds ₹${(budget * data.appreciation / 100 / 100000).toFixed(0)}L value per year`,
      `Rental yield of ${data.rentalYield}% = ₹${estimatedRent.toLocaleString('en-IN')}/month rent at market rate`,
      data.marketStatus === 'Emerging'
        ? `Emerging market — buy now before price discovery; ${locality} is early in its growth cycle`
        : `${data.marketStatus} market — strong demand ensures low vacancy and steady rental income`,
      `Best investment sub-areas: ${data.subAreas.slice(0, 2).join(', ')}`,
    ]
  }
  if (priority === 'self-use') {
    return [
      `${data.schools.length} reputed schools within locality: ${data.schools.join(', ')}`,
      `Metro access: ${data.metroDistance}`,
      `Key social infrastructure: ${data.infrastructure.slice(0, 3).join(', ')}`,
      `Best residential sub-areas: ${data.subAreas.slice(0, 2).join(', ')}`,
    ]
  }
  if (priority === 'rental') {
    return [
      `Current rental vacancy in ${locality}: ${data.vacancy}% — ${data.vacancy < 7 ? 'low vacancy, strong rental market' : 'moderate vacancy, ensure location quality'}`,
      `Gross yield ${data.rentalYield}%, net ~${(data.rentalYield - 1.2).toFixed(1)}% after costs`,
      `IT hub distance: ${data.itHubDistance} — key driver of rental demand`,
      `Target tenant profile: IT professionals, families, NRI workers`,
    ]
  }
  if (priority === 'resale') {
    return [
      `${data.demandLevel} buyer demand — ${data.demandLevel === 'High' ? 'resale should be quick' : 'may take 3-6 months to find buyer'}`,
      `Appreciation of ${data.appreciation}% pa suggests strong resale value growth`,
      `Metro connectivity (${data.metroDistance}) is a major resale value driver`,
      `Avoid: ${data.redFlags[0] || 'Older buildings without parking'}`,
    ]
  }
  return data.greenFlags
}

function getNegotiationInsights(
  marketStatus: string,
  vacancy: number
): { suggestedDiscount: string; tactics: string[] } {
  if (marketStatus === 'Hot') {
    return {
      suggestedDiscount: '2-5% (limited room)',
      tactics: [
        'Move fast — competing buyers exist in hot markets',
        'Negotiate on extras: parking, parking charges, interiors instead of price',
        'Ask seller to cover stamp duty (sometimes negotiable)',
        'Offer quick close (30 days) in exchange for 2% price reduction',
      ],
    }
  }
  if (marketStatus === 'Cooling') {
    return {
      suggestedDiscount: '8-15% (strong buyer position)',
      tactics: [
        'Request 10-12% discount from listed price — sellers motivated',
        'Negotiate complimentary car parking, club membership, power backup',
        'Ask for deferred payment schedule',
        'Get independent property valuation before negotiating',
      ],
    }
  }
  if (marketStatus === 'Emerging') {
    return {
      suggestedDiscount: '5-8% (moderate room)',
      tactics: [
        'Negotiate using comparable sales in adjacent mature localities',
        'Ask for early-bird pricing if project is under construction',
        'Request amenity upgrades (modular kitchen, false ceiling) instead of price cut',
        'Compare with resale market — often 10-15% cheaper than new launches',
      ],
    }
  }
  // Stable
  return {
    suggestedDiscount: '5-7% (fair market)',
    tactics: [
      'Use comparable sales data to support 5-7% discount request',
      'Longer possession timelines give you more leverage',
      'Ask for GST absorption on under-construction property',
      'Negotiate on car park, amenity fees, maintenance advance',
    ],
  }
}

function getTimingRecommendation(marketStatus: string, appreciation: number): {
  timing: 'Buy Now' | 'Buy Within 6 Months' | 'Wait & Watch' | 'Wait for Correction'
  reason: string
} {
  if (marketStatus === 'Hot' && appreciation >= 9) {
    return {
      timing: 'Buy Now',
      reason: 'Hot market with 9%+ appreciation — waiting increases entry cost significantly',
    }
  }
  if (marketStatus === 'Emerging' && appreciation >= 8) {
    return {
      timing: 'Buy Now',
      reason: 'Emerging market at inflection point — early movers capture maximum upside',
    }
  }
  if (marketStatus === 'Stable' && appreciation >= 7) {
    return {
      timing: 'Buy Within 6 Months',
      reason: 'Stable market with healthy appreciation — no urgency but no benefit in waiting',
    }
  }
  if (marketStatus === 'Cooling') {
    return {
      timing: 'Wait for Correction',
      reason: 'Cooling market — wait 6-12 months for price stabilisation before committing',
    }
  }
  return {
    timing: 'Wait & Watch',
    reason: 'Monitor 2-3 quarters of price data before committing to this locality',
  }
}
