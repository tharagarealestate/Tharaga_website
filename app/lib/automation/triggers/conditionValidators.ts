/**
 * Condition Validators - Validate condition structures
 */

import { Condition } from './triggerEvaluator'
import { hasOperator } from './conditionOperators'
import { getField } from './fieldSchemas'

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Validate a condition
 */
export function validateCondition(condition: Condition): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Check for empty condition
  if (!condition.field && !condition.and && !condition.or && !condition.not) {
    errors.push('Condition must have field, and, or, or not')
    return { valid: false, errors, warnings }
  }

  // Validate field condition
  if (condition.field) {
    if (!condition.operator) {
      errors.push('Field condition must have operator')
    } else if (!hasOperator(condition.operator)) {
      errors.push(`Unknown operator: ${condition.operator}`)
    }

    if (condition.value === undefined) {
      errors.push('Field condition must have value')
    }

    // Check if field exists
    const field = getField(condition.field)
    if (!field) {
      warnings.push(`Unknown field: ${condition.field}`)
    } else if (condition.operator) {
      // Check if operator is valid for field type
      const validOperators = field.operators || []
      if (validOperators.length > 0 && !validOperators.includes(condition.operator)) {
        warnings.push(`Operator ${condition.operator} may not be suitable for field ${condition.field}`)
      }
    }
  }

  // Validate nested conditions
  if (condition.and) {
    for (const subCondition of condition.and) {
      const result = validateCondition(subCondition)
      if (!result.valid) {
        errors.push(...result.errors.map(e => `AND condition: ${e}`))
      }
      warnings.push(...result.warnings.map(w => `AND condition: ${w}`))
    }
  }

  if (condition.or) {
    for (const subCondition of condition.or) {
      const result = validateCondition(subCondition)
      if (!result.valid) {
        errors.push(...result.errors.map(e => `OR condition: ${e}`))
      }
      warnings.push(...result.warnings.map(w => `OR condition: ${w}`))
    }
  }

  if (condition.not) {
    const result = validateCondition(condition.not)
    if (!result.valid) {
      errors.push(...result.errors.map(e => `NOT condition: ${e}`))
    }
    warnings.push(...result.warnings.map(w => `NOT condition: ${w}`))
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}







