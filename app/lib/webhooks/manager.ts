import { createClient as createRouteClient } from '@/lib/supabase/server'
import { SupabaseClient, createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createHmac, randomBytes, timingSafeEqual } from 'crypto'

type GenericSupabaseClient = SupabaseClient<any, any, any>

export interface Webhook {
  id: string
  builder_id: string
  name: string
  url: string
  secret_key: string
  events: string[]
  is_active: boolean
  retry_count: number
  timeout_seconds: number
  filters?: Record<string, any> | null
  total_deliveries: number
  successful_deliveries: number
  failed_deliveries: number
  last_delivery_at?: string | null
  last_delivery_status?: string | null
}

export interface WebhookPayload {
  event: string
  timestamp: string
  data: Record<string, any>
}

export interface WebhookDeliveryResult {
  success: boolean
  status_code?: number
  response_body?: string | null
  response_time_ms: number
  error?: string | null
}

export interface WebhookDeliveryLog {
  id: string
  webhook_id: string
  event_type: string
  payload: WebhookPayload
  status: string
  attempt_number: number
  status_code?: number | null
  response_body?: string | null
  response_time_ms?: number | null
  next_retry_at?: string | null
  error_message?: string | null
  created_at: string
}

interface RetryJobPayload {
  webhook_id: string
  event: string
  data: Record<string, any>
  attempt_number: number
  delivery_id?: string
}

function getServiceClient(): GenericSupabaseClient {
  if (serviceClientInstance) return serviceClientInstance

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE

  if (!url || !key) {
    throw new Error('Missing Supabase service role credentials')
  }

  serviceClientInstance = createSupabaseClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  return serviceClientInstance
}

let serviceClientInstance: GenericSupabaseClient | null = null

export class WebhookManager {
  private serviceSupabase: GenericSupabaseClient

  constructor(
    private readonly supabase: GenericSupabaseClient,
    serviceClient?: GenericSupabaseClient
  ) {
    this.serviceSupabase = serviceClient ?? getServiceClient()
  }

  static withRouteClient(): WebhookManager {
    const client = createRouteClient()
    return new WebhookManager(client)
  }

  static withServiceRole(): WebhookManager {
    const service = getServiceClient()
    return new WebhookManager(service, service)
  }

