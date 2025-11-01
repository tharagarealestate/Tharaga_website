import { NextRequest, NextResponse } from 'next/server'
export const runtime = 'edge'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  // Here you'd enqueue a job to send the report via your scheduler/worker
  // Accept minimal options for now
  const { recipients, frequency = 'daily', range = '30d' } = body || {}
  if (!Array.isArray(recipients) || recipients.length === 0) {
    return NextResponse.json({ error: 'recipients required' }, { status: 400 })
  }
  return NextResponse.json({ ok: true, scheduled: { recipients, frequency, range } }, { status: 202 })
}
