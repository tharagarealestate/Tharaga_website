/**
 * Condition Tester - Testing utilities for conditions
 */

import { triggerEvaluator } from './triggerEvaluator'
import { Condition } from './triggerEvaluator'
import { validateCondition } from './conditionValidators'

export interface TestResult {
  matches: boolean
  debug?: any[]
  error?: string
}

/**
 * Test condition against sample data
 */
export async function testCondition(
  condition: Condition,
  testData: Record<string, any>
): Promise<TestResult> {
  try {
    // Validate condition first
    const validation = validateCondition(condition)
    if (!validation.valid) {
      return {
        matches: false,
        error: `Invalid condition: ${validation.errors.join(', ')}`,
      }
    }

    // Evaluate condition
    const result = await triggerEvaluator.evaluate(condition, testData, {})

    return {
      matches: result.matches,
      debug: result.debug,
    }
  } catch (error: any) {
    return {
      matches: false,
      error: error.message || 'Unknown error',
    }
  }
}

/**
 * Test condition against multiple test cases
 */
export async function testConditionMultiple(
  condition: Condition,
  testCases: Array<{ data: Record<string, any>; expected: boolean; name?: string }>
): Promise<Array<TestResult & { name?: string; expected: boolean; passed: boolean }>> {
  const results = []

  for (const testCase of testCases) {
    const result = await testCondition(condition, testCase.data)
    results.push({
      ...result,
      name: testCase.name,
      expected: testCase.expected,
      passed: result.matches === testCase.expected,
    })
  }

  return results
}

/**
 * Generate sample test data for a field
 */
export function generateTestData(field: string, value: any): Record<string, any> {
  return {
    [field]: value,
  }
}





