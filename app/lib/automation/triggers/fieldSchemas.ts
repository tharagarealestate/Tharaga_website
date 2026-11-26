/**
 * Field Schemas - Definitions for all available fields
 */

export interface FieldSchema {
  name: string
  label: string
  type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object'
  category: string
  description?: string
  operators?: string[]
}

export const fieldSchemas: FieldSchema[] = [
  // Lead fields
  {
    name: 'score',
    label: 'Lead Score',
    type: 'number',
    category: 'Lead',
    description: 'AI-calculated lead score (0-10)',
    operators: ['equals', 'greater_than', 'less_than', 'between'],
  },
  {
    name: 'status',
    label: 'Lead Status',
    type: 'string',
    category: 'Lead',
    description: 'Current lead status',
    operators: ['equals', 'not_equals', 'in', 'not_in'],
  },
  {
    name: 'budget',
    label: 'Budget',
    type: 'number',
    category: 'Lead',
    description: 'Lead budget in INR',
    operators: ['equals', 'greater_than', 'less_than', 'between'],
  },
  {
    name: 'email',
    label: 'Email',
    type: 'string',
    category: 'Lead',
    description: 'Lead email address',
    operators: ['equals', 'contains', 'starts_with', 'ends_with'],
  },
  {
    name: 'phone',
    label: 'Phone',
    type: 'string',
    category: 'Lead',
    description: 'Lead phone number',
    operators: ['equals', 'contains', 'starts_with'],
  },
  {
    name: 'created_at',
    label: 'Created At',
    type: 'date',
    category: 'Lead',
    description: 'When the lead was created',
    operators: ['date_equals', 'date_before', 'date_after', 'days_ago', 'hours_ago'],
  },
  {
    name: 'last_contact_date',
    label: 'Last Contact Date',
    type: 'date',
    category: 'Lead',
    description: 'Last time lead was contacted',
    operators: ['date_equals', 'date_before', 'date_after', 'days_ago', 'hours_ago'],
  },
  {
    name: 'contact_count',
    label: 'Contact Count',
    type: 'number',
    category: 'Lead',
    description: 'Number of times lead was contacted',
    operators: ['equals', 'greater_than', 'less_than'],
  },
  {
    name: 'tags',
    label: 'Tags',
    type: 'array',
    category: 'Lead',
    description: 'Lead tags',
    operators: ['contains_any', 'contains_all', 'array_length_equals'],
  },
  {
    name: 'source',
    label: 'Source',
    type: 'string',
    category: 'Lead',
    description: 'Lead source',
    operators: ['equals', 'not_equals', 'in', 'not_in'],
  },
]

/**
 * Get fields by category
 */
export function getFieldsByCategory(): Record<string, FieldSchema[]> {
  const categories: Record<string, FieldSchema[]> = {}
  
  for (const field of fieldSchemas) {
    if (!categories[field.category]) {
      categories[field.category] = []
    }
    categories[field.category].push(field)
  }
  
  return categories
}

/**
 * Get field by name
 */
export function getField(name: string): FieldSchema | undefined {
  return fieldSchemas.find(f => f.name === name)
}

/**
 * Get all field names
 */
export function getAllFieldNames(): string[] {
  return fieldSchemas.map(f => f.name)
}











