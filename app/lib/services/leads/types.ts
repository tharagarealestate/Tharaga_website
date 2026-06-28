// =============================================
// LEAD SERVICE TYPES - Domain Models
// =============================================

import { z } from 'zod';

// =============================================
// VALIDATION SCHEMAS
// =============================================

export const LeadQuerySchema = z.object({
  // Pagination
  page: z.number().int().positive().default(1),
  limit: z.number().int().min(1).max(100).default(20),

  // Filters
  score_min: z.number().min(0).max(10).optional(),
  score_max: z.number().min(0).max(10).optional(),
  category: z.enum(['Hot Lead', 'Warm Lead', 'Developing Lead', 'Cold Lead', 'Low Quality']).optional(),
  budget_min: z.number().positive().optional(),
  budget_max: z.number().positive().optional(),
  location: z.string().optional(),
  property_type: z.string().optional(),
  status: z.enum(['new', 'contacted', 'qualified', 'converted', 'lost']).optional(),

  // Search
  search: z.string().optional(),

  // Sorting
  sort_by: z.enum(['score', 'created_at', 'last_activity', 'budget']).default('score'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),

  // Date filters
  created_after: z.string().datetime().optional(),
  created_before: z.string().datetime().optional(),
  last_active_after: z.string().datetime().optional(),
  last_active_before: z.string().datetime().optional(),

  // Interaction filters
  has_interactions: z.boolean().optional(),
  interaction_type: z.string().optional(),
  no_response: z.boolean().optional(),
});

export const CreateLeadSchema = z.object({
  property_id: z.string().uuid(),
  builder_id: z.string().uuid(),
  name: z.string().min(1).max(255),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  message: z.string().optional(),
  source: z.string().optional(),
  budget: z.number().positive().optional(),
}).refine(
  (data) => data.email || data.phone,
  { message: 'At least one of email or phone must be provided' }
);

export const UpdateLeadSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  message: z.string().optional(),
  status: z.enum(['new', 'contacted', 'qualified', 'converted', 'lost']).optional(),
  score: z.number().min(0).max(10).optional(),
  budget: z.number().positive().optional(),
});

// =============================================
// DOMAIN TYPES
// =============================================

export type LeadQuery = z.infer<typeof LeadQuerySchema>;
export type CreateLeadInput = z.infer<typeof CreateLeadSchema>;
export type UpdateLeadInput = z.infer<typeof UpdateLeadSchema>;

export interface LeadScoreBreakdown {
  budget_alignment: number;
  engagement: number;
  property_fit: number;
  time_investment: number;
  contact_intent: number;
  recency: number;
}

export interface ViewedProperty {
  property_id: string;
  property_title: string;
  view_count: number;
  last_viewed: string;
}

export interface LastInteraction {
  type: string;
  timestamp: string;
  status: string;
}

export interface LeadWithDetails {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  created_at: string;

  // Lead Score
  score: number;
  category: string;
  status: string;
  score_breakdown: LeadScoreBreakdown;

  // User Preferences
  budget_min: number | null;
  budget_max: number | null;
  preferred_location: string | null;
  preferred_property_type: string | null;

  // Activity Summary
  total_views: number;
  total_interactions: number;
  last_activity: string | null;
  days_since_last_activity: number;

  // Properties interested in
  viewed_properties: ViewedProperty[];

  // Interaction status
  last_interaction: LastInteraction | null;
  has_pending_interactions: boolean;

  // Builder info
  builder_id: string;
  property_id: string | null;
}

export interface LeadStats {
  total_leads: number;
  hot_leads: number;
  warm_leads: number;
  developing_leads: number;
  cold_leads: number;
  average_score: number;
  pending_interactions: number;
  no_response_leads: number;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface LeadsListResponse {
  leads: LeadWithDetails[];
  pagination: PaginationInfo;
  stats: LeadStats;
  filters_applied: LeadQuery;
}

// =============================================
// ERROR TYPES
// =============================================

export class LeadServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'LeadServiceError';
  }
}

export class LeadNotFoundError extends LeadServiceError {
  constructor(leadId: string) {
    super(
      `Lead with ID ${leadId} not found`,
      'LEAD_NOT_FOUND',
      404,
      false
    );
    this.name = 'LeadNotFoundError';
  }
}

export class LeadValidationError extends LeadServiceError {
  constructor(message: string, public validationErrors?: any) {
    super(message, 'VALIDATION_ERROR', 400, false);
    this.name = 'LeadValidationError';
  }
}

export class LeadAuthorizationError extends LeadServiceError {
  constructor(message: string = 'Not authorized to access this lead') {
    super(message, 'AUTHORIZATION_ERROR', 403, false);
    this.name = 'LeadAuthorizationError';
  }
}
