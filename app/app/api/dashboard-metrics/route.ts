import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: Request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 1. Housekeeping: Delete test leads exactly as requested by user
    await supabase.from('leads').delete().or('name.ilike.%test%,name.ilike.%debug%,email.ilike.%test%')

    // 2. Fetch all leads and properties
    const [leadsRes, propsRes] = await Promise.all([
      supabase.from('leads').select('*'),
      supabase.from('properties').select('*')
    ])

    const leads = leadsRes.data || []
    const properties = propsRes.data || []

    // 3. Compute Builder Dashboard Metrics
    const activeLeads = leads.filter((l: any) => ['new', 'contacted', 'qualified'].includes(l.status)).length
    const lionLeads = leads.filter((l: any) => l.smartscore >= 75 || l.tier === 'lion').length
    const converted = leads.filter((l: any) => l.status === 'converted').length
    const conversionRate = leads.length > 0 ? ((converted / leads.length) * 100).toFixed(1) : '0'

    // Pipeline Value = Price of all properties tied to qualified leads (or just sum active property prices for demo)
    let totalPipelineValue = 0
    leads.filter((l: any) => l.status === 'qualified').forEach((l: any) => {
        const p = properties.find((prop: any) => prop.id === l.property_id)
        if (p && p.price_inr) totalPipelineValue += p.price_inr
    })

    let pipelineStr = '₹0'
    if (totalPipelineValue > 0) {
        if (totalPipelineValue >= 10000000) pipelineStr = `₹${(totalPipelineValue / 10000000).toFixed(1)}Cr`
        else pipelineStr = `₹${(totalPipelineValue / 100000).toFixed(1)}L`
    }

    // 4. Compute Locality Aggregations
    const localityMap: Record<string, { count: number, prices: number[], scores: number[] }> = {}
    properties.forEach((p: any) => {
      const loc = p.locality || p.city || 'Chennai'
      if (!localityMap[loc]) localityMap[loc] = { count: 0, prices: [], scores: [] }
      localityMap[loc].count++
      if (p.price_inr) localityMap[loc].prices.push(p.price_inr)
      if (p.ai_score || p.smartscore) localityMap[loc].scores.push(p.ai_score || p.smartscore || 80)
    })

    const localData = Object.entries(localityMap).map(([name, data]: [string, any], index) => {
        const maxP = Math.max(...(data.prices.length ? data.prices : [5000000]))
        const minP = Math.min(...(data.prices.length ? data.prices : [3000000]))
        const avgScore = data.scores.length ? Math.round(data.scores.reduce((a:number,b:number)=>a+b, 0) / data.scores.length) : 85
        
        let priceStr = ''
        if (maxP >= 10000000) priceStr = `₹${(minP/10000000).toFixed(1)}-${(maxP/10000000).toFixed(1)}Cr`
        else priceStr = `₹${(minP/100000).toFixed(0)}-${(maxP/100000).toFixed(0)}L`

        return {
            id: `loc-${index}`,
            name,
            properties: data.count,
            price: priceStr,
            demand: avgScore,
            x: 20 + Math.random() * 60, // Random spread for map
            y: 20 + Math.random() * 60
        }
    })

    // Return the payload
    return NextResponse.json({
        metrics: {
            activeLeads,
            pipelineValue: pipelineStr,
            lionLeads,
            conversionRate: `${conversionRate}%`
        },
        localities: localData.length > 0 ? localData : null,
        propertyCount: properties.length
    })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
