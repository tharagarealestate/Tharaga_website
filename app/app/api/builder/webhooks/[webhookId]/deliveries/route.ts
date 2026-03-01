export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createWebhookManager } from '@/lib/webhooks/manager'

async function resolveBuilderId(req: NextRequest, supabase?: Awaited<ReturnType<typeof createClient>>): Promise<string | null> {
  const client = supabase || await createClient()
  try {
    const {
      data: { user },
    } = await client.auth.getUser()
    if (user?.id) return user.id
  } catch (error) {
    console.warn('[API] webhook deliveries auth lookup failed', error)
  }

  const url = new URL(req.url)
  return url.searchParams.get('builder_id')
}

export async function GET(req: NextRequest, { params }: { params: { webhookId: string } }) {
  const supabase = await createClient()
  const builderId = await resolveBuilderId(req, supabase)

  if (!builderId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const manager = createWebhookManager({ supabase })
  const { webhook } = await manager.getWebhookById(builderId, params.webhookId)

  if (!webhook) {
    return NextResponse.json({ error: 'Webhook not found' }, { status: 404 })
  }

  const { deliveries, error } = await manager.getDeliveryHistory({
    webhookId: params.webhookId,
    limit: Number(new URL(req.url).searchParams.get('limit') || 50),
  })

  if (error) {
    return NextResponse.json({ error }, { status: 500 })
  }

  return NextResponse.json({ deliveries })
}

