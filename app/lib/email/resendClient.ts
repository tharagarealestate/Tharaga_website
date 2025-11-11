import type { ReactElement } from 'react'
import { render } from '@react-email/render'
import { Resend } from 'resend'
import { createClient as createRouteClient } from '@/lib/supabase/server'
import {
  createClient as createSupabaseClient,
  type SupabaseClient,
} from '@supabase/supabase-js'
import { LeadNotificationEmail } from '@/lib/email/templates/leadNotificationEmail'
import { WelcomeEmail } from '@/lib/email/templates/welcomeEmail'

type GenericSupabaseClient = SupabaseClient<any, any, any>

interface SendAttemptContext {
  messageId?: string
  attempt: number
  maxAttempts: number
}

export interface EmailOptions {
  to: string | string[]
  subject: string
  html?: string
  text?: string
  react?: ReactElement
  from?: {
    name: string
    email: string
  }
  replyTo?: string
  cc?: string[]
  bcc?: string[]
  attachments?: Array<{
    filename: string
    content: Buffer | string
    mimeType?: string
  }>
  tags?: Record<string, string>
  headers?: Record<string, string>
  builderId?: string
  leadId?: string
  campaignId?: string
  campaignRecipientId?: string
  templateId?: string
  metadata?: Record<string, unknown>
  maxAttempts?: number
}

export interface EmailSendResult {
  success: boolean
  message_id?: string
  error?: string
  delivery_status?: string
}

export interface TemplateSendParams {
  templateId: string
  to: string | string[]
  variables: Record<string, unknown>
  from?: { name: string; email: string }
  builderId?: string
  campaignId?: string
  campaignRecipientId?: string
  leadId?: string
  metadata?: Record<string, unknown>
}

export interface BulkSendParams {
  campaignId?: string
  templateId?: string
  subject?: string
  html?: string
  text?: string
  react?: ReactElement
  builderId?: string
  recipients: Array<{
    email: string
    leadId?: string
    campaignRecipientId?: string
    variables?: Record<string, unknown>
    metadata?: Record<string, unknown>
  }>
}

export interface WelcomeEmailParams {
  to: string
  name?: string
  propertyTitle?: string
  propertyImage?: string
  propertyPrice?: string
  propertyLocation?: string
  viewPropertyUrl?: string
  builderId?: string
  leadId?: string
  builderName?: string
  builderPhone?: string
  builderEmail?: string
  unsubscribeUrl?: string
  siteUrl?: string
  subject?: string
  metadata?: Record<string, unknown>
}

export interface LeadNotificationParams {
  to: string
  builderName?: string
  leadName: string
  leadEmail: string
  leadPhone?: string
  leadScore: number
  leadCategory: string
  propertyTitle: string
  budgetRange?: string
  preferredLocation?: string
  leadUrl: string
  engagementSummary?: string
  builderId?: string
  leadId?: string
  subject?: string
  metadata?: Record<string, unknown>
  tags?: Record<string, string>
  siteUrl?: string
  recommendedActions?: string[]
}

let serviceClientInstance: GenericSupabaseClient | null = null

