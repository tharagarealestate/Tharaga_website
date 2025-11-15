/**
 * Condition Preview API - Preview matching leads
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { triggerEvaluator } from '@/lib/automation/triggers/triggerEvaluator'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { condition, builder_id, include_leads = false, limit = 10 } = body

    if (!condition) {
      return NextResponse.json(
        { error: 'Condition is required' },
        { status: 400 }
      )
    }

    const targetBuilderId = builder_id || user.id

    // Get leads for this builder
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('*')
      .eq('builder_id', targetBuilderId)
      .limit(limit * 2) // Get more to filter

    if (leadsError) {
      return NextResponse.json({ error: leadsError.message }, { status: 500 })
    }

    // Evaluate condition for each lead
    const matchingLeads = []
    for (const lead of leads || []) {
      try {
        const result = await triggerEvaluator.evaluate(condition, lead, {})
        if (result.matches) {
          matchingLeads.push(include_leads ? lead : { id: lead.id, email: lead.email })
          if (matchingLeads.length >= limit) {
            break
          }
        }
      } catch (error) {
        // Skip leads that cause evaluation errors
        continue
      }
    }

    return NextResponse.json({
      data: {
        count: matchingLeads.length,
        leads: matchingLeads,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
