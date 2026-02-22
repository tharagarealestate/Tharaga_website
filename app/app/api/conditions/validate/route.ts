/**
 * Condition Validation API
 */

import { NextRequest, NextResponse } from 'next/server'
import { validateCondition } from '@/lib/automation/triggers/conditionValidators'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { condition } = body

    if (!condition) {
      return NextResponse.json(
        { error: 'Condition is required' },
        { status: 400 }
      )
    }

    const result = validateCondition(condition)

    return NextResponse.json({ data: result })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
