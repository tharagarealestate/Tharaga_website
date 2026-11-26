-- =============================================
-- COMPLETE AUTOMATION SYSTEM TABLES
-- =============================================

-- Check if organizations table exists, if not use builder_id
DO $$ 
BEGIN
  -- Add organization_id column to automations if organizations table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'organizations'
  ) THEN
    -- Add organization_id if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'automations' 
      AND column_name = 'organization_id'
    ) THEN
      ALTER TABLE public.automations ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- Update automations table with new columns
DO $$ 
BEGIN
  -- Add execution limits
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'automations' 
    AND column_name = 'max_executions_per_day'
  ) THEN
    ALTER TABLE public.automations ADD COLUMN max_executions_per_day INTEGER;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'automations' 
    AND column_name = 'max_executions_per_lead'
  ) THEN
    ALTER TABLE public.automations ADD COLUMN max_executions_per_lead INTEGER;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'automations' 
    AND column_name = 'execution_window_start'
  ) THEN
    ALTER TABLE public.automations ADD COLUMN execution_window_start TIME;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'automations' 
    AND column_name = 'execution_window_end'
  ) THEN
    ALTER TABLE public.automations ADD COLUMN execution_window_end TIME;
  END IF;
  
  -- Rename last_execution_at if needed
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'automations' 
    AND column_name = 'last_execution_at'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'automations' 
    AND column_name = 'last_executed_at'
  ) THEN
    ALTER TABLE public.automations RENAME COLUMN last_execution_at TO last_executed_at;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'automations' 
    AND column_name = 'last_executed_at'
  ) THEN
    ALTER TABLE public.automations ADD COLUMN last_executed_at TIMESTAMPTZ;
  END IF;
END $$;

-- Update automation_queue table
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'automation_queue'
  ) THEN
    -- Add error_message if missing
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'automation_queue' 
      AND column_name = 'error_message'
    ) THEN
      ALTER TABLE public.automation_queue ADD COLUMN error_message TEXT;
    END IF;
    
    -- Ensure context is NOT NULL
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'automation_queue' 
      AND column_name = 'context'
      AND is_nullable = 'YES'
    ) THEN
      ALTER TABLE public.automation_queue ALTER COLUMN context SET NOT NULL;
      UPDATE public.automation_queue SET context = '{}'::jsonb WHERE context IS NULL;
    END IF;
  END IF;
END $$;

-- Update automation_executions table
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'automation_executions'
  ) THEN
    -- Add organization_id if organizations table exists
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'organizations'
    ) THEN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'automation_executions' 
        AND column_name = 'organization_id'
      ) THEN
        ALTER TABLE public.automation_executions ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
      END IF;
    END IF;
    
    -- Add conditions_matched
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'automation_executions' 
      AND column_name = 'conditions_matched'
    ) THEN
      ALTER TABLE public.automation_executions ADD COLUMN conditions_matched BOOLEAN NOT NULL DEFAULT true;
    END IF;
    
    -- Add actions_executed
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'automation_executions' 
      AND column_name = 'actions_executed'
    ) THEN
      ALTER TABLE public.automation_executions ADD COLUMN actions_executed JSONB;
    END IF;
    
    -- Add actions_failed
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'automation_executions' 
      AND column_name = 'actions_failed'
    ) THEN
      ALTER TABLE public.automation_executions ADD COLUMN actions_failed JSONB;
    END IF;
    
    -- Update status constraint
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'automation_executions' 
      AND column_name = 'status'
    ) THEN
      -- Check if partial is in the constraint
      ALTER TABLE public.automation_executions DROP CONSTRAINT IF EXISTS automation_executions_status_check;
      ALTER TABLE public.automation_executions ADD CONSTRAINT automation_executions_status_check 
        CHECK (status IN ('success', 'failed', 'partial', 'running', 'cancelled', 'timeout'));
    END IF;
    
    -- Rename logs if needed
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'automation_executions' 
      AND column_name = 'logs'
      AND data_type = 'ARRAY'
    ) AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'automation_executions' 
      AND column_name = 'logs_jsonb'
    ) THEN
      -- Keep both for compatibility
      ALTER TABLE public.automation_executions ADD COLUMN logs_jsonb JSONB;
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'automation_executions' 
      AND column_name = 'logs_jsonb'
    ) AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'automation_executions' 
      AND column_name = 'logs'
      AND data_type = 'jsonb'
    ) THEN
      ALTER TABLE public.automation_executions ADD COLUMN logs_jsonb JSONB;
    END IF;
  END IF;
END $$;

-- Create trigger_events table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.trigger_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Event details
  trigger_type TEXT NOT NULL,
  trigger_name TEXT NOT NULL,
  event_source TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Context
  lead_id UUID,
  organization_id UUID,
  builder_id UUID,
  
  -- Processing
  automations_triggered INTEGER DEFAULT 0,
  automations_executed INTEGER DEFAULT 0,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign keys to trigger_events if tables exist
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'leads'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'trigger_events_lead_id_fkey'
    ) THEN
      ALTER TABLE public.trigger_events 
      ADD CONSTRAINT trigger_events_lead_id_fkey 
      FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE;
    END IF;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'organizations'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'trigger_events_organization_id_fkey'
    ) THEN
      ALTER TABLE public.trigger_events 
      ADD CONSTRAINT trigger_events_organization_id_fkey 
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_automations_organization ON public.automations(organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_automations_active ON public.automations(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_automation_queue_status ON public.automation_queue(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_automation_queue_scheduled ON public.automation_queue(scheduled_for) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_automation_executions_automation ON public.automation_executions(automation_id);
CREATE INDEX IF NOT EXISTS idx_automation_executions_lead ON public.automation_executions(lead_id) WHERE lead_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_automation_executions_organization ON public.automation_executions(organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_trigger_events_org ON public.trigger_events(organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_trigger_events_builder ON public.trigger_events(builder_id) WHERE builder_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_trigger_events_created ON public.trigger_events(created_at DESC);

-- Row Level Security
ALTER TABLE public.trigger_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for trigger_events
DROP POLICY IF EXISTS "Users can view trigger events in their organization" ON public.trigger_events;

-- Policy that works with both organization_id and builder_id
CREATE POLICY "Users can view trigger events in their organization" ON public.trigger_events
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
    OR builder_id = auth.uid()
    OR organization_id IS NULL AND builder_id IS NULL
  );

-- Function to update automation statistics
CREATE OR REPLACE FUNCTION update_automation_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'success' THEN
    UPDATE public.automations
    SET 
      total_executions = COALESCE(total_executions, 0) + 1,
      successful_executions = COALESCE(successful_executions, 0) + 1,
      last_executed_at = NOW()
    WHERE id = NEW.automation_id;
  ELSIF NEW.status = 'failed' THEN
    UPDATE public.automations
    SET 
      total_executions = COALESCE(total_executions, 0) + 1,
      failed_executions = COALESCE(failed_executions, 0) + 1,
      last_executed_at = NOW()
    WHERE id = NEW.automation_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists and create new one
DROP TRIGGER IF EXISTS automation_stats_trigger ON public.automation_executions;
CREATE TRIGGER automation_stats_trigger
  AFTER INSERT ON public.automation_executions
  FOR EACH ROW
  EXECUTE FUNCTION update_automation_stats();

-- Updated_at trigger function (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Updated_at trigger for automations
DROP TRIGGER IF EXISTS automations_updated_at ON public.automations;
CREATE TRIGGER automations_updated_at
  BEFORE UPDATE ON public.automations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();









