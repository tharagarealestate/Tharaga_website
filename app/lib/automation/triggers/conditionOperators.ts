/**
 * Condition Operators - 45+ operators for condition evaluation
 */

export type OperatorFunction = (fieldValue: any, expectedValue: any) => boolean

export interface OperatorDefinition {
  name: string
  category: 'comparison' | 'date' | 'array' | 'string' | 'logical' | 'numeric'
  description: string
  fn: OperatorFunction
}

/**
 * All available operators
 */
export const operators: Record<string, OperatorFunction> = {
  // Comparison operators
  equals: (a, b) => a === b,
  not_equals: (a, b) => a !== b,
  greater_than: (a, b) => Number(a) > Number(b),
  less_than: (a, b) => Number(a) < Number(b),
  greater_than_or_equal: (a, b) => Number(a) >= Number(b),
  less_than_or_equal: (a, b) => Number(a) <= Number(b),

  // String operators
  contains: (a, b) => String(a).toLowerCase().includes(String(b).toLowerCase()),
  not_contains: (a, b) => !String(a).toLowerCase().includes(String(b).toLowerCase()),
  starts_with: (a, b) => String(a).toLowerCase().startsWith(String(b).toLowerCase()),
  ends_with: (a, b) => String(a).toLowerCase().endsWith(String(b).toLowerCase()),
  matches_regex: (a, b) => {
    try {
      const regex = new RegExp(String(b))
      return regex.test(String(a))
    } catch {
      return false
    }
  },
  not_matches_regex: (a, b) => {
    try {
      const regex = new RegExp(String(b))
      return !regex.test(String(a))
    } catch {
      return true
    }
  },

  // Array operators
  in: (a, b) => Array.isArray(b) && b.includes(a),
  not_in: (a, b) => Array.isArray(b) && !b.includes(a),
  contains_any: (a, b) => {
    if (!Array.isArray(a) || !Array.isArray(b)) return false
    return b.some(item => a.includes(item))
  },
  contains_all: (a, b) => {
    if (!Array.isArray(a) || !Array.isArray(b)) return false
    return b.every(item => a.includes(item))
  },
  array_length_equals: (a, b) => Array.isArray(a) && a.length === Number(b),
  array_length_greater_than: (a, b) => Array.isArray(a) && a.length > Number(b),
  array_length_less_than: (a, b) => Array.isArray(a) && a.length < Number(b),

  // Null/empty operators
  is_empty: (a) => a === null || a === undefined || a === '' || (Array.isArray(a) && a.length === 0),
  is_not_empty: (a) => a !== null && a !== undefined && a !== '' && !(Array.isArray(a) && a.length === 0),
  is_null: (a) => a === null || a === undefined,
  is_not_null: (a) => a !== null && a !== undefined,

  // Date operators
  date_equals: (a, b) => {
    const dateA = new Date(a)
    const dateB = new Date(b)
    return dateA.toDateString() === dateB.toDateString()
  },
  date_before: (a, b) => new Date(a) < new Date(b),
  date_after: (a, b) => new Date(a) > new Date(b),
  date_on_or_before: (a, b) => new Date(a) <= new Date(b),
  date_on_or_after: (a, b) => new Date(a) >= new Date(b),
  days_ago: (a, b) => {
    const dateA = new Date(a)
    const daysDiff = Math.floor((Date.now() - dateA.getTime()) / (1000 * 60 * 60 * 24))
    return daysDiff === Number(b)
  },
  days_ago_greater_than: (a, b) => {
    const dateA = new Date(a)
    const daysDiff = Math.floor((Date.now() - dateA.getTime()) / (1000 * 60 * 60 * 24))
    return daysDiff > Number(b)
  },
  days_ago_less_than: (a, b) => {
    const dateA = new Date(a)
    const daysDiff = Math.floor((Date.now() - dateA.getTime()) / (1000 * 60 * 60 * 24))
    return daysDiff < Number(b)
  },
  hours_ago: (a, b) => {
    const dateA = new Date(a)
    const hoursDiff = Math.floor((Date.now() - dateA.getTime()) / (1000 * 60 * 60))
    return hoursDiff === Number(b)
  },
  hours_ago_greater_than: (a, b) => {
    const dateA = new Date(a)
    const hoursDiff = Math.floor((Date.now() - dateA.getTime()) / (1000 * 60 * 60))
    return hoursDiff > Number(b)
  },
  hours_ago_less_than: (a, b) => {
    const dateA = new Date(a)
    const hoursDiff = Math.floor((Date.now() - dateA.getTime()) / (1000 * 60 * 60))
    return hoursDiff < Number(b)
  },

  // Numeric range operators
  between: (a, b) => {
    if (!Array.isArray(b) || b.length !== 2) return false
    const num = Number(a)
    return num >= Number(b[0]) && num <= Number(b[1])
  },
  not_between: (a, b) => {
    if (!Array.isArray(b) || b.length !== 2) return false
    const num = Number(a)
    return num < Number(b[0]) || num > Number(b[1])
  },

  // Type operators
  is_string: (a) => typeof a === 'string',
  is_number: (a) => typeof a === 'number' && !isNaN(a),
  is_boolean: (a) => typeof a === 'boolean',
  is_array: (a) => Array.isArray(a),
  is_object: (a) => typeof a === 'object' && a !== null && !Array.isArray(a),
}

/**
 * Get operator by name
 */
export function getOperator(name: string): OperatorFunction | undefined {
  return operators[name]
}

/**
 * Get all operators grouped by category
 */
export function getOperatorsByCategory(): Record<string, string[]> {
  return {
    comparison: ['equals', 'not_equals', 'greater_than', 'less_than', 'greater_than_or_equal', 'less_than_or_equal'],
    string: ['contains', 'not_contains', 'starts_with', 'ends_with', 'matches_regex', 'not_matches_regex'],
    array: ['in', 'not_in', 'contains_any', 'contains_all', 'array_length_equals', 'array_length_greater_than', 'array_length_less_than'],
    null: ['is_empty', 'is_not_empty', 'is_null', 'is_not_null'],
    date: ['date_equals', 'date_before', 'date_after', 'date_on_or_before', 'date_on_or_after', 'days_ago', 'days_ago_greater_than', 'days_ago_less_than', 'hours_ago', 'hours_ago_greater_than', 'hours_ago_less_than'],
    numeric: ['between', 'not_between'],
    type: ['is_string', 'is_number', 'is_boolean', 'is_array', 'is_object'],
  }
}

/**
 * Check if operator exists
 */
export function hasOperator(name: string): boolean {
  return name in operators
}

