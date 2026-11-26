import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getLocality, STAMP_DUTY_RATE, REGISTRATION_FEE_RATE } from '@/lib/chennai-market'
import { calcFutureValue, calcNetRentalYield } from '@/lib/ai-tools/calculations'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface ValuationBody {
  propertyType: 'apartment' | 'villa' | 'plot' | 'independent-house' | 'commercial'
  area: number            // built-up area in sqft
  locality: string
  age?: number            // property age in years
  amenities?: string[]    // e.g. ['gym', 'pool', 'clubhouse', 'security', 'lift', 'parking']
  floor?: number          // floor number (1-based)
  totalFloors?: number
  facing?: 'North' | 'South' | 'East' | 'West' | 'North-East' | 'North-West' | 'South-East' | 'South-West'
  reraRegistered?: boolean
  condition?: 'Excellent' | 'Good' | 'Fair' | 'Poor'
  furnishing?: 'Fully Furnished' | 'Semi Furnished' | 'Unfurnished'
  carpetArea?: number     // if known; else estimated from built-up
}

export async function POST(req: NextRequest) {
  try {
    const body: ValuationBody = await req.json()

    const {
      propertyType,
      area,
      locality,
      age = 0,
      amenities = [],
      floor = 1,
      totalFloors = 10,
      facing = 'East',
      reraRegistered = false,
      condition = 'Good',
      furnishing = 'Unfurnished',
      carpetArea,
    } = body

    if (!area || area <= 0) {
      return NextResponse.json({ error: 'area is required and must be > 0' }, { status: 400 })
    }
    if (!locality) {
      return NextResponse.json({ error: 'locality is required' }, { status: 400 })
    }

    const localityData = getLocality(locality)
    const basePricePerSqft = localityData.pricePerSqft.avg

    // --- Adjustment factors ---

    // 1. Property type multiplier (relative to apartment baseline)
    const typeMultipliers: Record<string, number> = {
      'apartment': 1.00,
      'villa': 1.20,
      'independent-house': 1.10,
      'plot': 0.70,           // lower per-sqft but different dynamics
      'commercial': 1.30,
    }
    const typeMultiplier = typeMultipliers[propertyType] ?? 1.00

    // 2. Age depreciation (Indian real estate — construction quality factor)
    // New: 0%, 1-5yr: -3%, 5-10yr: -8%, 10-20yr: -15%, 20-30yr: -22%, >30yr: -30%
    let ageDepreciation = 0
    if (age <= 0) ageDepreciation = 0
    else if (age <= 5)  ageDepreciation = 0.03
    else if (age <= 10) ageDepreciation = 0.08
    else if (age <= 20) ageDepreciation = 0.15
    else if (age <= 30) ageDepreciation = 0.22
    else                 ageDepreciation = 0.30

    // 3. Floor premium/discount
    // Ground: -5%, 1st-3rd: 0%, 4th-8th: +3%, 9th-15th: +5%, 16th+: +7%, Top: -2% (water/maintenance)
    let floorPremium = 0
    if (floor === 0 || floor === 1) floorPremium = -0.05
    else if (floor <= 3)  floorPremium = 0
    else if (floor <= 8)  floorPremium = 0.03
    else if (floor <= 15) floorPremium = 0.05
    else if (floor === totalFloors) floorPremium = 0.05  // top floor premium
    else floorPremium = 0.07

    // 4. Facing premium (Vastu — strong in Chennai market)
    const facingPremiums: Record<string, number> = {
      'North-East': 0.08,
      'East':       0.05,
      'North':      0.04,
      'North-West': 0.02,
      'West':       0.00,
      'South-East': 0.01,
      'South':     -0.02,
      'South-West': -0.03,
    }
    const facingPremium = facingPremiums[facing] ?? 0

    // 5. Amenity premium (each verified amenity adds ~0.5-2%)
    const amenityValues: Record<string, number> = {
      pool: 0.025, gym: 0.015, clubhouse: 0.02, security: 0.01,
      lift: 0.015, parking: 0.015, 'power backup': 0.01, garden: 0.01,
      playground: 0.008, 'co-working': 0.012, spa: 0.02, 'ev charging': 0.008,
    }
    const amenityPremium = Math.min(0.15, amenities.reduce((sum, a) => {
      const key = a.toLowerCase()
      return sum + (amenityValues[key] ?? 0.005)
    }, 0))

    // 6. RERA premium
    const reraPremium = reraRegistered ? 0.03 : 0

    // 7. Condition adjustment
    const conditionAdjustments: Record<string, number> = {
      'Excellent': 0.05, 'Good': 0, 'Fair': -0.08, 'Poor': -0.18,
    }
    const conditionAdj = conditionAdjustments[condition] ?? 0

    // 8. Furnishing premium
    const furnishingPremiums: Record<string, number> = {
      'Fully Furnished': 0.08, 'Semi Furnished': 0.04, 'Unfurnished': 0,
    }
    const furnishingPremium = furnishingPremiums[furnishing] ?? 0

    // --- Final calculation ---
    const totalMultiplier = typeMultiplier *
      (1 - ageDepreciation) *
      (1 + floorPremium) *
      (1 + facingPremium) *
      (1 + amenityPremium) *
      (1 + reraPremium) *
      (1 + conditionAdj) *
      (1 + furnishingPremium)

    const adjustedPricePerSqft = Math.round(basePricePerSqft * totalMultiplier)
    const fairValue = Math.round(adjustedPricePerSqft * area)

    // Valuation range: ±8% of fair value
    const valuationRange = {
      low: Math.round(fairValue * 0.92),
      fair: fairValue,
      high: Math.round(fairValue * 1.10),
    }

    // Carpet area estimate (carpet = ~72% of built-up for apartments)
    const effectiveCarpetArea = carpetArea || Math.round(area * 0.72)

    // Acquisition costs
    const stampDuty = Math.round(fairValue * STAMP_DUTY_RATE)
    const registrationFee = Math.round(fairValue * REGISTRATION_FEE_RATE)
    const totalAcquisitionCost = fairValue + stampDuty + registrationFee

    // Rental estimate
    const estimatedMonthlyRent = Math.round(fairValue * localityData.rentalYield / 100 / 12)

    // Future projections
    const futureValues = [3, 5, 10].map(years => ({
      years,
      value: calcFutureValue(fairValue, localityData.appreciation, years),
      gain: calcFutureValue(fairValue, localityData.appreciation, years) - fairValue,
    }))

    // Adjustment breakdown for transparency
    const adjustmentBreakdown = [
      { factor: 'Base price (locality avg)', adjustment: `₹${basePricePerSqft.toLocaleString('en-IN')}/sqft`, impact: 'Base' },
      { factor: 'Property type', adjustment: `×${typeMultiplier.toFixed(2)}`, impact: typeMultiplier > 1 ? `+${((typeMultiplier - 1) * 100).toFixed(0)}%` : '0%' },
      { factor: `Age (${age} years)`, adjustment: `−${(ageDepreciation * 100).toFixed(0)}%`, impact: `−${(ageDepreciation * 100).toFixed(0)}%` },
      { factor: `Floor (${floor}${totalFloors ? `/${totalFloors}` : ''})`, adjustment: floorPremium >= 0 ? `+${(floorPremium * 100).toFixed(0)}%` : `${(floorPremium * 100).toFixed(0)}%`, impact: floorPremium >= 0 ? `+${(floorPremium * 100).toFixed(0)}%` : `${(floorPremium * 100).toFixed(0)}%` },
      { factor: `Facing (${facing})`, adjustment: facingPremium >= 0 ? `+${(facingPremium * 100).toFixed(0)}%` : `${(facingPremium * 100).toFixed(0)}%`, impact: facingPremium >= 0 ? `+${(facingPremium * 100).toFixed(0)}%` : `${(facingPremium * 100).toFixed(0)}%` },
      { factor: `Amenities (${amenities.length} items)`, adjustment: `+${(amenityPremium * 100).toFixed(0)}%`, impact: `+${(amenityPremium * 100).toFixed(0)}%` },
      { factor: 'RERA registered', adjustment: reraRegistered ? '+3%' : '0%', impact: reraRegistered ? '+3%' : '0%' },
      { factor: `Condition (${condition})`, adjustment: conditionAdj >= 0 ? `+${(conditionAdj * 100).toFixed(0)}%` : `${(conditionAdj * 100).toFixed(0)}%`, impact: conditionAdj >= 0 ? `+${(conditionAdj * 100).toFixed(0)}%` : `${(conditionAdj * 100).toFixed(0)}%` },
      { factor: `Furnishing (${furnishing})`, adjustment: `+${(furnishingPremium * 100).toFixed(0)}%`, impact: `+${(furnishingPremium * 100).toFixed(0)}%` },
    ]

    // Negotiation strategy
    const negotiationStrategy = getNegotiationStrategy(
      localityData.marketStatus, age, condition, reraRegistered, localityData.vacancy, fairValue
    )

    // Investment recommendation
    const investmentRating = getInvestmentRating(localityData, age, reraRegistered)

    // Red/green flags specific to this property
    const propertyFlags = {
      green: [
        ...localityData.greenFlags.slice(0, 2),
        reraRegistered ? 'RERA registered — legal protection secured' : '',
        facing === 'East' || facing === 'North-East' ? 'Preferred Vastu facing — commands premium resale' : '',
        age <= 5 ? 'Near-new property — low maintenance for 10+ years' : '',
        amenities.length >= 5 ? `Well-amenitised complex (${amenities.length} amenities)` : '',
      ].filter(Boolean),
      red: [
        ...localityData.redFlags.slice(0, 2),
        age > 20 ? 'Property age > 20 years — expect major renovation costs' : '',
        !reraRegistered ? 'Not RERA registered — verify all legal documents independently' : '',
        condition === 'Poor' ? 'Poor condition — factor ₹500-800/sqft renovation cost' : '',
      ].filter(Boolean),
    }

    const result = {
      valuation: {
        fairValuePerSqft: adjustedPricePerSqft,
        fairValue,
        range: valuationRange,
        carpetArea: effectiveCarpetArea,
        builtUpArea: area,
      },
      acquisitionCost: {
        propertyPrice: fairValue,
        stampDuty,
        registrationFee,
        total: totalAcquisitionCost,
      },
      adjustments: {
        breakdown: adjustmentBreakdown,
        totalMultiplier: parseFloat(totalMultiplier.toFixed(4)),
        netAdjustment: `${totalMultiplier >= 1 ? '+' : ''}${((totalMultiplier - 1) * 100).toFixed(1)}% vs locality base`,
      },
      rental: {
        estimatedMonthlyRent,
        annualRent: Math.round(estimatedMonthlyRent * 12),
        grossYield: localityData.rentalYield,
        netYield: parseFloat((localityData.rentalYield - 1.2).toFixed(2)),
      },
      appreciation: {
        rate: localityData.appreciation,
        futureValues,
      },
      locality: {
        name: locality,
        marketStatus: localityData.marketStatus,
        pricePerSqft: localityData.pricePerSqft,
        metroDistance: localityData.metroDistance,
      },
      negotiationStrategy,
      investmentRating,
      propertyFlags,
      inputs: body,
    }

    // Persist to Supabase (gracefully skip)
    try {
      const supabase = await createClient()
      await supabase.from('tool_calculations').insert({
        tool: 'valuation',
        input: body,
        result,
        created_at: new Date().toISOString(),
      })
    } catch {
      // Non-fatal
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('[API /tools/valuation]', error)
    return NextResponse.json(
      { error: 'Failed to calculate valuation. Please check your inputs.' },
      { status: 500 }
    )
  }
}

function getNegotiationStrategy(
  marketStatus: string,
  age: number,
  condition: string,
  rera: boolean,
  vacancy: number,
  fairValue: number
): {
  targetDiscount: string
  walkAwayPrice: number
  tactics: string[]
  leverage: string[]
} {
  let discountRange = '3-5%'
  const tactics: string[] = []
  const leverage: string[] = []

  if (marketStatus === 'Hot') {
    discountRange = '2-4%'
    tactics.push('Act quickly — ask for discount on extras not headline price')
    tactics.push('Offer quick registration (14 days) for 2% price reduction')
  } else if (marketStatus === 'Cooling') {
    discountRange = '8-15%'
    tactics.push('Open at 15% below asking — expect to settle at 8-12% discount')
    tactics.push('Request seller to bear stamp duty or interior allowance')
  } else {
    discountRange = '5-8%'
    tactics.push('Start at 8% below asking — settle at 5-6%')
    tactics.push('Use comparable sales in the building / complex to anchor negotiations')
  }

  if (age > 10) {
    leverage.push(`Property age ${age} years — point to pending maintenance costs as negotiation leverage`)
    tactics.push('Get structural assessment report — use repair estimates to negotiate price')
  }
  if (condition === 'Fair' || condition === 'Poor') {
    leverage.push('Poor condition allows 5-10% additional discount vs fair market')
    tactics.push(`Factor renovation cost of ₹${condition === 'Poor' ? '700-1000' : '400-600'}/sqft in final offer`)
  }
  if (!rera) {
    leverage.push('No RERA registration — demand 3-5% risk discount or legal indemnity')
    tactics.push('Insist on thorough due diligence before advance payment')
  }
  if (vacancy > 10) {
    leverage.push(`High vacancy (${vacancy}%) in locality — sellers aware of slow market`)
  }

  tactics.push('Never make the first offer — ask seller to justify their price first')
  tactics.push('Walk away once — a genuine counter-offer usually follows within 48 hours')

  const discountPct = parseInt(discountRange.split('-')[0]) / 100
  const walkAwayPrice = Math.round(fairValue * (1 - discountPct))

  return { targetDiscount: discountRange, walkAwayPrice, tactics, leverage }
}

function getInvestmentRating(
  data: ReturnType<typeof getLocality>,
  age: number,
  rera: boolean
): {
  rating: 'Excellent' | 'Good' | 'Average' | 'Below Average' | 'Poor'
  score: number
  rationale: string
} {
  let score = 50
  if (data.appreciation >= 9) score += 20
  else if (data.appreciation >= 7) score += 12
  if (data.rentalYield >= 4) score += 15
  else if (data.rentalYield >= 3) score += 8
  if (data.marketStatus === 'Hot') score += 10
  else if (data.marketStatus === 'Emerging') score += 8
  if (data.demandLevel === 'High') score += 8
  if (rera) score += 5
  if (age <= 5) score += 5
  else if (age > 20) score -= 10
  if (data.vacancy > 12) score -= 8
  else if (data.vacancy < 6) score += 5

  score = Math.min(100, Math.max(0, score))

  let rating: 'Excellent' | 'Good' | 'Average' | 'Below Average' | 'Poor'
  if (score >= 85) rating = 'Excellent'
  else if (score >= 70) rating = 'Good'
  else if (score >= 55) rating = 'Average'
  else if (score >= 40) rating = 'Below Average'
  else rating = 'Poor'

  const rationale = `Score ${score}/100: ${data.appreciation}% appreciation, ${data.rentalYield}% yield, ${data.marketStatus} market, ${data.demandLevel} demand${rera ? ', RERA secured' : ''}`

  return { rating, score, rationale }
}
