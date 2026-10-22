import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const runtime = 'nodejs'

function getAnthropicClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY
  if (!apiKey) return null
  return new Anthropic({ apiKey })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      mandate_category = 'solar_energy',
      scale_or_capacity = '50 MW',
      target_corridors = ['Tuticorin'],
      power_substation_need = '110kV Substation',
      water_or_rail_need = 'Standard Road Access',
      budget_crores = 50,
      corporate_entity = 'MNC Corporate Buyer'
    } = body

    const anthropic = getAnthropicClient()
    const claudeModel = process.env.ANTHROPIC_MODEL || 'claude-haiku-5-5'

    let result = {
      feasibility_score: 94,
      viability_rating: 'Optimal Institutional Feasibility',
      executive_brief: `Mandate for ${scale_or_capacity} ${mandate_category.replace('_', ' ')} across ${target_corridors.join(', ')} meets high institutional readiness. Power grid access and zoning profiles conform with Tamil Nadu industrial guidelines.`,
      infrastructure_synthesis: {
        grid_or_power_feasibility: `${power_substation_need} is achievable within 2-5 km of designated industrial corridors with direct TANGEDCO evacuation support.`,
        logistics_and_connectivity: 'Immediate multi-modal freight highway corridors ensuring low transit latency for heavy manufacturing or logistics operations.',
        topography_and_zoning: 'Contiguous flat terrain, high soil bearing strength, zoned for heavy commercial/industrial utilization.'
      },
      statutory_roadmap: [
        'Revenue department patta and Encumbrance verification (Nil encumbrance 30-year audit)',
        'TNPCB (Tamil Nadu Pollution Control Board) CTE/CTO zoning clearance protocol',
        'Direct bilateral power purchase / TANGEDCO grid connectivity sanction'
      ],
      capital_benchmark: {
        indicative_land_outlay: `₹${Math.round(budget_crores * 0.75)} – ₹${budget_crores} Crores`,
        infrastructure_readiness_cost: '₹1.5 – ₹3.0 Lakhs / Acre for boundary grading and feeder spur line',
        timeline_to_possession: '45 to 75 Business Days under expedited private syndication'
      },
      matching_tharaga_assets: [
        mandate_category === 'solar_energy'
          ? '150-Acre Tuticorin Green Belt Parcel (230kV Substation connected)'
          : mandate_category === 'cement_quarry'
          ? '48-Acre Ariyalur Limestone Reserve (28M MT Proven Reserves)'
          : mandate_category === 'logistics_park'
          ? '42-Acre Hosur Multimodal Hub (NH-44 Corridor)'
          : '85-Acre Sriperumbudur Heavy Industrial Park (NH-48 Corridor)'
      ],
      next_steps: 'Execute confidential mutual Non-Disclosure Agreement (NDA) with Tharaga Advisory Desk to inspect title records and technical core surveys.'
    }

    if (anthropic) {
      try {
        const prompt = `You are the Chief Investment Strategist at Tharaga Institutional Asset Advisory.
An institutional client / MNC corporate real estate head is evaluating an acquisition feasibility requirement:
- Category: ${mandate_category}
- Scale / Extent: ${scale_or_capacity}
- Preferred Tamil Nadu Corridors: ${target_corridors.join(', ')}
- Power / Substation Need: ${power_substation_need}
- Water / Logistics Need: ${water_or_rail_need}
- Budget Range: ₹${budget_crores} Crores
- Entity Profile: ${corporate_entity}

Synthesize a high-precision, institutional technical feasibility response in raw JSON format with these exact keys:
{
  "feasibility_score": (number between 85 and 98),
  "viability_rating": "(e.g. 'Prime Tier-1 Feasibility' or 'High Feasibility with Grid Priority')",
  "executive_brief": "(2 sentences synthesizing commercial, regulatory and corridor viability in Tamil Nadu)",
  "infrastructure_synthesis": {
    "grid_or_power_feasibility": "(precise technical review of power evacuation / substation availability in these corridors)",
    "logistics_and_connectivity": "(freight and road/rail access commentary)",
    "topography_and_zoning": "(land profile, soil bearing, industrial classification)"
  },
  "statutory_roadmap": ["3 regulatory steps in Tamil Nadu including TNPCB, TANGEDCO/TNEB, or Department of Mines"],
  "capital_benchmark": {
    "indicative_land_outlay": "(estimated outlay range in ₹ Crores)",
    "infrastructure_readiness_cost": "(approx cost per acre for civil/feeder prep)",
    "timeline_to_possession": "(realistic closing timeline e.g. 45-60 days)"
  },
  "matching_tharaga_assets": ["1-2 specific asset types in Tharaga's pipeline that match this mandate"],
  "next_steps": "(Actionable guidance to request confidential NDA and technical data room)"
}
Output only pure valid JSON, no markdown formatting or backticks.`

        const response = await anthropic.messages.create({
          model: claudeModel,
          max_tokens: 4096,
          messages: [{ role: 'user', content: prompt }]
        })

        const textBlock = response.content?.find((b: any) => b.type === 'text')
        const text = textBlock && 'text' in textBlock ? textBlock.text : ''
        if (text) {
          const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim()
          const parsed = JSON.parse(cleaned)
          result = { ...result, ...parsed }
        }
      } catch (aiErr: any) {
        console.warn('Claude API screener analysis fallback used:', aiErr.message)
      }
    }

    return NextResponse.json({ success: true, analysis: result })
  } catch (err: any) {
    console.error('Commercial screener error:', err)
    return NextResponse.json({ error: err.message || 'Failed to screen institutional mandate' }, { status: 500 })
  }
}
