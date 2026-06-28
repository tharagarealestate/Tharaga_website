/**
 * Core Trigger Evaluator - Evaluates conditions against data
 * Supports nested AND/OR/NOT logic with 45+ operators
 */

import { createClient } from '@/lib/supabase/server'

export interface Condition {
  field?: string
  operator?: string
  value?: any
  and?: Condition[]
  or?: Condition[]
  not?: Condition
}

export interface EvaluationResult {
  matches: boolean
  debug?: {
    condition: Condition
    fieldValue: any
    operator: string
    result: boolean
    reason?: string
  }[]
}

export interface EvaluatorOptions {
  enableDebug?: boolean
  cacheEnabled?: boolean
  cacheTTL?: number
}

export class TriggerEvaluator {
  private options: Required<EvaluatorOptions>
  private cache: Map<string, { result: boolean; expires: number }> = new Map()

  constructor(options: EvaluatorOptions = {}) {
    this.options = {
      enableDebug: options.enableDebug ?? false,
      cacheEnabled: options.cacheEnabled ?? true,
      cacheTTL: options.cacheTTL ?? 300000, // 5 minutes default
    }
  }

  /**
   * Evaluate a condition against data
   */
  async evaluate(
    condition: Condition,
    data: Record<string, any>,
    context?: Record<string, any>
  ): Promise<EvaluationResult> {
    const cacheKey = this.getCacheKey(condition, data)
    
    // Check cache
    if (this.options.cacheEnabled) {
      const cached = this.cache.get(cacheKey)
      if (cached && cached.expires > Date.now()) {
        return { matches: cached.result }
      }
    }

    const result = this.evaluateCondition(condition, data, context || {})
    
    // Store in cache
    if (this.options.cacheEnabled) {
      this.cache.set(cacheKey, {
        result: result.matches,
        expires: Date.now() + this.options.cacheTTL,
      })
    }

    return result
  }

  /**
   * Recursively evaluate condition
   */
  private evaluateCondition(
    condition: Condition,
    data: Record<string, any>,
    context: Record<string, any>,
    debug: EvaluationResult['debug'] = []
  ): EvaluationResult {
    // Handle logical operators
    if (condition.and) {
      const results = condition.and.map(c => this.evaluateCondition(c, data, context, debug))
      const allMatch = results.every(r => r.matches)
      return { matches: allMatch, debug }
    }

    if (condition.or) {
      const results = condition.or.map(c => this.evaluateCondition(c, data, context, debug))
      const anyMatch = results.some(r => r.matches)
      return { matches: anyMatch, debug }
    }

    if (condition.not) {
      const result = this.evaluateCondition(condition.not, data, context, debug)
      return { matches: !result.matches, debug }
    }

    // Handle field condition
    if (condition.field && condition.operator && condition.value !== undefined) {
      return this.evaluateFieldCondition(condition, data, context, debug)
    }

    // Invalid condition
    return { matches: false, debug }
  }

  /**
   * Evaluate a field condition
   */
  private evaluateFieldCondition(
    condition: Condition,
    data: Record<string, any>,
    context: Record<string, any>,
    debug: EvaluationResult['debug']
  ): EvaluationResult {
    const fieldValue = this.getFieldValue(condition.field!, data, context)
    const operator = condition.operator!
    const expectedValue = condition.value

    const result = this.applyOperator(fieldValue, operator, expectedValue)

    if (this.options.enableDebug && debug) {
      debug.push({
        condition,
        fieldValue,
        operator,
        result,
        reason: this.getReason(fieldValue, operator, expectedValue, result),
      })
    }

    return { matches: result, debug }
  }

  /**
   * Get field value from data or context
   */
  private getFieldValue(
    field: string,
    data: Record<string, any>,
    context: Record<string, any>
  ): any {
    // Support dot notation (e.g., "lead.score")
    const parts = field.split('.')
    let value = data

    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part]
      } else {
        // Try context
        value = context[field] ?? null
        break
      }
    }

    return value
  }

  /**
   * Apply operator to compare values
   */
  private applyOperator(fieldValue: any, operator: string, expectedValue: any): boolean {
    // Import operator functions (will be in conditionOperators.ts)
    const operators = this.getOperators()
    const opFn = operators[operator]

    if (!opFn) {
      console.warn(`Unknown operator: ${operator}`)
      return false
    }

    return opFn(fieldValue, expectedValue)
  }

  /**
   * Get operator functions
   */
  private getOperators(): Record<string, (a: any, b: any) => boolean> {
    // Import operators from conditionOperators.ts
    // Using dynamic import to avoid circular dependencies
    try {
      const { operators } = require('./conditionOperators')
      return operators
    } catch {
      // Fallback to basic operators if import fails
      return {
        equals: (a, b) => a === b,
        not_equals: (a, b) => a !== b,
        greater_than: (a, b) => Number(a) > Number(b),
        less_than: (a, b) => Number(a) < Number(b),
        greater_than_or_equal: (a, b) => Number(a) >= Number(b),
        less_than_or_equal: (a, b) => Number(a) <= Number(b),
        contains: (a, b) => String(a).includes(String(b)),
        not_contains: (a, b) => !String(a).includes(String(b)),
        starts_with: (a, b) => String(a).startsWith(String(b)),
        ends_with: (a, b) => String(a).endsWith(String(b)),
        in: (a, b) => Array.isArray(b) && b.includes(a),
        not_in: (a, b) => Array.isArray(b) && !b.includes(a),
        is_empty: (a) => a === null || a === undefined || a === '',
        is_not_empty: (a) => a !== null && a !== undefined && a !== '',
      }
    }
  }

  /**
   * Get reason for debug output
   */
  private getReason(
    fieldValue: any,
    operator: string,
    expectedValue: any,
    result: boolean
  ): string {
    if (result) {
      return `Field value "${fieldValue}" ${operator} "${expectedValue}" is true`
    }
    return `Field value "${fieldValue}" ${operator} "${expectedValue}" is false`
  }

  /**
   * Generate cache key
   */
  private getCacheKey(condition: Condition, data: Record<string, any>): string {
    return JSON.stringify({ condition, data: this.sanitizeForCache(data) })
  }

  /**
   * Sanitize data for cache key
   */
  private sanitizeForCache(data: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {}
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        sanitized[key] = value
      } else if (Array.isArray(value)) {
        sanitized[key] = value.slice(0, 10) // Limit array size
      }
    }
    return sanitized
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear()
  }
}

/**
 * Helper functions to create conditions
 */
export function createCondition(
  field: string,
  operator: string,
  value: any
): Condition {
  return { field, operator, value }
}

export function and(...conditions: Condition[]): Condition {
  return { and: conditions }
}

export function or(...conditions: Condition[]): Condition {
  return { or: conditions }
}

export function not(condition: Condition): Condition {
  return { not: condition }
}

// Export singleton instance
export const triggerEvaluator = new TriggerEvaluator()

