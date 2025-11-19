/**
 * Condition Templates - Pre-built condition templates
 */

import { Condition } from './triggerEvaluator'

export interface ConditionTemplate {
  id: string
  name: string
  description: string
  category: string
  condition: Condition
  tags: string[]
}

export const conditionTemplates: ConditionTemplate[] = [
  {
    id: 'hot_lead',
    name: 'Hot Lead',
    description: 'High score lead with active status',
    category: 'Lead Quality',
    condition: {
      and: [
        { field: 'score', operator: 'greater_than', value: 8 },
        { field: 'status', operator: 'equals', value: 'hot' },
      ],
    },
    tags: ['hot', 'priority', 'high-value'],
  },
  {
    id: 'qualified_lead',
    name: 'Qualified Lead',
    description: 'Meets qualification criteria',
    category: 'Lead Quality',
    condition: {
      and: [
        { field: 'score', operator: 'greater_than_or_equal', value: 6 },
        { field: 'budget', operator: 'greater_than', value: 5000000 },
      ],
    },
    tags: ['qualified', 'budget'],
  },
  {
    id: 'inactive_lead',
    name: 'Inactive Lead',
    description: 'No contact for 7 days',
    category: 'Engagement',
    condition: {
      and: [
        { field: 'last_contact_date', operator: 'days_ago_greater_than', value: 7 },
        { field: 'status', operator: 'not_equals', value: 'closed' },
      ],
    },
    tags: ['inactive', 'follow-up'],
  },
  {
    id: 'new_lead',
    name: 'New Lead',
    description: 'Created in last 24 hours',
    category: 'Timing',
    condition: {
      and: [
        { field: 'created_at', operator: 'hours_ago_less_than', value: 24 },
      ],
    },
    tags: ['new', 'recent'],
  },
  {
    id: 'never_contacted',
    name: 'Never Contacted',
    description: 'Lead that has never been contacted',
    category: 'Engagement',
    condition: {
      and: [
        { field: 'contact_count', operator: 'equals', value: 0 },
      ],
    },
    tags: ['new', 'uncontacted'],
  },
  {
    id: 'high_value_lead',
    name: 'High Value Lead',
    description: 'High budget with strong interest',
    category: 'Lead Quality',
    condition: {
      and: [
        { field: 'budget', operator: 'greater_than', value: 10000000 },
        { field: 'score', operator: 'greater_than', value: 7 },
      ],
    },
    tags: ['high-value', 'budget'],
  },
  {
    id: 'ready_to_close',
    name: 'Ready to Close',
    description: 'Strong buying signals',
    category: 'Pipeline',
    condition: {
      and: [
        { field: 'score', operator: 'greater_than', value: 9 },
        { field: 'contact_count', operator: 'greater_than', value: 3 },
      ],
    },
    tags: ['closing', 'priority'],
  },
]

/**
 * Get templates by category
 */
export function getTemplatesByCategory(): Record<string, ConditionTemplate[]> {
  const categories: Record<string, ConditionTemplate[]> = {}
  
  for (const template of conditionTemplates) {
    if (!categories[template.category]) {
      categories[template.category] = []
    }
    categories[template.category].push(template)
  }
  
  return categories
}

/**
 * Get template by ID
 */
export function getTemplate(id: string): ConditionTemplate | undefined {
  return conditionTemplates.find(t => t.id === id)
}

/**
 * Search templates
 */
export function searchTemplates(query: string): ConditionTemplate[] {
  const lowerQuery = query.toLowerCase()
  return conditionTemplates.filter(
    t =>
      t.name.toLowerCase().includes(lowerQuery) ||
      t.description.toLowerCase().includes(lowerQuery) ||
      t.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  )
}











