export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createWebhookManager } from '@/lib/webhooks/manager'

async function getBuilderId(req: NextRequest, supabase?: Awaited<ReturnType<typeof createClient>>): Promise<string | null> {
  const client = supabase || await createClient()
  try {
    const {
      data: { user },
    } = await client.auth.getUser()
    if (user?.id) return user.id
  } catch (error) {
    console.warn('[API] webhooks builder auth lookup failed', error)
  }

  const url = new URL(req.url)
  return url.searchParams.get('builder_id')
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const builderId = await getBuilderId(req, supabase)

  if (!builderId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const manager = createWebhookManager({ supabase })
  const { webhooks, error } = await manager.listWebhooks(builderId)

  if (error) {
    return NextResponse.json({ error }, { status: 500 })
  }

  return NextResponse.json({ webhooks })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const builderId = await getBuilderId(req, supabase)

  if (!builderId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)

  if (!body || typeof body.name !== 'string' || typeof body.url !== 'string') {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const manager = createWebhookManager({ supabase })
  const { webhook, error } = await manager.registerWebhook({
    builderId,
    name: body.name,
    url: body.url,
    events: Array.isArray(body.events) ? body.events : [],
    filters: body.filters ?? undefined,
    retryCount: typeof body.retry_count === 'number' ? body.retry_count : undefined,
    timeoutSeconds: typeof body.timeout_seconds === 'number' ? body.timeout_seconds : undefined,
  })

  if (error || !webhook) {
    return NextResponse.json({ error: error ?? 'Failed to create webhook' }, { status: 400 })
  }

  return NextResponse.json({ webhook }, { status: 201 })
}

