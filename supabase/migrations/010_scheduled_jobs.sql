-- =============================================
-- SCHEDULED JOBS TABLE
-- Stores all scheduled automation jobs
-- =============================================
CREATE TABLE IF NOT EXISTS scheduled_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Job identification
  name TEXT NOT NULL,
  description TEXT,
  job_type TEXT NOT NULL, -- 'automation', 'report', 'cleanup', 'sync'
  
  -- Schedule configuration
  schedule_type TEXT NOT NULL, -- 'cron', 'interval', 'one_time', 'relative'
  cron_expression TEXT, -- For cron-based schedules
  interval_seconds INTEGER, -- For interval-based schedules
  timezone TEXT DEFAULT 'UTC',
  
  -- Relative schedule (e.g., "7 days after last_activity")
  relative_trigger JSONB, -- { "after": "7 days", "field": "last_activity", "condition": "no_activity" }
  
  -- Execution configuration
  automation_id UUID REFERENCES automations(id) ON DELETE CASCADE,
  trigger_conditions JSONB, -- Additional conditions to check
  execution_context JSONB, -- Data to pass to automation
  
  -- Priority and limits
  priority INTEGER DEFAULT 5, -- 1 (highest) to 10 (lowest)
  max_executions INTEGER, -- Null = unlimited
  max_concurrent INTEGER DEFAULT 1,
  execution_timeout_seconds INTEGER DEFAULT 300,
  
  -- Schedule state
  is_active BOOLEAN DEFAULT true,
  is_paused BOOLEAN DEFAULT false,
  
  -- Execution tracking
  next_execution_at TIMESTAMPTZ,
  last_execution_at TIMESTAMPTZ,
  last_execution_status TEXT, -- 'success', 'failed', 'timeout', 'skipped'
  last_execution_error TEXT,
  
  -- Statistics
  total_executions INTEGER DEFAULT 0,
  successful_executions INTEGER DEFAULT 0,
  failed_executions INTEGER DEFAULT 0,
  average_execution_time_ms INTEGER,
  
  -- Context
  builder_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id),
  
  -- Metadata
  tags TEXT[],
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- JOB EXECUTION LOGS TABLE
-- Detailed logs of each job execution
-- =============================================
CREATE TABLE IF NOT EXISTS job_execution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES scheduled_jobs(id) ON DELETE CASCADE,
  
  -- Execution details
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  execution_time_ms INTEGER,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'running', -- 'running', 'success', 'failed', 'timeout', 'cancelled'
  
  -- Results
  records_processed INTEGER DEFAULT 0,
  records_succeeded INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  
  -- Automation execution
  trigger_event_id UUID REFERENCES automation_trigger_events(id),
  automation_executions INTEGER DEFAULT 0,
  
  -- Error handling
  error_message TEXT,
  error_stack TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Output
  output JSONB, -- Results/data from execution
  logs TEXT[], -- Array of log messages
  
  -- Metadata
  execution_context JSONB,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- UPDATE EXISTING JOB_QUEUE TABLE
-- Add missing columns if they don't exist
-- Note: job_queue table may already exist with different structure
-- =============================================
DO $$ 
BEGIN
  -- Add job_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'job_queue' 
    AND column_name = 'job_id'
  ) THEN
    ALTER TABLE job_queue ADD COLUMN job_id UUID REFERENCES scheduled_jobs(id) ON DELETE CASCADE;
  END IF;
  
  -- Add execution_log_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'job_queue' 
    AND column_name = 'execution_log_id'
  ) THEN
    ALTER TABLE job_queue ADD COLUMN execution_log_id UUID REFERENCES job_execution_logs(id);
  END IF;
  
  -- Add next_retry_at if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'job_queue' 
    AND column_name = 'next_retry_at'
  ) THEN
    ALTER TABLE job_queue ADD COLUMN next_retry_at TIMESTAMPTZ;
  END IF;
  
  -- Add execution_context if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'job_queue' 
    AND column_name = 'execution_context'
  ) THEN
    ALTER TABLE job_queue ADD COLUMN execution_context JSONB;
  END IF;
  
  -- Add last_error if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'job_queue' 
    AND column_name = 'last_error'
  ) THEN
    ALTER TABLE job_queue ADD COLUMN last_error TEXT;
  END IF;
  
  -- Add updated_at if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'job_queue' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE job_queue ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- =============================================
-- INDEXES
-- =============================================
-- Scheduled jobs indexes
CREATE INDEX IF NOT EXISTS idx_scheduled_jobs_active ON scheduled_jobs(is_active, is_paused);
CREATE INDEX IF NOT EXISTS idx_scheduled_jobs_next_execution ON scheduled_jobs(next_execution_at) 
  WHERE is_active = true AND is_paused = false;
