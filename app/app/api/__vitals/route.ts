import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  // Swallow Web Vitals beacons during dev to avoid console noise
  try { await req.json().catch(() => null) } catch {}
  return NextResponse.json({ ok: true })
}
