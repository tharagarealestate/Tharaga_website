/**
 * Expression Parser - Parse string expressions for conditions
 */

export interface ParsedExpression {
  field: string
  operator: string
  value: any
}

/**
 * Parse expression string like "score > 80" or "status == 'hot'"
 */
export function parseExpression(expression: string): ParsedExpression | null {
  try {
    // Remove whitespace
    expression = expression.trim()

    // Pattern: field operator value
    // Operators: ==, !=, >, <, >=, <=, contains, in, etc.
    
    // Try different patterns
    const patterns = [
      // Comparison operators
      /^(\w+)\s*(==|!=|>|<|>=|<=)\s*(.+)$/,
      // Contains
      /^(\w+)\s+contains\s+(.+)$/i,
      // In array
      /^(\w+)\s+in\s+\[(.+)\]$/i,
      // Is empty/not empty
      /^(\w+)\s+is\s+(empty|not\s+empty)$/i,
    ]

    for (const pattern of patterns) {
      const match = expression.match(pattern)
      if (match) {
        const field = match[1]
        let operator = match[2]?.toLowerCase()
        let value: any = match[3]

        // Normalize operators
        if (operator === '==') operator = 'equals'
        if (operator === '!=') operator = 'not_equals'
        if (operator === '>') operator = 'greater_than'
        if (operator === '<') operator = 'less_than'
        if (operator === '>=') operator = 'greater_than_or_equal'
        if (operator === '<=') operator = 'less_than_or_equal'

        // Parse value
        if (value) {
          // Try to parse as number
          if (/^\d+$/.test(value.trim())) {
            value = Number(value.trim())
          }
          // Try to parse as boolean
          else if (value.trim().toLowerCase() === 'true') {
            value = true
          }
          else if (value.trim().toLowerCase() === 'false') {
            value = false
          }
          // Remove quotes from strings
          else if ((value.startsWith('"') && value.endsWith('"')) ||
                   (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1)
          }
          // Parse array
          else if (value.includes(',')) {
            value = value.split(',').map(v => v.trim())
          }
        }

        return { field, operator, value }
      }
    }

    return null
  } catch (error) {
    console.error('Error parsing expression:', error)
    return null
  }
}

/**
 * Convert parsed expression to condition object
 */
export function expressionToCondition(expression: string): any {
  const parsed = parseExpression(expression)
  if (!parsed) {
    return null
  }

  return {
    field: parsed.field,
    operator: parsed.operator,
    value: parsed.value,
  }
}

/**
 * Convert multiple expressions to condition group
 */
export function expressionsToConditionGroup(
  expressions: string[],
  logic: 'and' | 'or' = 'and'
): any {
  const conditions = expressions
    .map(expressionToCondition)
    .filter(c => c !== null)

  if (conditions.length === 0) {
    return null
  }

  if (conditions.length === 1) {
    return conditions[0]
  }

  return { [logic]: conditions }
}

