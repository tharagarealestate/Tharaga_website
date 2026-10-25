export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { WebhookManager } from '@/lib/webhooks/manager'

export async function POST(req: NextRequest) {
  const expectedToken = process.env.WEBHOOK_JOB_TOKEN
  if (expectedToken) {
    const provided = req.headers.get('x-job-token')
    if (provided !== expectedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const url = new URL(req.url)
  const limitParam = url.searchParams.get('limit')
  const limit = limitParam ? Math.max(1, Math.min(50, Number(limitParam) || 10)) : 10

  const manager = WebhookManager.withServiceRole()
  const summary = await manager.processRetryJobs(limit)

  return NextResponse.json({ summary })
}

