/**
 * Condition Templates API
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  conditionTemplates,
  getTemplatesByCategory,
  getTemplate,
  searchTemplates,
} from '@/lib/automation/triggers/conditionTemplates'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')
    const category = searchParams.get('category')
    const search = searchParams.get('search')

    if (id) {
      const template = getTemplate(id)
      if (!template) {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 })
      }
      return NextResponse.json({ data: template })
    }

    if (category) {
      const byCategory = getTemplatesByCategory()
      return NextResponse.json({ data: byCategory[category] || [] })
    }

    if (search) {
      const results = searchTemplates(search)
      return NextResponse.json({ data: results })
    }

    // Return all templates grouped by category
    const byCategory = getTemplatesByCategory()
    return NextResponse.json({ data: byCategory })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
