-- =============================================================================
-- Migration: Fix integrations table + seed sales_team
-- Date: 2026-05-24
-- Purpose:
--   1. Add connected_at column to integrations (zohoClient.ts saveConnection uses it)
--   2. Add unique constraint (builder_id, integration_type, provider) for upsert
--   3. Seed sales_team with Tharaga's core team for lead auto-distribution
-- =============================================================================

-- ── 1. integrations: add missing connected_at column ─────────────────────────
ALTER TABLE public.integrations
  ADD COLUMN IF NOT EXISTS connected_at timestamptz;

-- ── 2. integrations: ensure unique constraint exists for upsert to work ───────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'integrations_builder_integration_provider_unique'
      AND conrelid = 'public.integrations'::regclass
  ) THEN
    ALTER TABLE public.integrations
      ADD CONSTRAINT integrations_builder_integration_provider_unique
      UNIQUE (builder_id, integration_type, provider);
  END IF;
END $$;

-- ── 3. sales_team: seed core Tharaga team for lead auto-distribution ──────────
-- These are the people who will receive lead assignments.
-- Update name/email/phone to reflect your actual team before going live.
INSERT INTO public.sales_team (
  name, email, phone, whatsapp_number,
  is_active, role, status, tier,
  conversion_rate, avg_response_time, leads_handled, leads_converted,
  working_hours_start, working_hours_end, max_daily_leads, current_daily_count,
  count_reset_date
)
VALUES
  -- tier must be one of: senior, exec, junior (per sales_team_tier_check constraint)
  -- role must be one of: admin, senior, junior, channel_partner (sales_role enum)
  (
    'Nithish (Admin)',
    'tharagarealestate@gmail.com',
    '+919876543210',
    '+919876543210',
    true, 'admin', 'active', 'senior',
    0.35, 15, 0, 0,
    9, 21, 20, 0,
    CURRENT_DATE
  ),
  (
    'Sales Executive 1',
    'sales1@tharaga.co.in',
    '+919876543211',
    '+919876543211',
    true, 'junior', 'active', 'junior',
    0.20, 30, 0, 0,
    9, 18, 15, 0,
    CURRENT_DATE
  ),
  (
    'Sales Executive 2',
    'sales2@tharaga.co.in',
    '+919876543212',
    '+919876543212',
    true, 'junior', 'active', 'junior',
    0.20, 30, 0, 0,
    9, 18, 15, 0,
    CURRENT_DATE
  )
ON CONFLICT (email) DO UPDATE SET
  is_active = EXCLUDED.is_active,
  status    = EXCLUDED.status,
  updated_at = now();

-- ── 4. crm_field_mappings: ensure unique constraint for zohoClient upsert ─────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'crm_field_mappings_unique'
      AND conrelid = 'public.crm_field_mappings'::regclass
  ) THEN
    ALTER TABLE public.crm_field_mappings
      ADD CONSTRAINT crm_field_mappings_unique
      UNIQUE (integration_id, tharaga_field, crm_field);
  END IF;
END $$;

-- ── 5. crm_record_mappings: ensure unique constraint for zohoClient upsert ────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'crm_record_mappings_unique'
      AND conrelid = 'public.crm_record_mappings'::regclass
  ) THEN
    ALTER TABLE public.crm_record_mappings
      ADD CONSTRAINT crm_record_mappings_unique
      UNIQUE (integration_id, record_type, tharaga_id);
  END IF;
END $$;