function getServiceClient(): GenericSupabaseClient {
  if (serviceClientInstance) return serviceClientInstance

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE

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

export class ResendClient {
  private readonly resend: Resend
  private readonly defaultFromEmail: string
  private readonly defaultFromName: string
  private readonly serviceSupabase: GenericSupabaseClient

  constructor(
    private readonly supabase: GenericSupabaseClient,
    serviceClient?: GenericSupabaseClient,
    resendInstance?: Resend,
  ) {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not configured')
    }

    this.resend = resendInstance ?? new Resend(apiKey)
    this.defaultFromEmail =
      process.env.RESEND_FROM_EMAIL || 'noreply@tharaga.co.in'
    this.defaultFromName =
      process.env.RESEND_FROM_NAME || 'Tharaga Real Estate'
    this.serviceSupabase = serviceClient ?? getServiceClient()
  }

  static withRouteClient(resendInstance?: Resend): ResendClient {
    const client = createRouteClient()
    return new ResendClient(client, undefined, resendInstance)
  }

  static withServiceRole(resendInstance?: Resend): ResendClient {
    const service = getServiceClient()
    return new ResendClient(service, service, resendInstance)
  }

  async sendEmail(options: EmailOptions): Promise<EmailSendResult> {
    const attempts = Math.max(1, Math.min(options.maxAttempts ?? 3, 5))
    const toAddresses = this.normalizeEmails(options.to)
    this.validateEmails(toAddresses)

    const payload = this.buildResendPayload({
      ...options,
      to: toAddresses,
    })

    const context: SendAttemptContext = { attempt: 0, maxAttempts: attempts }

    while (context.attempt < attempts) {
      context.attempt += 1
      const result = await this.trySend(payload, options, context)
      if (result.success) return result

      if (context.attempt >= attempts) {
        return result
      }

      const delay = Math.min(30000, 1000 * 2 ** (context.attempt - 1))
      await this.delay(delay)
    }

    return {
      success: false,
      error: 'Email send attempts exhausted',
    }
  }

  async sendTemplateEmail(params: TemplateSendParams): Promise<EmailSendResult> {
    const { data: template, error } = await this.serviceSupabase
      .from('message_templates')
      .select('*')
      .eq('id', params.templateId)
      .eq('type', 'email')
      .eq('is_active', true)
      .maybeSingle()

    if (error || !template) {
      return {
        success: false,
        error: 'Template not found or inactive',
      }
    }

    const subject = this.replaceVariables(template.subject ?? '', params.variables)
    const html = template.html_body
      ? this.replaceVariables(template.html_body, params.variables)
      : undefined
    const text = template.body
      ? this.replaceVariables(template.body, params.variables)
      : undefined

    const result = await this.sendEmail({
      to: params.to,
      subject,
      html,
      text,
      from: params.from,
      builderId: params.builderId,
      leadId: params.leadId,
      campaignId: params.campaignId,
      campaignRecipientId: params.campaignRecipientId,
      templateId: params.templateId,
      metadata: params.metadata,
      tags: {
        template_id: params.templateId,
        template_name: template.name ?? 'unnamed',
      },
    })

    if (result.success) {
      await this.serviceSupabase
        .from('message_templates')
        .update({
          times_used: (template.times_used ?? 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.templateId)
    }

    return result
  }

  async sendBulkEmails(params: BulkSendParams) {
    const summary = {
      total: params.recipients.length,
      successful: 0,
      failed: 0,
      results: [] as EmailSendResult[],
    }

    for (const recipient of params.recipients) {
      let result: EmailSendResult

      if (params.templateId) {
        result = await this.sendTemplateEmail({
          templateId: params.templateId,
          to: recipient.email,
          variables: recipient.variables ?? {},
          builderId: params.builderId,
          campaignId: params.campaignId,
          campaignRecipientId: recipient.campaignRecipientId,
          leadId: recipient.leadId,
          metadata: recipient.metadata,
        })
      } else if (params.subject) {
        result = await this.sendEmail({
          to: recipient.email,
          subject: params.subject,
          html: params.html,
          text: params.text,
          react: params.react,
          builderId: params.builderId,
          campaignId: params.campaignId,
          campaignRecipientId: recipient.campaignRecipientId,
          leadId: recipient.leadId,
          metadata: recipient.metadata,
        })
      } else {
        result = {
          success: false,
          error: 'Missing subject or template for bulk email',
        }
      }

      summary.results.push(result)
      if (result.success) {
        summary.successful += 1
      } else {
        summary.failed += 1
      }

      await this.delay(120)
    }

    return summary
  }

  async sendWelcomeEmail(params: WelcomeEmailParams): Promise<EmailSendResult> {
    const reactEmail = (
      <WelcomeEmail
        name={params.name}
        propertyTitle={params.propertyTitle}
        propertyImage={params.propertyImage}
        propertyPrice={params.propertyPrice}
        propertyLocation={params.propertyLocation}
        viewPropertyUrl={params.viewPropertyUrl}
        builderName={params.builderName}
        builderPhone={params.builderPhone}
        builderEmail={params.builderEmail}
        unsubscribeUrl={params.unsubscribeUrl}
        siteUrl={params.siteUrl}
      />
    )

    const plainText = render(reactEmail, { plainText: true })
    const subject =
      params.subject ??
      `Welcome${params.name ? `, ${params.name.split(' ')[0]}` : ''}!`

    return this.sendEmail({
      to: params.to,
      subject,
      react: reactEmail,
      text: plainText,
      builderId: params.builderId,
      leadId: params.leadId,
      metadata: {
        ...(params.metadata ?? {}),
        template: 'welcome_lead',
        property_title: params.propertyTitle ?? null,
        property_location: params.propertyLocation ?? null,
        property_price: params.propertyPrice ?? null,
      },
    })
  }

  async sendLeadNotificationEmail(
    params: LeadNotificationParams,
  ): Promise<EmailSendResult> {
    const component = (
      <LeadNotificationEmail
        builderName={params.builderName}
        leadName={params.leadName}
        leadEmail={params.leadEmail}
        leadPhone={params.leadPhone}
        leadScore={params.leadScore}
        leadCategory={params.leadCategory}
        propertyTitle={params.propertyTitle}
        budgetRange={params.budgetRange}
        preferredLocation={params.preferredLocation}
        leadUrl={params.leadUrl}
        engagementSummary={params.engagementSummary}
        siteUrl={params.siteUrl}
        recommendedActions={params.recommendedActions}
      />
    )

    const plainText = render(component, { plainText: true })
    const category = params.leadCategory?.toLowerCase?.() ?? 'lead'
    const subject =
      params.subject ??
      `New ${category} lead: ${params.leadName} interested in ${params.propertyTitle}`

    return this.sendEmail({
      to: params.to,
      subject,
      react: component,
      text: plainText,
      builderId: params.builderId,
      leadId: params.leadId,
      metadata: {
        ...(params.metadata ?? {}),
        template: 'builder_lead_notification',
        lead_category: params.leadCategory,
        lead_score: params.leadScore,
        property_title: params.propertyTitle,
      },
      tags: {
        template: 'builder_lead_notification',
        lead_category: category,
        ...(params.tags ?? {}),
      },
    })
  }

  async handleWebhook(event: Record<string, any>): Promise<void> {
    const type = event?.type
    const data = event?.data ?? {}
    if (!type || !data?.email_id) return

    const messageId = data.email_id as string
    const timestamp = new Date().toISOString()

    switch (type) {
      case 'email.sent':
        await this.updateDeliveryStatus(messageId, {
          status: 'sent',
          last_attempt_at: timestamp,
        })
        break
      case 'email.delivered':
        await this.updateDeliveryStatus(messageId, {
          status: 'delivered',
          delivered_at: timestamp,
        })
        break
      case 'email.opened':
        await this.updateDeliveryStatus(messageId, {
          status: 'opened',
          opened_at: timestamp,
        })
        await this.trackRecipientEvent(messageId, 'opened', timestamp)
        break
      case 'email.clicked':
        await this.updateDeliveryStatus(messageId, {
          status: 'clicked',
          clicked_at: timestamp,
          metadata: {
            last_clicked_url: data.click?.link ?? null,
          },
        })
        await this.trackRecipientEvent(messageId, 'clicked', timestamp, {
          url: data.click?.link,
        })
        break
      case 'email.bounced':
        await this.updateDeliveryStatus(messageId, {
          status: 'bounced',
          bounced_at: timestamp,
          error: data.bounce?.message ?? 'Email bounced',
        })
        await this.handleBounce(messageId, data.bounce)
        break
      case 'email.complained':
        await this.updateDeliveryStatus(messageId, {
          status: 'complained',
          complaint_at: timestamp,
          error: 'Recipient reported spam',
        })
        await this.handleComplaint(messageId, 'spam_complaint')
        break
      case 'email.failed':
        await this.updateDeliveryStatus(messageId, {
          status: 'failed',
          error: data.error?.message ?? 'Email send failed',
        })
        break
      default:
        console.info('[ResendClient] Unhandled webhook event', type)
    }
  }

  async processRetryJobs(limit = 15) {
    const summary = {
      processed: 0,
      completed: 0,
      failed: 0,
      errors: [] as string[],
    }

    try {
      const now = new Date().toISOString()
      const { data: jobs, error } = await this.serviceSupabase
        .from('job_queue')
        .select('*')
        .eq('job_type', 'retry_email')
        .eq('status', 'pending')
        .lte('scheduled_for', now)
        .order('scheduled_for', { ascending: true })
        .limit(limit)

      if (error || !jobs?.length) {
        return summary
      }

      for (const job of jobs) {
        summary.processed += 1
        const claim = await this.serviceSupabase
          .from('job_queue')
          .update({
            status: 'processing',
            attempts: (job.attempts ?? 0) + 1,
            started_at: new Date().toISOString(),
          })
          .eq('id', job.id)
          .eq('status', 'pending')
          .select('*')
          .single()

        if (claim.error || !claim.data) {
          summary.errors.push(`Job ${job.id} already claimed`)
          continue
        }

        const payload = job.payload as EmailOptions | null
        if (!payload) {
          await this.markJobFailure(job.id, 'Missing retry payload')
          summary.failed += 1
          continue
        }

        const result = await this.sendEmail({
          ...payload,
          maxAttempts: (payload.maxAttempts ?? 3) - (job.attempts ?? 0),
        })

        if (result.success) {
          summary.completed += 1
          await this.serviceSupabase
            .from('job_queue')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString(),
              result,
            })
            .eq('id', job.id)
        } else {
          summary.failed += 1
          await this.markJobFailure(job.id, result.error ?? 'Retry failed')
        }
      }
    } catch (error: any) {
      summary.errors.push(error?.message ?? 'Unexpected retry error')
    }

    return summary
  }

  private async trySend(
    payload: Record<string, unknown>,
    options: EmailOptions,
    context: SendAttemptContext,
  ): Promise<EmailSendResult> {
    try {
      const { data, error } = await this.resend.emails.send(payload)

      if (error || !data?.id) {
        const failure = error?.message ?? 'Unknown Resend error'
        await this.recordDeliveryFailure(options, context, failure)
        return { success: false, error: failure }
      }

      context.messageId = data.id

      await this.trackDelivery({
        messageId: data.id,
        to: Array.isArray(options.to) ? options.to[0] : options.to,
        subject: options.subject,
        status: 'sent',
        attempt: context.attempt,
        maxRetries: context.maxAttempts,
        builderId: options.builderId,
        leadId: options.leadId,
        campaignId: options.campaignId,
        campaignRecipientId: options.campaignRecipientId,
        templateId: options.templateId,
        metadata: options.metadata,
      })

      if (options.campaignId && options.campaignRecipientId) {
        await this.updateCampaignRecipient({
          campaignId: options.campaignId,
          campaignRecipientId: options.campaignRecipientId,
          status: 'sent',
          messageId: data.id,
        })

        await this.incrementCampaignStat(options.campaignId, 'total_sent')
      }

      return {
        success: true,
        message_id: data.id,
        delivery_status: 'sent',
      }
    } catch (error: any) {
      const failure = error?.message ?? 'Email send failed'
      await this.recordDeliveryFailure(options, context, failure)
      return { success: false, error: failure }
    }
  }

  private buildResendPayload(options: EmailOptions & { to: string[] }) {
    const payload: Record<string, unknown> = {
      from: options.from
        ? `${options.from.name} <${options.from.email}>`
        : `${this.defaultFromName} <${this.defaultFromEmail}>`,
      to: options.to,
      subject: options.subject,
    }

    if (options.react) {
      payload.react = options.react
    } else if (options.html) {
      payload.html = options.html
    }

    if (options.text) {
      payload.text = options.text
    }

    if (options.replyTo) payload.reply_to = options.replyTo
    if (options.cc?.length) payload.cc = options.cc
    if (options.bcc?.length) payload.bcc = options.bcc

    if (options.attachments?.length) {
      payload.attachments = options.attachments.map((attachment) => ({
        filename: attachment.filename,
        content:
          typeof attachment.content === 'string'
            ? attachment.content
            : attachment.content.toString('base64'),
        path: undefined,
        type: attachment.mimeType,
      }))
    }

    if (options.tags) {
      payload.tags = Object.entries(options.tags).map(([name, value]) => ({
        name,
        value: String(value),
      }))
    }

    if (options.headers) {
      payload.headers = options.headers
    }

    return payload
  }

  private async trackDelivery(params: {
    messageId: string
    to: string
    subject: string
    status: string
    attempt: number
    maxRetries: number
    builderId?: string
    leadId?: string
    campaignId?: string
    campaignRecipientId?: string
    templateId?: string
    metadata?: Record<string, unknown>
  }) {
    const record = {
      message_id: params.messageId,
      to_email: params.to,
      subject: params.subject,
      status: params.status,
      retry_count: params.attempt - 1,
      max_retries: params.maxRetries,
      builder_id: params.builderId ?? null,
      lead_id: params.leadId ?? null,
      campaign_id: params.campaignId ?? null,
      template_id: params.templateId ?? null,
      metadata: params.metadata ?? {},
      last_attempt_at: new Date().toISOString(),
      next_retry_at: null,
      error: null,
    }

    await this.serviceSupabase
      .from('email_deliveries')
      .upsert(record, { onConflict: 'message_id' })

    if (params.campaignId && params.campaignRecipientId) {
      await this.serviceSupabase
        .from('email_campaign_recipients')
        .update({
          message_id: params.messageId,
          status: params.status,
          sent_at: new Date().toISOString(),
        })
        .eq('campaign_id', params.campaignId)
        .eq('id', params.campaignRecipientId)
    }

    if (params.builderId && params.leadId) {
      await this.serviceSupabase.from('lead_interactions').insert({
        lead_id: params.leadId,
        builder_id: params.builderId,
        interaction_type: 'email',
        status: 'completed',
        metadata: {
          message_id: params.messageId,
          subject: params.subject,
        },
      })
    }
  }

  private async recordDeliveryFailure(
    options: EmailOptions,
    context: SendAttemptContext,
    errorMessage: string,
  ) {
    const messageId = context.messageId ?? `failed-${Date.now()}`
    const toEmail = Array.isArray(options.to) ? options.to[0] : options.to

    await this.serviceSupabase.from('email_deliveries').upsert(
      {
        message_id: messageId,
        to_email: toEmail,
        subject: options.subject,
        status: context.attempt >= context.maxAttempts ? 'failed' : 'sending',
        error: errorMessage,
        retry_count: context.attempt,
        max_retries: context.maxAttempts,
        builder_id: options.builderId ?? null,
        lead_id: options.leadId ?? null,
        campaign_id: options.campaignId ?? null,
        template_id: options.templateId ?? null,
        metadata: {
          ...(options.metadata ?? {}),
          last_error: errorMessage,
        },
        last_attempt_at: new Date().toISOString(),
        next_retry_at:
          context.attempt < context.maxAttempts
            ? new Date(Date.now() + 60000).toISOString()
            : null,
      },
      { onConflict: 'message_id' },
    )

    if (context.attempt < context.maxAttempts) {
      await this.scheduleRetry(options, context.attempt + 1)
    }
  }

  private async scheduleRetry(options: EmailOptions, attempt: number) {
    const delays = [60, 300, 900]
    const delaySeconds = delays[Math.min(attempt - 2, delays.length - 1)] ?? 900
    const nextRetryAt = new Date(Date.now() + delaySeconds * 1000)

    await this.serviceSupabase.from('job_queue').insert({
      job_type: 'retry_email',
      payload: {
        ...options,
        maxAttempts: options.maxAttempts ?? 3,
      },
      status: 'pending',
      scheduled_for: nextRetryAt.toISOString(),
      priority: Math.max(1, 10 - attempt),
      max_attempts: options.maxAttempts ?? 3,
    })
  }

  private async updateDeliveryStatus(
    messageId: string,
    updates: Record<string, unknown>,
  ) {
    await this.serviceSupabase
      .from('email_deliveries')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('message_id', messageId)

    const { data: recipient } = await this.serviceSupabase
      .from('email_campaign_recipients')
      .select('campaign_id, status, open_count, click_count, id')
      .eq('message_id', messageId)
      .maybeSingle()

    if (!recipient?.campaign_id) return

    const status = updates.status as string | undefined
    if (!status) return

    const campaignId = recipient.campaign_id
    switch (status) {
      case 'delivered':
        await this.incrementCampaignStat(campaignId, 'total_delivered')
        await this.serviceSupabase
          .from('email_campaign_recipients')
          .update({ status, delivered_at: new Date().toISOString() })
          .eq('id', recipient.id)
        break
      case 'opened':
        await this.incrementCampaignStat(campaignId, 'total_opened')
        await this.serviceSupabase
          .from('email_campaign_recipients')
          .update({
            status,
            opened_at: new Date().toISOString(),
            open_count: (recipient.open_count ?? 0) + 1,
          })
          .eq('id', recipient.id)
        break
      case 'clicked':
        await this.incrementCampaignStat(campaignId, 'total_clicked')
        await this.serviceSupabase
          .from('email_campaign_recipients')
          .update({
            status,
            clicked_at: new Date().toISOString(),
            click_count: (recipient.click_count ?? 0) + 1,
          })
          .eq('id', recipient.id)
        break
      case 'bounced':
        await this.incrementCampaignStat(campaignId, 'total_bounced')
        await this.serviceSupabase
          .from('email_campaign_recipients')
          .update({
            status,
            bounce_type: (updates.metadata as any)?.bounce_type ?? null,
            error_message: updates.error ?? null,
          })
          .eq('id', recipient.id)
        break
      case 'complained':
        await this.incrementCampaignStat(campaignId, 'total_complained')
        await this.serviceSupabase
          .from('email_campaign_recipients')
          .update({
            status,
            error_message: updates.error ?? null,
          })
          .eq('id', recipient.id)
        break
      default:
        break
    }
  }

  private async trackRecipientEvent(
    messageId: string,
    event: 'opened' | 'clicked',
    timestamp: string,
    metadata?: Record<string, unknown>,
  ) {
    const { data: recipient } = await this.serviceSupabase
      .from('email_campaign_recipients')
      .select('campaign_id, id, open_count, click_count')
      .eq('message_id', messageId)
      .maybeSingle()

    if (!recipient?.campaign_id) return

    const updates: Record<string, unknown> = { status: event }
    if (event === 'opened') {
      updates.opened_at = timestamp
      updates.open_count = (recipient.open_count ?? 0) + 1
    } else {
      updates.clicked_at = timestamp
      updates.click_count = (recipient.click_count ?? 0) + 1
    }

    if (metadata) {
      updates.metadata = metadata
    }

    await this.serviceSupabase
      .from('email_campaign_recipients')
      .update(updates)
      .eq('id', recipient.id)

    await this.incrementCampaignStat(
      recipient.campaign_id,
      event === 'opened' ? 'total_opened' : 'total_clicked',
    )
  }

  private async handleBounce(
    messageId: string,
    bounce: { type?: string; message?: string } | undefined,
  ) {
    const bounceType = bounce?.type ?? 'unknown'
    const reason = bounce?.message

    await this.serviceSupabase
      .from('email_campaign_recipients')
      .update({
        status: 'bounced',
        bounce_type: bounceType,
        error_message: reason ?? 'Email bounced',
      })
      .eq('message_id', messageId)
  }

  private async handleComplaint(messageId: string, reason: string) {
    await this.serviceSupabase
      .from('email_campaign_recipients')
      .update({
        status: 'complained',
        error_message: reason,
      })
      .eq('message_id', messageId)
  }

  private async updateCampaignRecipient(params: {
    campaignId: string
    campaignRecipientId: string
    status: string
    messageId?: string
  }) {
    const updates: Record<string, unknown> = {
      status: params.status,
    }

    if (params.messageId) {
      updates.message_id = params.messageId
    }

    if (params.status === 'sent') {
      updates.sent_at = new Date().toISOString()
    }

    await this.serviceSupabase
      .from('email_campaign_recipients')
      .update(updates)
      .eq('campaign_id', params.campaignId)
      .eq('id', params.campaignRecipientId)
  }

  private async incrementCampaignStat(
    campaignId: string,
    column: string,
    delta = 1,
  ) {
    try {
      await this.serviceSupabase.rpc('increment_email_campaign_stat', {
        p_campaign_id: campaignId,
        p_column: column,
        p_delta: delta,
      })
    } catch (error) {
      console.error('[ResendClient] Failed to increment campaign stat', error)
    }
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

  private replaceVariables(
    template: string,
    variables: Record<string, unknown>,
  ) {
    return Object.entries(variables).reduce((content, [key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g')
      return content.replace(regex, String(value ?? ''))
    }, template)
  }

  private normalizeEmails(emails: string | string[]) {
    return (Array.isArray(emails) ? emails : [emails]).map((email) =>
      email.trim(),
    )
  }

  private validateEmails(emails: string[]) {
    const regex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/
    for (const email of emails) {
      if (!regex.test(email)) {
        throw new Error(`Invalid email address: ${email}`)
      }
    }
  }

  private delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

export function createResendClient(options?: {
  supabase?: GenericSupabaseClient
  serviceClient?: GenericSupabaseClient
  resendInstance?: Resend
}) {
  const supabase = options?.supabase ?? createRouteClient()
  return new ResendClient(supabase, options?.serviceClient, options?.resendInstance)
}

export function getServiceResendClient(resendInstance?: Resend) {
  return ResendClient.withServiceRole(resendInstance)
}

let cachedServiceResend: ResendClient | null = null

export function getCachedServiceResendClient(resendInstance?: Resend) {
  if (!cachedServiceResend) {
    cachedServiceResend = ResendClient.withServiceRole(resendInstance)
  }
  return cachedServiceResend
}

export const resendClient = getCachedServiceResendClient()