  async registerWebhook(params: {
    builderId: string
    name: string
    url: string
    events: string[]
    filters?: Record<string, any>
    retryCount?: number
    timeoutSeconds?: number
  }): Promise<{ webhook?: Webhook; error?: string }> {
    try {
      const urlObj = new URL(params.url)
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return { error: 'Webhook URL must use HTTP or HTTPS protocol' }
      }

      if (!Array.isArray(params.events) || params.events.length === 0) {
        return { error: 'At least one event must be selected' }
      }

      const secretKey = this.generateSecretKey()
      const { data, error } = await this.supabase
        .from('webhooks')
        .insert({
          builder_id: params.builderId,
          name: params.name.trim(),
          url: params.url.trim(),
          secret_key: secretKey,
          events: params.events,
          filters: params.filters ?? null,
          retry_count: params.retryCount ?? 3,
          timeout_seconds: params.timeoutSeconds ?? 30,
        })
        .select()
        .single()

      if (error) {
        console.error('[WebhookManager] registerWebhook error', error)
        return { error: error.message }
      }

      return { webhook: data as Webhook }
    } catch (error: any) {
      console.error('[WebhookManager] registerWebhook unexpected error', error)
      return { error: error.message ?? 'Failed to register webhook' }
    }
  }

  async listWebhooks(builderId: string): Promise<{ webhooks: Webhook[]; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('webhooks')
        .select('*')
        .eq('builder_id', builderId)
        .order('created_at', { ascending: false })

      if (error) {
        return { webhooks: [], error: error.message }
      }

      return { webhooks: (data as Webhook[]) ?? [] }
    } catch (error: any) {
      return { webhooks: [], error: error.message ?? 'Failed to load webhooks' }
    }
  }

  async getWebhookById(builderId: string, webhookId: string): Promise<{ webhook?: Webhook; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('webhooks')
        .select('*')
        .eq('builder_id', builderId)
        .eq('id', webhookId)
        .single()

      if (error) {
        return { error: error.message }
      }

      return { webhook: data as Webhook }
    } catch (error: any) {
      return { error: error.message ?? 'Failed to fetch webhook' }
    }
  }

  async updateWebhook(
    builderId: string,
    webhookId: string,
    updates: Partial<Pick<Webhook, 'name' | 'url' | 'events' | 'filters' | 'is_active' | 'retry_count' | 'timeout_seconds'>>
  ): Promise<{ webhook?: Webhook; error?: string }> {
    try {
      if (updates.url) {
        const urlObj = new URL(updates.url)
        if (!['http:', 'https:'].includes(urlObj.protocol)) {
          return { error: 'Webhook URL must use HTTP or HTTPS protocol' }
        }
      }

      if (updates.events && updates.events.length === 0) {
        return { error: 'Webhook must listen to at least one event' }
      }

      const payload: Record<string, unknown> = {}
      if (updates.name !== undefined) payload.name = updates.name
      if (updates.url !== undefined) payload.url = updates.url
      if (updates.events !== undefined) payload.events = updates.events
      if (updates.filters !== undefined) payload.filters = updates.filters ?? null
      if (updates.is_active !== undefined) payload.is_active = updates.is_active
      if (updates.retry_count !== undefined) payload.retry_count = updates.retry_count
      if (updates.timeout_seconds !== undefined) payload.timeout_seconds = updates.timeout_seconds

      if (Object.keys(payload).length === 0) {
        return this.getWebhookById(builderId, webhookId)
      }

      payload.updated_at = new Date().toISOString()

      const { data, error } = await this.supabase
        .from('webhooks')
        .update(payload)
        .eq('builder_id', builderId)
        .eq('id', webhookId)
        .select()
        .single()

      if (error) {
        return { error: error.message }
      }

      return { webhook: data as Webhook }
    } catch (error: any) {
      return { error: error.message ?? 'Failed to update webhook' }
    }
  }

  async deleteWebhook(builderId: string, webhookId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('webhooks')
        .delete()
        .eq('builder_id', builderId)
        .eq('id', webhookId)

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message ?? 'Failed to delete webhook' }
    }
  }

  async rotateSecret(builderId: string, webhookId: string): Promise<{ secret?: string; error?: string }> {
    try {
      const secret = this.generateSecretKey()
      const { error } = await this.supabase
        .from('webhooks')
        .update({
          secret_key: secret,
          updated_at: new Date().toISOString(),
        })
        .eq('builder_id', builderId)
        .eq('id', webhookId)

      if (error) {
        return { error: error.message }
      }

      return { secret }
    } catch (error: any) {
      return { error: error.message ?? 'Failed to rotate secret' }
    }
  }

  async triggerWebhook(params: {
    event: string
    data: Record<string, any>
    builderId?: string
  }): Promise<void> {
    try {
      let query = this.serviceSupabase
        .from('webhooks')
        .select('*')
        .eq('is_active', true)
        .contains('events', [params.event])

      if (params.builderId) {
        query = query.eq('builder_id', params.builderId)
      }

      const { data: webhooks, error } = await query

      if (error) throw error
      if (!webhooks || webhooks.length === 0) return

      await Promise.allSettled(
        webhooks.map((hook) =>
          this.deliverWebhook({
            webhook: hook as Webhook,
            event: params.event,
            data: params.data,
            attempt_number: 1,
          })
        )
      )
    } catch (error) {
      console.error('[WebhookManager] triggerWebhook error', error)
    }
  }

  async processRetryJobs(limit = 10): Promise<{
    processed: number
    completed: number
    failed: number
    errors: string[]
  }> {
    const summary = { processed: 0, completed: 0, failed: 0, errors: [] as string[] }
    const nowIso = new Date().toISOString()

    try {
      const { data: jobs, error } = await this.serviceSupabase
        .from('job_queue')
        .select('*')
        .eq('job_type', 'retry_webhook')
        .eq('status', 'pending')
        .lte('scheduled_for', nowIso)
        .order('scheduled_for', { ascending: true })
        .limit(limit)

      if (error) throw error
      if (!jobs || jobs.length === 0) return summary

      for (const job of jobs) {
        summary.processed += 1

        const claim = await this.serviceSupabase
          .from('job_queue')
          .update({
            status: 'processing',
            attempts: (job.attempts ?? 0) + 1,
            started_at: new Date().toISOString(),
            error_message: null,
          })
          .eq('id', job.id)
          .eq('status', 'pending')
          .select('payload')
          .single()

        if (claim.error || !claim.data) {
          summary.errors.push(`job ${job.id} already claimed`)
          continue
        }

        const payload = (claim.data.payload as RetryJobPayload | null) ?? null
        if (!payload) {
          await this.markJobFailure(job.id, 'Missing payload')
          summary.failed += 1
          continue
        }

        const { data: webhook, error: webhookError } = await this.serviceSupabase
          .from('webhooks')
          .select('*')
          .eq('id', payload.webhook_id)
          .single()

        if (webhookError || !webhook) {
          await this.markJobFailure(job.id, 'Webhook not found for retry')
          summary.failed += 1
          continue
        }

        const result = await this.deliverWebhook({
          webhook: webhook as Webhook,
          event: payload.event,
          data: payload.data,
          attempt_number: payload.attempt_number,
          delivery_id: payload.delivery_id,
          fromRetryJobId: job.id,
        })

        const finalAttempt =
          payload.attempt_number >= ((webhook as Webhook).retry_count ?? 3)

        await this.serviceSupabase
          .from('job_queue')
          .update({
            status: result.success || !finalAttempt ? 'completed' : 'failed',
            completed_at: new Date().toISOString(),
            error_message: result.success ? null : result.error ?? null,
            result,
          })
          .eq('id', job.id)

        if (result.success) {
          summary.completed += 1
        } else if (finalAttempt) {
          summary.failed += 1
        } else {
          summary.completed += 1
        }
      }
    } catch (error: any) {
      summary.errors.push(error.message ?? 'Unexpected error processing jobs')
    }

    return summary
  }

  private async markJobFailure(jobId: string, message: string) {
    await this.serviceSupabase
      .from('job_queue')
      .update({
        status: 'failed',
        error_message: message,
        completed_at: new Date().toISOString(),
      })
      .eq('id', jobId)
  }

  private async deliverWebhook(params: {
    webhook: Webhook
    event: string
    data: Record<string, any>
    attempt_number?: number
    delivery_id?: string
    fromRetryJobId?: string
  }): Promise<WebhookDeliveryResult> {
    const { webhook, event, data } = params
    const attemptNumber = params.attempt_number ?? 1

    if (webhook.filters && !this.matchesFilters(data, webhook.filters)) {
      return {
        success: true,
        response_time_ms: 0,
      }
    }

    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data,
    }

    const signature = this.generateSignature(payload, webhook.secret_key)
    const timeoutMs = Math.max(1000, (webhook.timeout_seconds ?? 30) * 1000)

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)

    let deliveryId = params.delivery_id
    const started = Date.now()

    try {
      if (deliveryId) {
        const { error } = await this.serviceSupabase
          .from('webhook_deliveries')
          .update({
            event_type: event,
            payload,
            status: 'pending',
            attempt_number: attemptNumber,
            next_retry_at: null,
            error_message: null,
          })
          .eq('id', deliveryId)

        if (error) throw error
      } else {
        const { data: deliveryLog, error: logError } = await this.serviceSupabase
          .from('webhook_deliveries')
          .insert({
            webhook_id: webhook.id,
            event_type: event,
            payload,
            status: 'pending',
            attempt_number: attemptNumber,
          })
          .select('id')
          .single()

        if (logError) throw logError
        deliveryId = deliveryLog.id
      }

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': event,
          'User-Agent': 'Tharaga-Webhooks/1.0',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      })
      clearTimeout(timer)

      const responseTime = Date.now() - started
      const responseBody = await response.text()

      await this.serviceSupabase
        .from('webhook_deliveries')
        .update({
          status: response.ok ? 'success' : 'failed',
          status_code: response.status,
          response_body: responseBody.slice(0, 5000),
          response_time_ms: responseTime,
          error_message: response.ok ? null : `HTTP ${response.status}`,
        })
        .eq('id', deliveryId!)

      await this.updateWebhookStats(webhook.id, response.ok, response.status.toString())

      if (!response.ok && attemptNumber < webhook.retry_count) {
        await this.scheduleRetry({
          webhook,
          event,
          data,
          attempt_number: attemptNumber + 1,
          delivery_id: deliveryId!,
          fromJobId: params.fromRetryJobId,
        })
      }

      return {
        success: response.ok,
        status_code: response.status,
        response_body: responseBody,
        response_time_ms: responseTime,
        error: response.ok ? null : `HTTP ${response.status}`,
      }
    } catch (error: any) {
      clearTimeout(timer)
      const responseTime = Math.max(0, Date.now() - started)

      if (deliveryId) {
        await this.serviceSupabase
          .from('webhook_deliveries')
          .update({
            status: 'failed',
            error_message: error?.message ?? 'Webhook delivery failed',
            response_time_ms: responseTime,
            next_retry_at: attemptNumber < webhook.retry_count ? new Date(Date.now() + 60000).toISOString() : null,
          })
          .eq('id', deliveryId)
      }

      await this.updateWebhookStats(webhook.id, false, 'error')

      if (attemptNumber < webhook.retry_count) {
        await this.scheduleRetry({
          webhook,
          event,
          data,
          attempt_number: attemptNumber + 1,
          delivery_id: deliveryId,
          fromJobId: params.fromRetryJobId,
        })
      }

      return {
        success: false,
        response_time_ms: responseTime || timeoutMs,
        error: error?.message ?? 'Webhook delivery failed',
      }
    }
  }

  private async scheduleRetry(params: {
    webhook: Webhook
    event: string
    data: Record<string, any>
    attempt_number: number
    delivery_id?: string
    fromJobId?: string
  }): Promise<void> {
    const delays = [60, 300, 900]
    const index = Math.max(0, params.attempt_number - 2)
    const delaySeconds = delays[index] ?? 900
    const nextRetryAt = new Date(Date.now() + delaySeconds * 1000)

    if (params.delivery_id) {
      await this.serviceSupabase
        .from('webhook_deliveries')
        .update({
          status: 'retrying',
          next_retry_at: nextRetryAt.toISOString(),
        })
        .eq('id', params.delivery_id)
    }

    const payload: RetryJobPayload = {
      webhook_id: params.webhook.id,
      event: params.event,
      data: params.data,
      attempt_number: params.attempt_number,
      delivery_id: params.delivery_id,
    }

    await this.serviceSupabase.from('job_queue').insert({
      job_type: 'retry_webhook',
      payload,
      scheduled_for: nextRetryAt.toISOString(),
      priority: Math.max(1, 10 - params.attempt_number),
      max_attempts: params.webhook.retry_count,
      result: {
        scheduled_from: params.fromJobId ?? 'direct',
      },
    })
  }

  private async updateWebhookStats(webhookId: string, success: boolean, status: string) {
    const payload = {
      p_webhook_id: webhookId,
      p_success: success,
      p_status: status,
    }

    const { error } = await this.serviceSupabase.rpc('increment_webhook_stats', payload)

    if (error) {
      const { data } = await this.serviceSupabase
        .from('webhooks')
        .select('total_deliveries, successful_deliveries, failed_deliveries')
        .eq('id', webhookId)
        .single()

      const totals = data ?? {
        total_deliveries: 0,
        successful_deliveries: 0,
        failed_deliveries: 0,
      }

      await this.serviceSupabase
        .from('webhooks')
        .update({
          total_deliveries: (totals.total_deliveries ?? 0) + 1,
          successful_deliveries: (totals.successful_deliveries ?? 0) + (success ? 1 : 0),
          failed_deliveries: (totals.failed_deliveries ?? 0) + (success ? 0 : 1),
          last_delivery_at: new Date().toISOString(),
          last_delivery_status: status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', webhookId)
    }
  }

  private matchesFilters(data: Record<string, any>, filters: Record<string, any>): boolean {
    for (const [rawKey, value] of Object.entries(filters)) {
      if (value === undefined || value === null) continue

      if (rawKey.endsWith('_min')) {
        const key = rawKey.replace(/_min$/, '')
        if (typeof data[key] !== 'number' || data[key] < value) return false
        continue
      }

      if (rawKey.endsWith('_max')) {
        const key = rawKey.replace(/_max$/, '')
        if (typeof data[key] !== 'number' || data[key] > value) return false
        continue
      }

      if (Array.isArray(value)) {
        if (!value.includes(data[rawKey])) return false
        continue
      }

      if (data[rawKey] !== value) return false
    }

    return true
  }

  private generateSignature(payload: WebhookPayload, secret: string): string {
    const hmac = createHmac('sha256', secret)
    const serialized = JSON.stringify(payload)
    hmac.update(serialized)
    return `sha256=${hmac.digest('hex')}`
  }

  verifySignature(payload: string, signature: string, secret: string): boolean {
    if (!signature || !secret) return false

    try {
      const parsed = signature.startsWith('sha256=') ? signature : `sha256=${signature}`
      const expected = this.generateSignature(JSON.parse(payload), secret)
      const expectedBuffer = Buffer.from(expected)
      const providedBuffer = Buffer.from(parsed)

      if (expectedBuffer.length !== providedBuffer.length) return false

      return timingSafeEqual(expectedBuffer, providedBuffer)
    } catch {
      return false
    }
  }

  private generateSecretKey(): string {
    return randomBytes(32).toString('hex')
  }

  async getDeliveryHistory(params: {
    webhookId: string
    limit?: number
  }): Promise<{ deliveries: WebhookDeliveryLog[]; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('webhook_deliveries')
        .select('*')
        .eq('webhook_id', params.webhookId)
        .order('created_at', { ascending: false })
        .limit(params.limit ?? 50)

      if (error) {
        return { deliveries: [], error: error.message }
      }

      return { deliveries: (data as WebhookDeliveryLog[]) ?? [] }
    } catch (error: any) {
      return { deliveries: [], error: error.message ?? 'Failed to load deliveries' }
    }
  }

  async testWebhook(webhookId: string): Promise<WebhookDeliveryResult> {
    const { data, error } = await this.serviceSupabase
      .from('webhooks')
      .select('*')
      .eq('id', webhookId)
      .single()

    if (error || !data) {
      return {
        success: false,
        response_time_ms: 0,
        error: error?.message ?? 'Webhook not found',
      }
    }

    const webhook = data as Webhook
    return this.deliverWebhook({
      webhook,
      event: 'webhook.test',
      data: {
        test: true,
        timestamp: new Date().toISOString(),
      },
      attempt_number: 1,
    })
  }
}

export function createWebhookManager(options?: {
  supabase?: GenericSupabaseClient
  serviceClient?: GenericSupabaseClient
}): WebhookManager {
  const supabase = options?.supabase ?? createRouteClient()
  return new WebhookManager(supabase, options?.serviceClient)
}

export function getServiceWebhookManager(): WebhookManager {
  return WebhookManager.withServiceRole()
}

