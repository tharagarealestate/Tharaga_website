/**
 * Action Executor - Executes automation actions
 */

import { createClient } from '@/lib/supabase/server'

export interface Action {
  type: 'email' | 'sms' | 'webhook' | 'crm' | 'tag' | 'field_update' | 'assign' | 'delay' | 'notification'
  config: Record<string, any>
}

export interface ExecutionContext {
  automation_id: string
  lead_id?: string
  builder_id: string
  event_data: Record<string, any>
  variables?: Record<string, any>
}

export interface ActionResult {
  success: boolean
  action_type: string
  error?: string
  data?: any
}

export class ActionExecutor {
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
   * Execute a single action
   */
  async executeAction(
    action: Action,
    context: ExecutionContext
  ): Promise<ActionResult> {
    try {
      // Replace variables in action config
      const processedConfig = this.replaceVariables(action.config, context)

      switch (action.type) {
        case 'email':
          return await this.executeEmail(processedConfig, context)
        case 'sms':
          return await this.executeSMS(processedConfig, context)
        case 'webhook':
          return await this.executeWebhook(processedConfig, context)
        case 'crm':
          return await this.executeCRM(processedConfig, context)
        case 'tag':
          return await this.executeTag(processedConfig, context)
        case 'field_update':
          return await this.executeFieldUpdate(processedConfig, context)
        case 'assign':
          return await this.executeAssign(processedConfig, context)
        case 'delay':
          return await this.executeDelay(processedConfig, context)
        case 'notification':
          return await this.executeNotification(processedConfig, context)
        default:
          return {
            success: false,
            action_type: action.type,
            error: `Unknown action type: ${action.type}`,
          }
      }
    } catch (error: any) {
      return {
        success: false,
        action_type: action.type,
        error: error.message || 'Unknown error',
      }
    }
  }

  /**
   * Execute multiple actions
   */
  async executeActions(
    actions: Action[],
    context: ExecutionContext
  ): Promise<ActionResult[]> {
    const results: ActionResult[] = []

    for (const action of actions) {
      const result = await this.executeAction(action, context)
      results.push(result)

      // Stop on failure if configured
      if (!result.success && action.config.stop_on_failure) {
        break
      }
    }

    return results
  }

  /**
   * Replace variables in config ({{variable}})
   */
  private replaceVariables(
    config: Record<string, any>,
    context: ExecutionContext
  ): Record<string, any> {
    const processed: Record<string, any> = {}
    const variables = {
      ...context.variables,
      ...context.event_data,
      lead_id: context.lead_id,
      builder_id: context.builder_id,
    }

    for (const [key, value] of Object.entries(config)) {
      if (typeof value === 'string') {
        processed[key] = value.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
          return variables[varName]?.toString() || match
        })
      } else if (typeof value === 'object' && value !== null) {
        processed[key] = this.replaceVariables(value, context)
      } else {
        processed[key] = value
      }
    }

    return processed
  }

  /**
   * Execute email action
   */
  private async executeEmail(
    config: Record<string, any>,
    context: ExecutionContext
  ): Promise<ActionResult> {
    // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
    console.log('Executing email action:', config)
    return {
      success: true,
      action_type: 'email',
      data: { sent: true },
    }
  }

  /**
   * Execute SMS action
   */
  private async executeSMS(
    config: Record<string, any>,
    context: ExecutionContext
  ): Promise<ActionResult> {
    // TODO: Integrate with SMS service (Twilio, etc.)
    console.log('Executing SMS action:', config)
    return {
      success: true,
      action_type: 'sms',
      data: { sent: true },
    }
  }

  /**
   * Execute webhook action
   */
  private async executeWebhook(
    config: Record<string, any>,
    context: ExecutionContext
  ): Promise<ActionResult> {
    try {
      const response = await fetch(config.url, {
        method: config.method || 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...config.headers,
        },
        body: JSON.stringify(config.payload || context.event_data),
      })

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.statusText}`)
      }

      return {
        success: true,
        action_type: 'webhook',
        data: { status: response.status },
      }
    } catch (error: any) {
      return {
        success: false,
        action_type: 'webhook',
        error: error.message,
      }
    }
  }

  /**
   * Execute CRM action
   */
  private async executeCRM(
    config: Record<string, any>,
    context: ExecutionContext
  ): Promise<ActionResult> {
    // TODO: Integrate with CRM (Zoho, Salesforce, etc.)
    console.log('Executing CRM action:', config)
    return {
      success: true,
      action_type: 'crm',
      data: { synced: true },
    }
  }

  /**
   * Execute tag action
   */
  private async executeTag(
    config: Record<string, any>,
    context: ExecutionContext
  ): Promise<ActionResult> {
    if (!context.lead_id) {
      return {
        success: false,
        action_type: 'tag',
        error: 'lead_id required for tag action',
      }
    }

    // TODO: Update lead tags in database
    console.log('Executing tag action:', config)
    return {
      success: true,
      action_type: 'tag',
      data: { tags: config.tags },
    }
  }

  /**
   * Execute field update action
   */
  private async executeFieldUpdate(
    config: Record<string, any>,
    context: ExecutionContext
  ): Promise<ActionResult> {
    if (!context.lead_id) {
      return {
        success: false,
        action_type: 'field_update',
        error: 'lead_id required for field_update action',
      }
    }

    // TODO: Update lead fields in database
    console.log('Executing field update action:', config)
    return {
      success: true,
      action_type: 'field_update',
      data: { updated: config.fields },
    }
  }

  /**
   * Execute assign action
   */
  private async executeAssign(
    config: Record<string, any>,
    context: ExecutionContext
  ): Promise<ActionResult> {
    // TODO: Assign lead to user/team
    console.log('Executing assign action:', config)
    return {
      success: true,
      action_type: 'assign',
      data: { assigned_to: config.user_id },
    }
  }

  /**
   * Execute delay action
   */
  private async executeDelay(
    config: Record<string, any>,
    context: ExecutionContext
  ): Promise<ActionResult> {
    const delayMs = config.delay_seconds ? config.delay_seconds * 1000 : 0
    await new Promise(resolve => setTimeout(resolve, delayMs))
    return {
      success: true,
      action_type: 'delay',
      data: { delayed: delayMs },
    }
  }

  /**
   * Execute notification action
   */
  private async executeNotification(
    config: Record<string, any>,
    context: ExecutionContext
  ): Promise<ActionResult> {
    // TODO: Send in-app notification
    console.log('Executing notification action:', config)
    return {
      success: true,
      action_type: 'notification',
      data: { notified: true },
    }
  }
}

export const actionExecutor = new ActionExecutor()