CREATE INDEX IF NOT EXISTS idx_scheduled_jobs_builder ON scheduled_jobs(builder_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_jobs_automation ON scheduled_jobs(automation_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_jobs_type ON scheduled_jobs(job_type);

-- Job execution logs indexes
CREATE INDEX IF NOT EXISTS idx_job_logs_job ON job_execution_logs(job_id);
CREATE INDEX IF NOT EXISTS idx_job_logs_status ON job_execution_logs(status);
CREATE INDEX IF NOT EXISTS idx_job_logs_started ON job_execution_logs(started_at DESC);

-- Job queue indexes (only create if job_id column exists)
CREATE INDEX IF NOT EXISTS idx_job_queue_pending ON job_queue(status, scheduled_for, priority) 
  WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_job_queue_job ON job_queue(job_id) WHERE job_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_job_queue_retry ON job_queue(next_retry_at) 
  WHERE status = 'failed' AND next_retry_at IS NOT NULL;

-- =============================================
-- FUNCTIONS
-- =============================================
-- Calculate next execution time for cron jobs
CREATE OR REPLACE FUNCTION calculate_next_execution(
  p_cron_expression TEXT,
  p_timezone TEXT,
  p_from_time TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TIMESTAMPTZ AS $$
DECLARE
  v_next_time TIMESTAMPTZ;
BEGIN
  -- This is a simplified implementation
  -- In production, use a proper cron parser library
  
  -- For now, return next hour as placeholder
  -- TODO: Implement proper cron parsing
  v_next_time := date_trunc('hour', p_from_time) + INTERVAL '1 hour';
  
  RETURN v_next_time;
END;
$$ LANGUAGE plpgsql;

-- Update job statistics after execution
CREATE OR REPLACE FUNCTION update_job_statistics()
RETURNS TRIGGER AS $$
DECLARE
  v_current_total INTEGER;
  v_current_avg INTEGER;
BEGIN
  -- Get current values
  SELECT total_executions, average_execution_time_ms
  INTO v_current_total, v_current_avg
  FROM scheduled_jobs
  WHERE id = NEW.job_id;
  
  IF NEW.status = 'success' AND (OLD.status IS NULL OR OLD.status != 'success') THEN
    UPDATE scheduled_jobs
    SET 
      total_executions = COALESCE(v_current_total, 0) + 1,
      successful_executions = successful_executions + 1,
      last_execution_at = NEW.completed_at,
      last_execution_status = 'success',
      last_execution_error = NULL,
      average_execution_time_ms = CASE
        WHEN NEW.execution_time_ms IS NOT NULL THEN
          CASE
            WHEN v_current_avg IS NULL THEN NEW.execution_time_ms
            ELSE ((COALESCE(v_current_avg, 0) * COALESCE(v_current_total, 0) + NEW.execution_time_ms) / (COALESCE(v_current_total, 0) + 1))
          END
        ELSE v_current_avg
      END
    WHERE id = NEW.job_id;
    
  ELSIF NEW.status = 'failed' AND (OLD.status IS NULL OR OLD.status != 'failed') THEN
    UPDATE scheduled_jobs
    SET 
      total_executions = COALESCE(v_current_total, 0) + 1,
      failed_executions = failed_executions + 1,
      last_execution_at = NEW.completed_at,
      last_execution_status = 'failed',
      last_execution_error = NEW.error_message
    WHERE id = NEW.job_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGERS
-- =============================================
DROP TRIGGER IF EXISTS update_job_stats_trigger ON job_execution_logs;
CREATE TRIGGER update_job_stats_trigger
  AFTER UPDATE ON job_execution_logs
  FOR EACH ROW
  WHEN (NEW.status IS DISTINCT FROM OLD.status)
  EXECUTE FUNCTION update_job_statistics();

-- =============================================
-- UPDATE TIMESTAMP TRIGGERS
-- =============================================
DROP TRIGGER IF EXISTS update_scheduled_jobs_updated_at ON scheduled_jobs;
CREATE TRIGGER update_scheduled_jobs_updated_at
  BEFORE UPDATE ON scheduled_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_job_queue_updated_at ON job_queue;
CREATE TRIGGER update_job_queue_updated_at
  BEFORE UPDATE ON job_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE scheduled_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_execution_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_queue ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Builders can view their scheduled jobs" ON scheduled_jobs;
DROP POLICY IF EXISTS "Builders can manage their scheduled jobs" ON scheduled_jobs;
DROP POLICY IF EXISTS "Builders can view their job logs" ON job_execution_logs;
DROP POLICY IF EXISTS "System can manage job logs" ON job_execution_logs;
DROP POLICY IF EXISTS "System can manage job queue" ON job_queue;

-- Scheduled jobs policies
CREATE POLICY "Builders can view their scheduled jobs"
  ON scheduled_jobs FOR SELECT
  USING (builder_id = auth.uid());

CREATE POLICY "Builders can manage their scheduled jobs"
  ON scheduled_jobs FOR ALL
  USING (builder_id = auth.uid())
  WITH CHECK (builder_id = auth.uid());

-- Job execution logs policies
CREATE POLICY "Builders can view their job logs"
  ON job_execution_logs FOR SELECT
  USING (
    job_id IN (
      SELECT id FROM scheduled_jobs
      WHERE builder_id = auth.uid()
    )
  );

CREATE POLICY "System can manage job logs"
  ON job_execution_logs FOR ALL
  USING (true);

-- Job queue policies
CREATE POLICY "System can manage job queue"
  ON job_queue FOR ALL
  USING (true);

-- =============================================
-- COMMENTS
-- =============================================
COMMENT ON TABLE scheduled_jobs IS 'Stores all scheduled automation jobs with cron, interval, or relative schedules';
COMMENT ON TABLE job_execution_logs IS 'Detailed logs of each scheduled job execution';
COMMENT ON TABLE job_queue IS 'Queue for pending job executions with retry logic';
COMMENT ON COLUMN scheduled_jobs.schedule_type IS 'Type of schedule: cron, interval, one_time, or relative';
COMMENT ON COLUMN scheduled_jobs.relative_trigger IS 'JSONB for relative schedules like "7 days after last_activity"';
COMMENT ON COLUMN job_execution_logs.status IS 'Execution status: running, success, failed, timeout, cancelled';

