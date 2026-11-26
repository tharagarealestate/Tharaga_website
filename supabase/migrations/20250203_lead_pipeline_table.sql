-- =============================================
-- LEAD PIPELINE TABLE - PRODUCTION READY
-- Migration: 20250203_lead_pipeline_table.sql
-- Purpose: Create lead_pipeline table for kanban-style lead management
-- =============================================

-- =============================================
-- CREATE LEAD PIPELINE TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.lead_pipeline (
  -- Primary Keys
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.lead_scores(id) ON DELETE CASCADE,
  builder_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Stage Management
  stage TEXT NOT NULL CHECK (stage IN (
    'new', 'contacted', 'qualified',
    'site_visit_scheduled', 'site_visit_completed',
    'negotiation', 'offer_made', 'closed_won', 'closed_lost'
  )),
  stage_order INTEGER NOT NULL DEFAULT 1,
  entered_stage_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  days_in_stage INTEGER GENERATED ALWAYS AS (
    EXTRACT(DAY FROM NOW() - entered_stage_at)
  ) STORED,

  -- Stage History (JSONB array)
  stage_history JSONB DEFAULT '[]'::jsonb,

  -- Deal Information
  deal_value NUMERIC(15, 2),
  expected_close_date DATE,
  probability INTEGER CHECK (probability BETWEEN 0 AND 100) DEFAULT 50,
  weighted_value NUMERIC(15, 2) GENERATED ALWAYS AS (
    COALESCE(deal_value, 0) * COALESCE(probability, 0) / 100.0
  ) STORED,

  -- Activity Tracking
  last_activity_at TIMESTAMPTZ,
  last_activity_type TEXT,
  next_followup_date DATE,
  followup_overdue BOOLEAN GENERATED ALWAYS AS (
    next_followup_date < CURRENT_DATE
  ) STORED,

  -- Notes & Context
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  assigned_to UUID REFERENCES auth.users(id),

  -- Win/Loss Analysis
  loss_reason TEXT,
  loss_details TEXT,
  competitor_name TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ,

  -- Constraints
  UNIQUE(lead_id, builder_id),
  CHECK (
    (stage IN ('closed_won', 'closed_lost') AND closed_at IS NOT NULL) OR
    (stage NOT IN ('closed_won', 'closed_lost') AND closed_at IS NULL)
  )
);

