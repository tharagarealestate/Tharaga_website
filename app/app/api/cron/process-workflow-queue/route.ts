/**
 * GET /api/cron/process-workflow-queue
 *
 * Drains the workflow_execution_queue table — the only serverless-safe way to
 * run delayed marketing workflows (image processing, landing pages, WhatsApp
 * broadcast, etc.) that the intelligence engine queued.
 *
 * Schedule: every 2 minutes via Netlify scheduled function.
 * netlify.toml: [functions."process-workflow-queue"] schedule = "@every 2m"
 *
 * Algorithm:
 *  1. Claim up to BATCH_SIZE pending jobs whose scheduled_at <= NOW()
 *  2. Mark each as 'processing' (optimistic lock via status update)
 *  3. POST to the workflow's webhook_path on the same origin
 *  4. Mark as 'completed' or increment attempt_count / mark 'failed'
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'

export const maxDuration = 300
export const runtime     = 'nodejs'

const BATCH_SIZE = 10 // max jobs per cron invocation

export async function GET(req: NextRequest) {
  // ── Auth: verify cron secret ──────────────────────────────────────────────
  const cronSecret = process.env.CRON_SECRET
  const authHeader = req.headers.get('authorization')
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db      = getAdminClient()
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tharaga.co.in'
  const intKey  = process.env.INTERNAL_API_KEY    || ''

  // ── Claim pending jobs ────────────────────────────────────────────────────
  const { data: jobs, error: fetchErr } = await db
    .from('workflow_execution_queue')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_at', new Date().toISOString())
    .order('priority', { ascending: true })   // critical first
    .order('scheduled_at', { ascending: true })
    .limit(BATCH_SIZE)

  if (fetchErr) {
    console.error('[WorkflowQueue] Fetch error:', fetchErr)
    return NextResponse.json({ error: fetchErr.message }, { status: 500 })
  }

  if (!jobs || jobs.length === 0) {
    return NextResponse.json({ processed: 0, message: 'No pending jobs' })
  }

  // Mark all fetched jobs as 'processing' atomically
  const jobIds = jobs.map((j: any) => j.id)
  await db
    .from('workflow_execution_queue')
    .update({ status: 'processing', started_at: new Date().toISOString() })
    .in('id', jobIds)
    .eq('status', 'pending')   // guard: only claim still-pending rows

  // ── Execute each job ──────────────────────────────────────────────────────
  const results: { id: string; workflow: string; status: string; error?: string }[] = []

  for (const job of jobs as any[]) {
    const url = `${baseUrl}${job.webhook_path}`

    try {
      const res = await fetch(url, {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${intKey}`,
        },
        body: JSON.stringify(job.payload),
      })

      const responseBody = await res.json().catch(() => ({}))

      if (res.ok) {
        await db
          .from('workflow_execution_queue')
          .update({
            status:        'completed',
            completed_at:  new Date().toISOString(),
            response_body: responseBody,
          })
          .eq('id', job.id)

        results.push({ id: job.id, workflow: job.workflow_name, status: 'completed' })
      } else {
        const newAttempts = (job.attempt_count || 0) + 1
        const newStatus   = newAttempts >= job.max_attempts ? 'failed' : 'pending'
        const scheduledAt = newStatus === 'pending'
          ? new Date(Date.now() + Math.pow(2, newAttempts) * 60_000).toISOString()
          : job.scheduled_at

        await db
          .from('workflow_execution_queue')
          .update({
            status:        newStatus,
            attempt_count: newAttempts,
            scheduled_at:  scheduledAt,
            error_message: `HTTP ${res.status}: ${JSON.stringify(responseBody).slice(0, 300)}`,
            response_body: responseBody,
          })
          .eq('id', job.id)

        results.push({ id: job.id, workflow: job.workflow_name, status: newStatus,
          error: `HTTP ${res.status}` })
      }
    } catch (err: any) {
      const newAttempts = (job.attempt_count || 0) + 1
      const newStatus   = newAttempts >= job.max_attempts ? 'failed' : 'pending'
      const scheduledAt = newStatus === 'pending'
        ? new Date(Date.now() + Math.pow(2, newAttempts) * 60_000).toISOString()
        : job.scheduled_at

      await db
        .from('workflow_execution_queue')
        .update({
          status:        newStatus,
          attempt_count: newAttempts,
          scheduled_at:  scheduledAt,
          error_message: err.message?.slice(0, 300) ?? 'Unknown error',
        })
        .eq('id', job.id)

      results.push({ id: job.id, workflow: job.workflow_name, status: newStatus, error: err.message })
      console.error(`[WorkflowQueue] Job ${job.id} (${job.workflow_name}) failed:`, err.message)
    }
  }

  const completed = results.filter((r) => r.status === 'completed').length
  const failed    = results.filter((r) => r.status === 'failed').length
  const retrying  = results.filter((r) => r.status === 'pending').length

  return NextResponse.json({
    processed: jobs.length,
    completed,
    failed,
    retrying,
    results,
  })
}
