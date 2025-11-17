// =============================================
// SCHEDULE TEMPLATE DETAILS API
// =============================================

import { NextRequest, NextResponse } from 'next/server';
import { getTemplateById, getCategories, getAllTags } from '@/lib/automation/triggers/scheduleTemplates';
import { CronParser } from '@/lib/automation/triggers/cronParser';

export const runtime = 'nodejs';

/**
 * GET /api/schedule-templates/[id]
 * Get template details with preview
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const template = getTemplateById(params.id);

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Add preview of next executions for cron schedules
    let nextExecutions: string[] = [];
    let scheduleDescription: string | null = null;
    let intervalDescription: string | null = null;
    let relativeDescription: string | null = null;

    const cronParser = new CronParser();

    if (template.schedule_type === 'cron' && template.cron_expression) {
      try {
        const next5 = cronParser.getNextExecutions(
          template.cron_expression,
          5,
          'UTC'
        );
        nextExecutions = next5.map(d => d.toISOString());
        scheduleDescription = cronParser.describe(template.cron_expression);
      } catch (error: any) {
        console.error('Error calculating cron preview:', error);
        scheduleDescription = 'Invalid cron expression';
      }
    } else if (template.schedule_type === 'interval' && template.interval_seconds) {
      // Calculate interval description
      const seconds = template.interval_seconds;
      if (seconds < 60) {
        intervalDescription = `Every ${seconds} second${seconds !== 1 ? 's' : ''}`;
      } else if (seconds < 3600) {
        const minutes = Math.floor(seconds / 60);
        intervalDescription = `Every ${minutes} minute${minutes !== 1 ? 's' : ''}`;
      } else if (seconds < 86400) {
        const hours = Math.floor(seconds / 3600);
        intervalDescription = `Every ${hours} hour${hours !== 1 ? 's' : ''}`;
      } else {
        const days = Math.floor(seconds / 86400);
        intervalDescription = `Every ${days} day${days !== 1 ? 's' : ''}`;
      }

      // Calculate next 5 execution times
      const now = Date.now();
      for (let i = 0; i < 5; i++) {
        const nextExecution = new Date(now + (i + 1) * template.interval_seconds * 1000);
        nextExecutions.push(nextExecution.toISOString());
      }
    } else if (template.schedule_type === 'relative' && template.relative_trigger) {
      // Generate relative description
      const { after, field, condition } = template.relative_trigger;
      relativeDescription = `${after} after ${field}`;
      if (condition) {
        relativeDescription += ` (when ${condition})`;
      }
    }

    // Get related templates (same category)
    const { getTemplatesByCategory } = await import('@/lib/automation/triggers/scheduleTemplates');
    const relatedTemplates = getTemplatesByCategory(template.category)
      .filter(t => t.id !== template.id)
      .slice(0, 5); // Limit to 5 related templates

    return NextResponse.json({
      ...template,
      schedule_description: scheduleDescription || intervalDescription || relativeDescription || null,
      preview: {
        next_5_executions: nextExecutions,
        schedule_type_description: scheduleDescription || intervalDescription || relativeDescription || null,
      },
      related_templates: relatedTemplates.map(t => ({
        id: t.id,
        name: t.name,
        description: t.description,
        icon: t.icon,
      })),
      metadata: {
        categories: getCategories(),
        all_tags: getAllTags(),
        template_tags: template.tags,
      },
    });
  } catch (error: any) {
    console.error('Error fetching template:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}