-- =============================================
-- CREATE INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_lead_pipeline_builder ON lead_pipeline(builder_id);
CREATE INDEX IF NOT EXISTS idx_lead_pipeline_stage ON lead_pipeline(stage);
CREATE INDEX IF NOT EXISTS idx_lead_pipeline_stage_order ON lead_pipeline(stage_order);
CREATE INDEX IF NOT EXISTS idx_lead_pipeline_followup ON lead_pipeline(next_followup_date)
  WHERE next_followup_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_lead_pipeline_deal_value ON lead_pipeline(deal_value DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_lead_pipeline_entered_stage ON lead_pipeline(entered_stage_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_pipeline_stage_history ON lead_pipeline USING GIN(stage_history);
CREATE INDEX IF NOT EXISTS idx_lead_pipeline_lead_id ON lead_pipeline(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_pipeline_tags ON lead_pipeline USING GIN(tags);

-- =============================================
-- STAGE HISTORY TRACKING TRIGGER
-- =============================================

CREATE OR REPLACE FUNCTION track_stage_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Add previous stage to history
  IF OLD.stage IS DISTINCT FROM NEW.stage THEN
    NEW.stage_history := COALESCE(NEW.stage_history, '[]'::jsonb) ||
      jsonb_build_object(
        'stage', OLD.stage,
        'entered_at', OLD.entered_stage_at,
        'exited_at', NOW(),
        'duration_days', EXTRACT(DAY FROM NOW() - OLD.entered_stage_at),
        'duration_hours', ROUND(EXTRACT(EPOCH FROM NOW() - OLD.entered_stage_at) / 3600.0, 2)
      );

    -- Reset stage entry timestamp
    NEW.entered_stage_at := NOW();

    -- Set closed_at for terminal stages
    IF NEW.stage IN ('closed_won', 'closed_lost') THEN
      NEW.closed_at := NOW();
    END IF;
  END IF;

  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_track_stage_changes
  BEFORE UPDATE ON lead_pipeline
  FOR EACH ROW
  EXECUTE FUNCTION track_stage_changes();

-- =============================================
-- UPDATED_AT TIMESTAMP TRIGGER
-- =============================================

CREATE TRIGGER set_updated_at_lead_pipeline
  BEFORE UPDATE ON lead_pipeline
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

ALTER TABLE lead_pipeline ENABLE ROW LEVEL SECURITY;

-- Builders can only see their own pipeline
CREATE POLICY "Builders can view own pipeline"
  ON lead_pipeline FOR SELECT
  USING (builder_id = auth.uid());

-- Builders can insert leads to their own pipeline
CREATE POLICY "Builders can insert own pipeline"
  ON lead_pipeline FOR INSERT
  WITH CHECK (builder_id = auth.uid());

-- Builders can update their own pipeline
CREATE POLICY "Builders can update own pipeline"
  ON lead_pipeline FOR UPDATE
  USING (builder_id = auth.uid());

-- Builders can delete from their own pipeline
CREATE POLICY "Builders can delete own pipeline"
  ON lead_pipeline FOR DELETE
  USING (builder_id = auth.uid());

-- Admin can see all pipelines
CREATE POLICY "Admin can view all pipelines"
  ON lead_pipeline FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admin can update all pipelines
CREATE POLICY "Admin can update all pipelines"
  ON lead_pipeline FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =============================================
-- PIPELINE VELOCITY METRICS VIEW
-- =============================================

CREATE OR REPLACE VIEW v_pipeline_velocity AS
SELECT
  builder_id,
  stage,
  COUNT(*) as lead_count,
  ROUND(AVG(days_in_stage), 1) as avg_days_in_stage,
  SUM(deal_value) as total_value,
  SUM(weighted_value) as total_weighted_value,
  COUNT(*) FILTER (WHERE followup_overdue = true) as overdue_count
FROM lead_pipeline
WHERE stage NOT IN ('closed_won', 'closed_lost')
GROUP BY builder_id, stage;

-- =============================================
-- CONVERSION FUNNEL ANALYSIS FUNCTION
-- =============================================

CREATE OR REPLACE FUNCTION get_conversion_funnel(
  p_builder_id UUID,
  p_date_range INTERVAL DEFAULT INTERVAL '30 days'
)
RETURNS TABLE(
  stage TEXT,
  count BIGINT,
  conversion_rate NUMERIC,
  avg_time_in_stage NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH stage_stats AS (
    SELECT
      lp.stage,
      COUNT(*) as count,
      AVG(EXTRACT(EPOCH FROM
        COALESCE(lp.closed_at, NOW()) - lp.entered_stage_at
      ) / 86400.0) as avg_days
    FROM lead_pipeline lp
    WHERE lp.builder_id = p_builder_id
      AND lp.created_at >= NOW() - p_date_range
    GROUP BY lp.stage
  )
  SELECT
    ss.stage,
    ss.count,
    ROUND((ss.count::NUMERIC / NULLIF(LAG(ss.count) OVER (ORDER BY
      CASE ss.stage
        WHEN 'new' THEN 1
        WHEN 'contacted' THEN 2
        WHEN 'qualified' THEN 3
        WHEN 'site_visit_scheduled' THEN 4
        WHEN 'site_visit_completed' THEN 5
        WHEN 'negotiation' THEN 6
        WHEN 'offer_made' THEN 7
        WHEN 'closed_won' THEN 8
        WHEN 'closed_lost' THEN 9
      END
    ), 0)) * 100, 2) as conversion_rate,
    ROUND(ss.avg_days, 1) as avg_time_in_stage
  FROM stage_stats ss;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- MIGRATE EXISTING LEAD DATA (if lead_scores table has data)
-- =============================================

INSERT INTO lead_pipeline (
  lead_id,
  builder_id,
  stage,
  stage_order,
  deal_value,
  probability,
  notes,
  created_at,
  updated_at
)
SELECT
  ls.id as lead_id,
  ls.user_id as builder_id,
  'new' as stage,  -- All existing leads start at 'new' stage
  1 as stage_order,
  NULL as deal_value,
  50 as probability,
  CONCAT('Migrated from lead_scores on ', NOW()::date) as notes,
  ls.created_at,
  NOW() as updated_at
FROM lead_scores ls
WHERE NOT EXISTS (
  SELECT 1 FROM lead_pipeline lp
  WHERE lp.lead_id = ls.id AND lp.builder_id = ls.user_id
)
ON CONFLICT (lead_id, builder_id) DO NOTHING;

-- =============================================
-- GRANT PERMISSIONS
-- =============================================

GRANT SELECT, INSERT, UPDATE, DELETE ON lead_pipeline TO authenticated;
GRANT SELECT ON v_pipeline_velocity TO authenticated;
GRANT EXECUTE ON FUNCTION get_conversion_funnel TO authenticated;

-- =============================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================

COMMENT ON TABLE lead_pipeline IS 'Stores lead pipeline stages for kanban-style lead management with drag-and-drop functionality';
COMMENT ON COLUMN lead_pipeline.stage IS 'Current stage of the lead in the pipeline (new, contacted, qualified, etc.)';
COMMENT ON COLUMN lead_pipeline.stage_history IS 'JSONB array tracking all previous stages with timestamps and duration';
COMMENT ON COLUMN lead_pipeline.weighted_value IS 'Computed as deal_value * probability / 100';
COMMENT ON COLUMN lead_pipeline.days_in_stage IS 'Auto-computed number of days since entering current stage';
COMMENT ON COLUMN lead_pipeline.followup_overdue IS 'Auto-computed flag if next_followup_date is in the past';
COMMENT ON FUNCTION track_stage_changes() IS 'Trigger function to automatically track stage transitions in stage_history';
COMMENT ON FUNCTION get_conversion_funnel IS 'Returns conversion funnel analysis for a builder within a date range';
