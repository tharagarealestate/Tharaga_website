/**
 * Job Processor - Processes automation queue jobs
 */

import { automationQueue } from './automationQueue'
import { actionExecutor } from '../actions/actionExecutor'
import { createClient } from '@/lib/supabase/server'

export interface ProcessorOptions {
  batchSize?: number
  intervalMs?: number
  maxConcurrent?: number
}

export class JobProcessor {
  private supabase: Awaited<ReturnType<typeof createClient>> | null = null
  private intervalId?: NodeJS.Timeout
  private isProcessing = false
  private options: Required<ProcessorOptions>

  /**
   * Lazy-load Supabase client (must be called during request handling)
   */
  private async getSupabase() {
    if (!this.supabase) {
      this.supabase = await createClient()
    }
    return this.supabase
  }

  constructor(options: ProcessorOptions = {}) {
    this.options = {
      batchSize: options.batchSize || 10,
      intervalMs: options.intervalMs || 5000,
      maxConcurrent: options.maxConcurrent || 5,
    }
  }

  /**
   * Start processing jobs
   */
  start(intervalMs?: number): void {
    if (this.intervalId) {
      console.warn('Job processor already running')
      return
    }

    const interval = intervalMs || this.options.intervalMs
    this.intervalId = setInterval(() => {
      this.processBatch().catch(error => {
        console.error('Error processing batch:', error)
      })
    }, interval)

    console.log(`Job processor started (interval: ${interval}ms)`)
  }

  /**
   * Stop processing jobs
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = undefined
      console.log('Job processor stopped')
    }
  }

  /**
   * Process a batch of jobs
   */
  async processBatch(): Promise<void> {
    if (this.isProcessing) {
      return // Skip if already processing
    }

    this.isProcessing = true

    try {
      const jobs = await automationQueue.getPendingJobs(this.options.batchSize)

      if (jobs.length === 0) {
        return
      }

      console.log(`Processing ${jobs.length} jobs`)

      // Process jobs with concurrency limit
      const chunks = this.chunkArray(jobs, this.options.maxConcurrent)
      
      for (const chunk of chunks) {
        await Promise.all(chunk.map(job => this.processJob(job)))
      }
    } catch (error) {
      console.error('Error in processBatch:', error)
    } finally {
      this.isProcessing = false
    }
  }

  /**
   * Process a single job
   */
  private async processJob(job: any): Promise<void> {
    try {
      // Mark as processing
      await automationQueue.markProcessing(job.id)

      // Get automation
      const { data: automation, error: fetchError } = await (await this.getSupabase())
        .from('automations')
        .select('*')
        .eq('id', job.automation_id)
        .single()

      if (fetchError || !automation) {
        throw new Error(`Automation not found: ${job.automation_id}`)
      }

      // Create execution record
      const { data: execution, error: execError } = await (await this.getSupabase())
        .from('automation_executions')
        .insert({
          automation_id: automation.id,
          trigger_event_id: job.trigger_event_id,
          lead_id: job.context.event?.lead_id,
          status: 'running',
        })
        .select()
        .single()

      if (execError) {
        throw new Error(`Failed to create execution: ${execError.message}`)
      }

      const startTime = Date.now()

      // Execute actions
      const actions = automation.actions || []
      const context = {
        automation_id: automation.id,
        lead_id: job.context.event?.lead_id,
        builder_id: automation.builder_id,
        event_data: job.context.event?.event_data || {},
        variables: job.context.variables || {},
      }

      const results = await actionExecutor.executeActions(actions, context)

      const executionTime = Date.now() - startTime

      // Count successes and failures
      const successful = results.filter(r => r.success).length
      const failed = results.filter(r => !r.success).length

      // Update execution record
      await (await this.getSupabase())
        .from('automation_executions')
        .update({
          status: failed === 0 ? 'success' : 'failed',
          execution_time_ms: executionTime,
          records_processed: 1,
          records_succeeded: successful,
          records_failed: failed,
          output: { results },
          error_message: failed > 0 ? `${failed} actions failed` : null,
          completed_at: new Date().toISOString(),
        })
        .eq('id', execution.id)

      // Update automation statistics
      await this.updateAutomationStats(automation.id, failed === 0)

      // Mark job as completed
      await automationQueue.markCompleted(job.id, execution.id)
    } catch (error: any) {
      console.error(`Error processing job ${job.id}:`, error)
      await automationQueue.markFailed(job.id, error.message || 'Unknown error')
    }
  }

  /**
   * Update automation statistics
   */
  private async updateAutomationStats(automationId: string, success: boolean): Promise<void> {
    await (await this.getSupabase()).rpc('update_automation_stats', {
      p_automation_id: automationId,
      p_success: success,
    }).catch(async () => {
      // Fallback if RPC doesn't exist
      const supabase = await this.getSupabase()
      await supabase
        .from('automations')
        .update({
          total_executions: supabase.raw('total_executions + 1'),
          successful_executions: success
            ? supabase.raw('successful_executions + 1')
            : supabase.raw('successful_executions'),
          failed_executions: success
            ? supabase.raw('failed_executions')
            : supabase.raw('failed_executions + 1'),
          last_execution_at: new Date().toISOString(),
        })
        .eq('id', automationId)
    })
  }

  /**
   * Chunk array for concurrent processing
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size))
    }
    return chunks
  }
}

export const jobProcessor = new JobProcessor()



