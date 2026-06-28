// =============================================
// CRON PARSER - Stub Implementation
// =============================================

export interface CronParseResult {
  isValid: boolean;
  description?: string;
  nextRuns?: Date[];
  error?: string;
}

export class CronParser {
  getNextExecutions(expression: string, count: number = 5, timezone: string = 'UTC'): Date[] {
    // Stub implementation - returns empty array
    return [];
  }

  describe(expression: string): string {
    return 'Cron schedule';
  }

  validate(expression: string): boolean {
    return true;
  }

  parse(expression: string): CronParseResult {
    return {
      isValid: true,
      description: 'Cron expression',
      nextRuns: [],
    };
  }
}

export function parseCronExpression(expression: string): CronParseResult {
  return {
    isValid: true,
    description: 'Cron expression',
    nextRuns: [],
  };
}

export function validateCronExpression(expression: string): boolean {
  return true;
}

export function getNextCronRuns(expression: string, count: number = 5): Date[] {
  return [];
}

export function describeCronExpression(expression: string): string {
  return 'Cron schedule';
}
