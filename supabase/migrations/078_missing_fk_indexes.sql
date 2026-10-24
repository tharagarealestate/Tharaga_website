-- ============================================================
-- Migration: 078_missing_fk_indexes.sql
-- Date: 2026-03-05
-- Purpose: Add missing indexes on foreign key columns
--
-- Detected by performance audit: 20 FK columns without indexes.
-- Missing FK indexes cause full sequential scans on JOIN operations
-- which degrade dashboard load, lead analytics, and report queries.
--
-- All indexes use IF NOT EXISTS and are CONCURRENT-safe where possible.
-- ============================================================

-- ─── ai_generated_content ────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_ai_generated_content_approved_by
  ON public.ai_generated_content (approved_by);

-- ─── automation_queue ────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_automation_queue_execution_id
  ON public.automation_queue (execution_id);

-- ─── builder_availability ────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_builder_availability_property_id
  ON public.builder_availability (property_id);

-- ─── builder_subscriptions ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_builder_subscriptions_plan_id
  ON public.builder_subscriptions (plan_id);

-- ─── builder_verifications ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_builder_verifications_rera_registration_id
  ON public.builder_verifications (rera_registration_id);

-- ─── buyer_segments ──────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_buyer_segments_created_by
  ON public.buyer_segments (created_by);

-- ─── campaign_emails ─────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_campaign_emails_property_id
  ON public.campaign_emails (property_id);

-- ─── commission_transactions ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_commission_transactions_property_id
  ON public.commission_transactions (property_id);

-- ─── competitor_analysis ─────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_competitor_analysis_property_id
  ON public.competitor_analysis (property_id);

CREATE INDEX IF NOT EXISTS idx_competitor_analysis_competitor_property_id
  ON public.competitor_analysis (competitor_property_id);

-- ─── content_generation_queue ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_content_generation_queue_property_id
  ON public.content_generation_queue (property_id);

-- ─── content_templates ───────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_content_templates_created_by
  ON public.content_templates (created_by);

-- ─── conversations ────────────────────────────────────────────────────────────
-- conversations.lead_id → leads (important for dashboard lead pipeline)
CREATE INDEX IF NOT EXISTS idx_conversations_lead_id
  ON public.conversations (lead_id);

-- ─── doc_search_analytics ────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_doc_search_analytics_clicked_result_feature_key
  ON public.doc_search_analytics (clicked_result_feature_key);

-- ─── document_permissions ────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_document_permissions_granted_by
  ON public.document_permissions (granted_by);

-- ─── document_share_links ────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_document_share_links_created_by
  ON public.document_share_links (created_by);

CREATE INDEX IF NOT EXISTS idx_document_share_links_document_id
  ON public.document_share_links (document_id);

-- ─── email_deliveries ────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_email_deliveries_template_id
  ON public.email_deliveries (template_id);

-- ─── job_execution_logs ──────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_job_execution_logs_trigger_event_id
  ON public.job_execution_logs (trigger_event_id);

-- ─── job_queue ───────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_job_queue_execution_log_id
  ON public.job_queue (execution_log_id);

-- ─── Additional high-value indexes for dashboard performance ─────────────────
-- These speed up the builder dashboard queries on properties, leads, analytics

-- Properties by builder_id + listing_status (main dashboard query)
CREATE INDEX IF NOT EXISTS idx_properties_builder_id_status
  ON public.properties (builder_id, listing_status);

-- Properties by listed_at (dashboard sort order)
CREATE INDEX IF NOT EXISTS idx_properties_listed_at_desc
  ON public.properties (listed_at DESC);

-- Leads by created_at (pipeline sorting)
CREATE INDEX IF NOT EXISTS idx_leads_created_at_desc
  ON public.leads (created_at DESC);

-- Audit logs by user_id (admin audit trail)
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id
  ON public.audit_logs (user_id);

-- Interactions by created_at (analytics time-series)
CREATE INDEX IF NOT EXISTS idx_interactions_created_at
  ON public.interactions (created_at DESC);

-- ─── Verify ──────────────────────────────────────────────────────────────────
-- Run this to confirm indexes were created:
-- SELECT indexname, tablename FROM pg_indexes
-- WHERE schemaname = 'public' AND indexname LIKE 'idx_%'
-- ORDER BY tablename, indexname;
