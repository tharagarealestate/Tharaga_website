export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createWebhookManager, type Webhook } from '@/lib/webhooks/manager'

async function resolveBuilderId(req: NextRequest, supabase = createClient()): Promise<string | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user?.id) return user.id
  } catch (error) {
    console.warn('[API] webhooks builder auth lookup failed', error)
  }

  const url = new URL(req.url)
  return url.searchParams.get('builder_id')
}

export async function GET(req: NextRequest, { params }: { params: { webhookId: string } }) {
  const supabase = createClient()
  const manager = createWebhookManager({ supabase })
  const builderId = await resolveBuilderId(req, supabase)

  if (!builderId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { webhook, error } = await manager.getWebhookById(builderId, params.webhookId)

  if (error || !webhook) {
    return NextResponse.json({ error: error ?? 'Webhook not found' }, { status: 404 })
  }

  return NextResponse.json({ webhook })
}

export async function PATCH(req: NextRequest, { params }: { params: { webhookId: string } }) {
  const supabase = createClient()
  const manager = createWebhookManager({ supabase })
  const builderId = await resolveBuilderId(req, supabase)

  if (!builderId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  if (body.rotate_secret) {
    const { error, secret } = await manager.rotateSecret(builderId, params.webhookId)
    if (error || !secret) {
      return NextResponse.json({ error: error ?? 'Failed to rotate secret' }, { status: 400 })
    }
    const latest = await manager.getWebhookById(builderId, params.webhookId)
    return NextResponse.json({ webhook: latest.webhook, secret })
  }

  const updates: Partial<Pick<Webhook, 'name' | 'url' | 'events' | 'filters' | 'is_active' | 'retry_count' | 'timeout_seconds'>> = {}
  if (typeof body.name === 'string') updates.name = body.name
  if (typeof body.url === 'string') updates.url = body.url
  if (Array.isArray(body.events)) updates.events = body.events
  if (typeof body.is_active === 'boolean') updates.is_active = body.is_active
  if (typeof body.retry_count === 'number') updates.retry_count = body.retry_count
  if (typeof body.timeout_seconds === 'number') updates.timeout_seconds = body.timeout_seconds
  if (body.filters !== undefined) updates.filters = body.filters

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No updatable fields provided' }, { status: 400 })
  }

  const { webhook, error } = await manager.updateWebhook(builderId, params.webhookId, updates)

  if (error || !webhook) {
    return NextResponse.json({ error: error ?? 'Failed to update webhook' }, { status: 400 })
  }

  return NextResponse.json({ webhook })
}

export async function DELETE(req: NextRequest, { params }: { params: { webhookId: string } }) {
  const supabase = createClient()
  const manager = createWebhookManager({ supabase })
  const builderId = await resolveBuilderId(req, supabase)

  if (!builderId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { success, error } = await manager.deleteWebhook(builderId, params.webhookId)

  if (!success) {
    return NextResponse.json({ error: error ?? 'Failed to delete webhook' }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}

