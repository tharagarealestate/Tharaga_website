/**
 * Automation Queue - Manages automation job queue
 */

import { createClient } from '@/lib/supabase/server'

export interface QueueJob {
  automation_id: string
  trigger_event_id?: string
  context: Record<string, any>
  priority?: number
  scheduled_for?: Date
}

export interface QueueItem {
  id: string
  automation_id: string
  trigger_event_id?: string
  context: Record<string, any>
  priority: number
  scheduled_for: Date
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  attempts: number
  max_attempts: number
  last_error?: string
  started_at?: Date
  completed_at?: Date
  execution_id?: string
  created_at: Date
}

export class AutomationQueue {
  private supabase: Awaited<ReturnType<typeof createClient>> | null = null

  /**
   * Lazy-load Supabase client (must be called during request handling)
   */
  private async getSupabase() {
    if (!this.supabase) {
      this.supabase = await createClient()
    }
    return this.supabase
  }

  /**
   * Queue an automation for execution
   */
  async queueAutomation(job: QueueJob): Promise<string> {
    const { data, error } = await (await this.getSupabase())
      .from('automation_queue')
      .insert({
        automation_id: job.automation_id,
        trigger_event_id: job.trigger_event_id,
        context: job.context,
        priority: job.priority || 5,
        scheduled_for: job.scheduled_for?.toISOString() || new Date().toISOString(),
        status: 'pending',
        attempts: 0,
        max_attempts: 3,
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to queue automation: ${error.message}`)
    }

    return data.id
  }

  /**
   * Get pending jobs
   */
  async getPendingJobs(limit: number = 10): Promise<QueueItem[]> {
    const { data, error } = await (await this.getSupabase())
      .from('automation_queue')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())
      .order('priority', { ascending: false })
      .order('scheduled_for', { ascending: true })
      .limit(limit)

    if (error) {
      throw new Error(`Failed to get pending jobs: ${error.message}`)
    }

    return (data || []).map(this.mapQueueItem)
  }

  /**
   * Mark job as processing
   */
  async markProcessing(jobId: string): Promise<void> {
    const { error } = await (await this.getSupabase())
      .from('automation_queue')
      .update({
        status: 'processing',
        started_at: new Date().toISOString(),
        attempts: (await this.getSupabase()).raw('attempts + 1'),
      })
      .eq('id', jobId)

    if (error) {
      throw new Error(`Failed to mark job as processing: ${error.message}`)
    }
  }

  /**
   * Mark job as completed
   */
  async markCompleted(jobId: string, executionId?: string): Promise<void> {
    const { error } = await (await this.getSupabase())
      .from('automation_queue')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        execution_id: executionId,
      })
      .eq('id', jobId)

    if (error) {
      throw new Error(`Failed to mark job as completed: ${error.message}`)
    }
  }

  /**
   * Mark job as failed
   */
  async markFailed(jobId: string, errorMessage: string): Promise<void> {
    const { data: job } = await (await this.getSupabase())
      .from('automation_queue')
      .select('attempts, max_attempts')
      .eq('id', jobId)
      .single()

    if (!job) {
      throw new Error('Job not found')
    }

    const shouldRetry = job.attempts < job.max_attempts

    const { error } = await (await this.getSupabase())
      .from('automation_queue')
      .update({
        status: shouldRetry ? 'pending' : 'failed',
        last_error: errorMessage,
        completed_at: shouldRetry ? null : new Date().toISOString(),
        scheduled_for: shouldRetry
          ? new Date(Date.now() + 60000).toISOString() // Retry after 1 minute
          : undefined,
      })
      .eq('id', jobId)

    if (error) {
      throw new Error(`Failed to mark job as failed: ${error.message}`)
    }
  }

  /**
   * Get queue statistics
   */
  async getStats(builder_id?: string): Promise<{
    pending: number
    processing: number
    completed: number
    failed: number
  }> {
    const stats = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
    }

    if (builder_id) {
      // Get automation IDs for this builder
      const { data: automations } = await (await this.getSupabase())
        .from('automations')
        .select('id')
        .eq('builder_id', builder_id)

      const automationIds = automations?.map(a => a.id) || []

      if (automationIds.length === 0) {
        return stats
      }

      // Get queue stats for these automations
      for (const status of ['pending', 'processing', 'completed', 'failed'] as const) {
        const { count } = await (await this.getSupabase())
          .from('automation_queue')
          .select('*', { count: 'exact', head: true })
          .eq('status', status)
          .in('automation_id', automationIds)

        stats[status] = count || 0
      }
    } else {
      // Get all queue stats
      for (const status of ['pending', 'processing', 'completed', 'failed'] as const) {
        const { count } = await (await this.getSupabase())
          .from('automation_queue')
          .select('*', { count: 'exact', head: true })
          .eq('status', status)

        stats[status] = count || 0
      }
    }

    return stats
  }

  /**
   * Map database row to QueueItem
   */
  private mapQueueItem(row: any): QueueItem {
    return {
      id: row.id,
      automation_id: row.automation_id,
      trigger_event_id: row.trigger_event_id,
      context: row.context || {},
      priority: row.priority || 5,
      scheduled_for: new Date(row.scheduled_for),
      status: row.status,
      attempts: row.attempts || 0,
      max_attempts: row.max_attempts || 3,
      last_error: row.last_error,
      started_at: row.started_at ? new Date(row.started_at) : undefined,
      completed_at: row.completed_at ? new Date(row.completed_at) : undefined,
      execution_id: row.execution_id,
      created_at: new Date(row.created_at),
    }
  }
}

export const automationQueue = new AutomationQueue()

