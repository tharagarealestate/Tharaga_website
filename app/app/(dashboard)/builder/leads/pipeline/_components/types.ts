"use client";

export type PipelineStage =
  | "new"
  | "contacted"
  | "qualified"
  | "site_visit_scheduled"
  | "site_visit_completed"
  | "negotiation"
  | "offer_made"
  | "closed_won"
  | "closed_lost";

export interface StageConfig {
  id: PipelineStage;
  label: string;
  color: string;
  icon: any;
  description: string;
  order: number;
}

export interface PipelineLead {
  id: string;
  lead_id: string;
  builder_id: string;
  stage: PipelineStage;
  stage_order: number;
  entered_stage_at: string;
  days_in_stage: number | null;
  deal_value: number | null;
  expected_close_date: string | null;
  probability: number | null;
  last_activity_at: string | null;
  last_activity_type: string | null;
  next_followup_date: string | null;
  notes: string | null;
  loss_reason: string | null;
  loss_details: string | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  lead_email: string;
  lead_name: string;
  lead_phone: string | null;
  lead_score: number;
  lead_category: string;
  total_views: number;
  last_activity: string | null;
  metadata?: Record<string, any>;
}

export interface StageSnapshot {
  count: number;
  value: number;
  avg_days: number;
}

export interface PipelineStats {
  total_leads: number;
  total_value: number;
  weighted_value: number;
  avg_deal_size: number;
  conversion_rate: number;
  avg_days_to_close: number;
  stages: Record<PipelineStage, StageSnapshot>;
}

