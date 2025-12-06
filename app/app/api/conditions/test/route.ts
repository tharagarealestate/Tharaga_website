/**
 * Condition Test API
 */

import { NextRequest, NextResponse } from 'next/server'
import { testCondition } from '@/lib/automation/triggers/conditionTester'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { condition, test_data } = body

    if (!condition) {
      return NextResponse.json(
        { error: 'Condition is required' },
        { status: 400 }
      )
    }

    if (!test_data) {
      return NextResponse.json(
        { error: 'test_data is required' },
        { status: 400 }
      )
    }

    const result = await testCondition(condition, test_data)

    return NextResponse.json({ data: result })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
