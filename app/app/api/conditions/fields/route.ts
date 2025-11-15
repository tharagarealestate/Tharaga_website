/**
 * Condition Fields API
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  fieldSchemas,
  getFieldsByCategory,
  getField,
  getAllFieldNames,
} from '@/lib/automation/triggers/fieldSchemas'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const name = searchParams.get('name')
    const category = searchParams.get('category')

    if (name) {
      const field = getField(name)
      if (!field) {
        return NextResponse.json({ error: 'Field not found' }, { status: 404 })
      }
      return NextResponse.json({ data: field })
    }

    if (category) {
      const byCategory = getFieldsByCategory()
      return NextResponse.json({ data: byCategory[category] || [] })
    }

    // Return all fields grouped by category
    const byCategory = getFieldsByCategory()
    return NextResponse.json({ data: byCategory })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
