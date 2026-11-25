import { NextRequest, NextResponse } from 'next/server'
import { MANDATES } from '@/lib/mandates'

export const runtime = 'nodejs'


// Live mandate portfolio (no prices are ever exposed). Source of truth: lib/mandates.ts
const SHOWCASE = MANDATES.map(({ slug, name, category, location, region, tagline, teaser, stats, badge, image }) => ({
  id: slug, slug, title: name, category, location, region, tagline, teaser, stats, badge: badge?.label ?? null, image,
}))

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')

    // Owner listings are served only to their signed-in owner via /api/listings (GET).

    // Filter live portfolio by category if requested
    let showcase = SHOWCASE
    if (category && category !== 'all') {
      showcase = showcase.filter(m => m.category === category.toLowerCase())
    }

    return NextResponse.json({
      success: true,
      showcase,
      user_mandates: [],
    })
  } catch (err: any) {
    console.error('Commercial mandates GET error:', err)
    return NextResponse.json({ success: false, showcase: SHOWCASE, user_mandates: [] })
  }
}
