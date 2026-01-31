// =============================================
// COMPLETE TYPE DEFINITIONS FOR LEAD GENERATION SYSTEM
// =============================================
// Database table types (matching exact schema)

export interface UserBehavior {
  id: string;
  user_id: string;
  behavior_type: 'property_view' | 'search' | 'form_interaction' | 'contact_clicked' | 'phone_clicked' | 'email_clicked' | 'whatsapp_clicked' | 'saved_property' | 'compared_properties' | 'filter_applied';
  property_id: string | null;
  timestamp: string; // ISO timestamp
  duration: number; // seconds
  metadata: Record<string, any>;
  session_id: string | null;
  device_type: 'mobile' | 'tablet' | 'desktop' | null;
  created_at: string;
}

export interface LeadScore {
  id: string;
  user_id: string;
  score: number; // 0-10
  category: 'Hot Lead' | 'Warm Lead' | 'Developing Lead' | 'Cold Lead' | 'Low Quality';
  
  // Score breakdowns
  budget_alignment_score: number;
  engagement_score: number;
  property_fit_score: number;
  time_investment_score: number;
  contact_intent_score: number;
  recency_score: number;
  
  last_calculated: string;
  calculation_count: number;
  score_history: ScoreHistoryEntry[];
  
  created_at: string;
  updated_at: string;
}

export interface ScoreHistoryEntry {
  score: number;
  timestamp: string;
  breakdown: {
    budget: number;
    engagement: number;
    property_fit: number;
    time_investment: number;
    contact_intent: number;
    recency: number;
  };
}

export interface LeadInteraction {
  id: string;
  lead_id: string;
  builder_id: string;
  property_id: string | null;
  interaction_type: 'phone_call' | 'email_sent' | 'whatsapp_message' | 'site_visit_scheduled' | 'site_visit_completed' | 'negotiation_started' | 'offer_made' | 'offer_accepted' | 'offer_rejected' | 'deal_closed' | 'deal_lost';
  
  timestamp: string;
  response_time_minutes: number | null;
  scheduled_for: string | null;
  completed_at: string | null;
  
  status: 'pending' | 'completed' | 'scheduled' | 'cancelled';
  notes: string | null;
  outcome: string | null;
  next_follow_up: string | null;
  
  created_at: string;
  updated_at: string;
}

export interface LeadSource {
  id: string;
  user_id: string;
  source: string;
  medium: string | null;
  campaign: string | null;
  
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  
  referrer_url: string | null;
  landing_page: string;
  gclid: string | null;
  fbclid: string | null;
  
  is_first_touch: boolean;
  attribution_value: number | null;
  
  timestamp: string;
  created_at: string;
}

export interface LeadPipeline {
  id: string;
  lead_id: string;
  builder_id: string;
  property_id: string;
  
  stage: 'new' | 'contacted' | 'qualified' | 'site_visit_scheduled' | 'site_visit_completed' | 'negotiation' | 'offer_made' | 'offer_accepted' | 'documentation' | 'closed_won' | 'closed_lost';
  stage_history: StageHistoryEntry[];
  
  expected_close_date: string | null;
  close_probability: number | null;
  deal_value: number | null;
  commission_value: number | null;
  
  lost_reason: string | null;
  lost_at: string | null;
  competitor_name: string | null;
  
  last_contact_date: string | null;
  contact_count: number;
  days_in_pipeline: number;
  
  created_at: string;
  updated_at: string;
}

export interface StageHistoryEntry {
  stage: string;
  entered_at: string;
  exited_at: string | null;
  duration_hours: number | null;
}

export interface BuilderMetrics {
  id: string;
  builder_id: string;
  
  avg_first_response_minutes: number;
  avg_overall_response_minutes: number;
  fastest_response_minutes: number | null;
  slowest_response_minutes: number | null;
  
  total_leads_received: number;
  total_leads_contacted: number;
  total_leads_qualified: number;
  total_leads_converted: number;
  total_leads_lost: number;
  
  contact_rate: number;
  qualification_rate: number;
  conversion_rate: number;
  overall_conversion_rate: number;
  
