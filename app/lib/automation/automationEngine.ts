/**
 * Automation Engine - Main automation system orchestrator
 */

import { eventListener } from './triggers/eventListener'
import { automationQueue } from './queue/automationQueue'
import { jobProcessor } from './queue/jobProcessor'
import { triggerEvaluator } from './triggers/triggerEvaluator'
import { actionExecutor } from './actions/actionExecutor'

export interface AutomationEngineOptions {
  enableQueueProcessor?: boolean
  queueProcessorInterval?: number
}

export class AutomationEngine {
  private queueProcessorEnabled: boolean
  private queueProcessorInterval: number

  constructor(options: AutomationEngineOptions = {}) {
    this.queueProcessorEnabled = options.enableQueueProcessor ?? false
    this.queueProcessorInterval = options.queueProcessorInterval ?? 5000
  }

  /**
   * Initialize the automation engine
   */
  async initialize(): Promise<void> {
    if (this.queueProcessorEnabled) {
      jobProcessor.start(this.queueProcessorInterval)
    }
  }

  /**
   * Shutdown the automation engine
   */
  async shutdown(): Promise<void> {
    jobProcessor.stop()
  }

  /**
   * Trigger an event (delegates to eventListener)
   */
  async triggerEvent(event: Parameters<typeof eventListener.triggerEvent>[0]): Promise<void> {
    return eventListener.triggerEvent(event)
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(builderId?: string) {
    return automationQueue.getStats(builderId)
  }

  /**
   * Process queue manually
   */
  async processQueue(): Promise<void> {
    return jobProcessor.processBatch()
  }

  /**
   * Evaluate condition (delegates to triggerEvaluator)
   */
  async evaluateCondition(
    condition: Parameters<typeof triggerEvaluator.evaluate>[0],
    data: Parameters<typeof triggerEvaluator.evaluate>[1],
    context?: Parameters<typeof triggerEvaluator.evaluate>[2]
  ) {
    return triggerEvaluator.evaluate(condition, data, context)
  }

  /**
   * Execute action (delegates to actionExecutor)
   */
  async executeAction(
    action: Parameters<typeof actionExecutor.executeAction>[0],
    context: Parameters<typeof actionExecutor.executeAction>[1]
  ) {
    return actionExecutor.executeAction(action, context)
  }
}

// Export singleton instance
export const automationEngine = new AutomationEngine({
  enableQueueProcessor: false, // Will be enabled via cron job
})





