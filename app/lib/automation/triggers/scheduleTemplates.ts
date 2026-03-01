// =============================================
// SCHEDULE TEMPLATES - Stub Implementation
// =============================================

export type ScheduleCategory = 'marketing' | 'operations' | 'engagement' | 'analytics' | 'notifications';
export type ScheduleType = 'cron' | 'interval' | 'relative';

export interface ScheduleTemplate {
  id: string;
  name: string;
  description: string;
  category: ScheduleCategory;
  schedule_type: ScheduleType;
  cron_expression?: string;
  interval_value?: number;
  interval_unit?: string;
  tags: string[];
  use_case: string;
  recommended_automation: string;
}

export const SCHEDULE_TEMPLATES: ScheduleTemplate[] = [];

export function getTemplatesByCategory(category: ScheduleCategory): ScheduleTemplate[] {
  return SCHEDULE_TEMPLATES.filter(t => t.category === category);
}

export function getTemplatesByScheduleType(scheduleType: ScheduleType): ScheduleTemplate[] {
  return SCHEDULE_TEMPLATES.filter(t => t.schedule_type === scheduleType);
}

export function getTemplatesByTags(tags: string[]): ScheduleTemplate[] {
  return SCHEDULE_TEMPLATES.filter(t =>
    t.tags.some(tag => tags.includes(tag))
  );
}

export function getRecommendedTemplates(useCase: string): ScheduleTemplate[] {
  return SCHEDULE_TEMPLATES.filter(t =>
    t.use_case.toLowerCase().includes(useCase.toLowerCase())
  );
}

export function getCategories(): ScheduleCategory[] {
  return ['marketing', 'operations', 'engagement', 'analytics', 'notifications'];
}

export function getAllTags(): string[] {
  const tags = new Set<string>();
  SCHEDULE_TEMPLATES.forEach(t => t.tags.forEach(tag => tags.add(tag)));
  return Array.from(tags);
}

export function getTemplateById(id: string): ScheduleTemplate | undefined {
  return SCHEDULE_TEMPLATES.find(t => t.id === id);
}