  total_revenue: number;
  total_commission: number;
  avg_deal_size: number | null;
  
  avg_follow_ups_per_lead: number;
  avg_days_to_close: number | null;
  
  avg_lead_score_received: number | null;
  avg_lead_score_converted: number | null;
  
  last_calculated: string;
  calculation_period_start: string | null;
  calculation_period_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface MarketingCampaign {
  id: string;
  campaign_name: string;
  utm_campaign: string;
  campaign_type: 'paid_search' | 'paid_social' | 'display' | 'email' | 'organic' | 'referral' | 'partnership' | null;
  platform: 'google_ads' | 'facebook_ads' | 'instagram_ads' | 'linkedin_ads' | 'twitter_ads' | 'email' | 'organic' | 'other' | null;
  
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
  
  budget_total: number;
  budget_daily: number | null;
  spent_total: number;
  
  impressions: number;
  clicks: number;
  leads_generated: number;
  qualified_leads: number;
  conversions: number;
  
  revenue_generated: number;
  commission_earned: number;
  
  ctr: number;
  cpc: number;
  cpl: number;
  cpa: number;
  roi: number;
  roas: number;
  
  target_audience: Record<string, any>;
  target_locations: string[];
  
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface BuyerPreferences {
  id: string;
  user_id: string;
  
  preferred_cities: string[];
  preferred_localities: string[];
  preferred_areas: string[];
  avoid_areas: string[];
  
  budget_min: number;
  budget_max: number;
  budget_flexibility: number;
  payment_type: 'cash' | 'loan' | 'mixed' | null;
  loan_approved: boolean;
  
  property_types: string[];
  bhk_types: string[];
  carpet_area_min: number | null;
  carpet_area_max: number | null;
  
  must_have_amenities: string[];
  preferred_amenities: Record<string, number>;
  
  property_purpose: 'self_use' | 'investment' | 'rental_income' | 'retirement' | 'mixed' | null;
  lifestyle_tags: string[];
  
  office_location: { lat: number; lng: number; address: string } | null;
  max_commute_minutes: number | null;
  commute_modes: string[];
  
  priority_location: number;
  priority_price: number;
  priority_amenities: number;
  priority_builder_reputation: number;
  priority_ready_to_move: number;
  
  construction_status: 'ready_to_move' | 'under_construction' | 'new_launch' | 'any' | null;
  property_age_max_years: number | null;
  floor_preference: string[];
  facing_preference: string[];
  
  last_updated: string;
  preference_completeness: number;
  created_at: string;
}

export interface AIRecommendation {
  id: string;
  user_id: string;
  property_id: string;
  
  match_score: number;
  location_match_score: number;
  price_match_score: number;
  amenities_match_score: number;
  specification_match_score: number;
  lifestyle_match_score: number;
  commute_match_score: number;
  
  match_explanation: string | null;
  match_highlights: string[];
  match_concerns: string[];
  
  recommendation_reason: string | null;
  confidence_level: 'very_high' | 'high' | 'medium' | 'low' | null;
  
  shown_at: string | null;
  shown_count: number;
  clicked: boolean;
  clicked_at: string | null;
  saved: boolean;
  saved_at: string | null;
  contacted_builder: boolean;
  contacted_at: string | null;
  
  user_feedback: 'excellent' | 'good' | 'neutral' | 'poor' | 'not_interested' | null;
  feedback_reason: string | null;
  
  expires_at: string;
  // Note: is_expired is computed at query time, not stored in DB
  // Use: new Date(recommendation.expires_at) < new Date()
  
  created_at: string;
  updated_at: string;
}

// =============================================
// JOINED/ENRICHED TYPES (for API responses)
// =============================================

export interface EnrichedLead extends LeadPipeline {
  lead: {
    id: string;
    email: string;
    phone: string;
    full_name: string;
    location: string;
  };
  property: {
    id: string;
    title: string;
    price: number;
    images: string[];
    location: string;
    bhk_type: string;
  };
  lead_score: LeadScore | null;
  lead_source: LeadSource | null;
  interactions: LeadInteraction[];
}

export interface LeadAnalytics {
  total_leads: number;
  hot_leads: number;
  warm_leads: number;
  developing_leads: number;
  cold_leads: number;
  avg_score: number;
  conversion_rate: number;
  source_breakdown: {
    source: string;
    count: number;
    percentage: number;
  }[];
}

// =============================================
// API REQUEST/RESPONSE TYPES
// =============================================

export interface CalculateScoreRequest {
  user_id: string;
}

export interface CalculateScoreResponse {
  success: boolean;
  score: number;
  category: string;
  breakdown: {
    budget_alignment: number;
    engagement: number;
    property_fit: number;
    time_investment: number;
    contact_intent: number;
    recency: number;
  };
  message?: string;
}

export interface GetLeadsRequest {
  builder_id: string;
  filter?: 'all' | 'hot' | 'warm' | 'developing' | 'cold';
  sort_by?: 'score' | 'recency' | 'value';
  page?: number;
  limit?: number;
  search?: string;
}

export interface GetLeadsResponse {
  success: boolean;
  data: EnrichedLead[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
  analytics: LeadAnalytics;
}

export interface CreateInteractionRequest {
  lead_id: string;
  property_id?: string;
  interaction_type: LeadInteraction['interaction_type'];
  notes?: string;
  scheduled_for?: string;
  outcome?: string;
}

export interface CreateInteractionResponse {
  success: boolean;
  data: LeadInteraction;
  message?: string;
}

// =============================================
// UTILITY TYPES
// =============================================

export type ScoreBadge = {
  emoji: string;
  text: string;
  color: string;
  bgColor: string;
};

export type FilterOption = {
  value: string;
  label: string;
  count?: number;
};

export type SortOption = {
  value: string;
  label: string;
  icon: string;
};

// =============================================
// HELPER FUNCTIONS
// =============================================

/**
 * Check if an AI recommendation has expired
 */
export function isRecommendationExpired(recommendation: AIRecommendation): boolean {
  return new Date(recommendation.expires_at) < new Date();
}

/**
 * Get score badge configuration based on lead score category
 */
export function getScoreBadge(category: LeadScore['category']): ScoreBadge {
  const badges: Record<LeadScore['category'], ScoreBadge> = {
    'Hot Lead': {
      emoji: '🔥',
      text: 'Hot Lead',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    'Warm Lead': {
      emoji: '🌡️',
      text: 'Warm Lead',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    'Developing Lead': {
      emoji: '🌱',
      text: 'Developing',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    'Cold Lead': {
      emoji: '❄️',
      text: 'Cold Lead',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    'Low Quality': {
      emoji: '💤',
      text: 'Low Quality',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
    },
  };
  
  return badges[category];
}

/**
 * Get stage badge configuration based on pipeline stage
 */
export function getStageBadge(stage: LeadPipeline['stage']): { label: string; color: string } {
  const stages: Record<LeadPipeline['stage'], { label: string; color: string }> = {
    'new': { label: 'New', color: 'bg-blue-100 text-blue-800' },
    'contacted': { label: 'Contacted', color: 'bg-purple-100 text-purple-800' },
    'qualified': { label: 'Qualified', color: 'bg-indigo-100 text-indigo-800' },
    'site_visit_scheduled': { label: 'Visit Scheduled', color: 'bg-cyan-100 text-cyan-800' },
    'site_visit_completed': { label: 'Visit Done', color: 'bg-teal-100 text-teal-800' },
    'negotiation': { label: 'Negotiating', color: 'bg-yellow-100 text-yellow-800' },
    'offer_made': { label: 'Offer Made', color: 'bg-orange-100 text-orange-800' },
    'offer_accepted': { label: 'Offer Accepted', color: 'bg-green-100 text-green-800' },
    'documentation': { label: 'Documentation', color: 'bg-emerald-100 text-emerald-800' },
    'closed_won': { label: 'Closed Won', color: 'bg-green-500 text-white' },
    'closed_lost': { label: 'Closed Lost', color: 'bg-red-500 text-white' },
  };
  
  return stages[stage];
}

