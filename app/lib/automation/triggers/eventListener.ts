/**
 * Event Listener - Handles automation trigger events
 */

import { createClient } from '@/lib/supabase/server'
import { triggerEvaluator } from './triggerEvaluator'
import { automationQueue } from '../queue/automationQueue'

export interface TriggerEvent {
  trigger_type: string
  trigger_name: string
  event_source: 'api' | 'system' | 'webhook' | 'manual'
  event_type: 'create' | 'update' | 'delete'
  event_data: Record<string, any>
  lead_id?: string
  builder_id: string
  property_id?: string
}

export class EventListener {
  private supabase = createClient()

  /**
   * Trigger an event and evaluate matching automations
   */
  async triggerEvent(event: TriggerEvent): Promise<void> {
    try {
      // Record the trigger event (try trigger_events first, fallback to automation_trigger_events)
      let triggerEvent: any = null
      let insertError: any = null

      // Try trigger_events table first
      const result1 = await this.supabase
        .from('trigger_events')
        .insert({
          trigger_type: event.trigger_type,
          trigger_name: event.trigger_name,
          event_source: event.event_source,
          event_type: event.event_type,
          event_data: event.event_data,
          lead_id: event.lead_id,
          builder_id: event.builder_id,
          property_id: event.property_id,
        })
        .select()
        .single()

      if (result1.error) {
        // Try automation_trigger_events table as fallback
        const result2 = await this.supabase
          .from('automation_trigger_events')
          .insert({
            trigger_type: event.trigger_type,
            trigger_name: event.trigger_name,
            event_source: event.event_source,
            event_type: event.event_type,
            event_data: event.event_data,
            lead_id: event.lead_id,
            builder_id: event.builder_id,
          })
          .select()
          .single()

        if (result2.error) {
          console.error('Failed to record trigger event:', result2.error)
          insertError = result2.error
        } else {
          triggerEvent = result2.data
        }
      } else {
        triggerEvent = result1.data
      }

      if (insertError || !triggerEvent) {
        console.error('Failed to record trigger event')
        return
      }

      // Find active automations for this builder
      const { data: automations, error: fetchError } = await this.supabase
        .from('automations')
        .select('*')
        .eq('builder_id', event.builder_id)
        .eq('is_active', true)

      if (fetchError || !automations) {
        console.error('Failed to fetch automations:', fetchError)
        return
      }

      // Evaluate each automation
      for (const automation of automations) {
        try {
          const matches = await this.evaluateAutomation(automation, event)
          
          if (matches) {
            // Queue the automation for execution
            await automationQueue.queueAutomation({
              automation_id: automation.id,
              trigger_event_id: triggerEvent.id,
              context: {
                event,
                automation,
              },
              priority: automation.priority || 5,
            })

            // Update trigger event with matched automation (if column exists)
            try {
              // Try trigger_events first
              await this.supabase
                .from('trigger_events')
                .update({
                  matched_automations: [...(triggerEvent.matched_automations || []), automation.id],
                })
                .eq('id', triggerEvent.id)
                .then(({ error }) => {
                  if (error) {
                    // Try automation_trigger_events as fallback
                    return this.supabase
                      .from('automation_trigger_events')
                      .update({
                        matched_automations: [...(triggerEvent.matched_automations || []), automation.id],
                      })
                      .eq('id', triggerEvent.id)
                  }
                })
            } catch (error) {
              // Column might not exist, ignore
            }
          }
        } catch (error) {
          console.error(`Error evaluating automation ${automation.id}:`, error)
        }
      }

      // Update automation statistics
      await this.updateStatistics(event.builder_id)
    } catch (error) {
      console.error('Error in triggerEvent:', error)
      throw error
    }
  }

  /**
   * Evaluate if automation conditions match the event
   */
  private async evaluateAutomation(
    automation: any,
    event: TriggerEvent
  ): Promise<boolean> {
    if (!automation.trigger_conditions) {
      return false
    }

    // Evaluate conditions using TriggerEvaluator
    const result = await triggerEvaluator.evaluate(
      automation.trigger_conditions,
      event.event_data,
      {
        trigger_type: event.trigger_type,
        event_type: event.event_type,
        lead_id: event.lead_id,
        property_id: event.property_id,
      }
    )

    return result.matches
  }

  /**
   * Update automation statistics
   */
  private async updateStatistics(builder_id: string): Promise<void> {
    // This can be done asynchronously or via database triggers
    // For now, we'll just log it
    console.log(`Updated statistics for builder: ${builder_id}`)
  }
}

export const eventListener = new EventListener()

