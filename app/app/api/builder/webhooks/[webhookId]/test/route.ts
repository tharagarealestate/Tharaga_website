export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createWebhookManager } from '@/lib/webhooks/manager'

async function resolveBuilderId(req: NextRequest, supabase = createClient()): Promise<string | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user?.id) return user.id
  } catch (error) {
    console.warn('[API] webhook test auth lookup failed', error)
  }

  const url = new URL(req.url)
  return url.searchParams.get('builder_id')
}

export async function POST(req: NextRequest, { params }: { params: { webhookId: string } }) {
  const supabase = createClient()
  const builderId = await resolveBuilderId(req, supabase)

  if (!builderId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const manager = createWebhookManager({ supabase })
  const { webhook, error } = await manager.getWebhookById(builderId, params.webhookId)

  if (error || !webhook) {
    return NextResponse.json({ error: error ?? 'Webhook not found' }, { status: 404 })
  }

  const result = await manager.testWebhook(params.webhookId)
  const status = result.success ? 200 : 502

  return NextResponse.json({ result }, { status })
}

