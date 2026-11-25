import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

// Replaced by /api/listings (real persistence, private media storage, desk alert).
export async function POST() {
  return NextResponse.json({ error: 'This endpoint has moved. Please refresh the page and try again.' }, { status: 410 })
}
