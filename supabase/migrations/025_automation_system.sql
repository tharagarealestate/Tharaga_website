-- =============================================
-- AUTOMATION SYSTEM MIGRATION
-- Creates tables for automation triggers, executions, and queue
-- =============================================

-- =============================================
-- 1. AUTOMATIONS TABLE
-- =============================================
-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.automations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  builder_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  trigger_conditions jsonb NOT NULL DEFAULT '{}'::jsonb,
  actions jsonb NOT NULL DEFAULT '[]'::jsonb,
  priority integer DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
  is_active boolean DEFAULT true,
  tags text[] DEFAULT '{}'::text[],
  total_executions integer DEFAULT 0,
  successful_executions integer DEFAULT 0,
  failed_executions integer DEFAULT 0,
  last_execution_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add builder_id if it doesn't exist (for existing tables)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'automations' 
    AND column_name = 'builder_id'
  ) THEN
    ALTER TABLE public.automations ADD COLUMN builder_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_automations_builder_id ON public.automations(builder_id);
CREATE INDEX IF NOT EXISTS idx_automations_is_active ON public.automations(is_active);
CREATE INDEX IF NOT EXISTS idx_automations_created_at ON public.automations(created_at DESC);

-- =============================================
-- 2. AUTOMATION_EXECUTIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.automation_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id uuid REFERENCES public.automations(id) ON DELETE CASCADE NOT NULL,
  trigger_event_id uuid,
  lead_id uuid,
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'success', 'failed', 'cancelled', 'timeout')),
  execution_time_ms integer,
  records_processed integer DEFAULT 0,
  records_succeeded integer DEFAULT 0,
  records_failed integer DEFAULT 0,
  output jsonb DEFAULT '{}'::jsonb,
  error_message text,
  error_stack text,
  logs text[] DEFAULT '{}'::text[],
  executed_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_automation_executions_automation_id ON public.automation_executions(automation_id);
CREATE INDEX IF NOT EXISTS idx_automation_executions_lead_id ON public.automation_executions(lead_id);
CREATE INDEX IF NOT EXISTS idx_automation_executions_status ON public.automation_executions(status);
CREATE INDEX IF NOT EXISTS idx_automation_executions_executed_at ON public.automation_executions(executed_at DESC);

-- =============================================
-- 3. AUTOMATION_QUEUE TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.automation_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id uuid REFERENCES public.automations(id) ON DELETE CASCADE NOT NULL,
  trigger_event_id uuid,
  context jsonb DEFAULT '{}'::jsonb,
  priority integer DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
  scheduled_for timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  attempts integer DEFAULT 0,
  max_attempts integer DEFAULT 3,
  last_error text,
  started_at timestamptz,
  completed_at timestamptz,
  execution_id uuid REFERENCES public.automation_executions(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_automation_queue_automation_id ON public.automation_queue(automation_id);
CREATE INDEX IF NOT EXISTS idx_automation_queue_status ON public.automation_queue(status);
CREATE INDEX IF NOT EXISTS idx_automation_queue_scheduled_for ON public.automation_queue(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_automation_queue_priority ON public.automation_queue(priority);

-- =============================================
-- 4. UPDATED_AT TRIGGERS
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_automations_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_automations_updated_at ON public.automations;
CREATE TRIGGER on_automations_updated_at
  BEFORE UPDATE ON public.automations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_automations_updated_at();

-- =============================================
-- 5. ROW LEVEL SECURITY
-- =============================================

-- Automations: Builders can manage their own automations
ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Builders can view their automations" ON public.automations;
DROP POLICY IF EXISTS "Builders can manage their automations" ON public.automations;

CREATE POLICY "Builders can view their automations" ON public.automations
  FOR SELECT USING (auth.uid() = builder_id);

CREATE POLICY "Builders can manage their automations" ON public.automations
  FOR ALL USING (auth.uid() = builder_id);

-- Automation Executions: Builders can view executions for their automations
ALTER TABLE public.automation_executions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Builders can view their automation executions" ON public.automation_executions;

CREATE POLICY "Builders can view their automation executions" ON public.automation_executions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.automations
      WHERE automations.id = automation_executions.automation_id
      AND automations.builder_id = auth.uid()
    )
  );

-- Automation Queue: Builders can view queue items for their automations
ALTER TABLE public.automation_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Builders can view their automation queue" ON public.automation_queue;

CREATE POLICY "Builders can view their automation queue" ON public.automation_queue
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.automations
      WHERE automations.id = automation_queue.automation_id
      AND automations.builder_id = auth.uid()
    )
  );

-- =============================================
-- 6. COMMENTS
-- =============================================
COMMENT ON TABLE public.automations IS 'Automation rules and workflows for builders';
COMMENT ON TABLE public.automation_executions IS 'Execution logs for automation runs';
COMMENT ON TABLE public.automation_queue IS 'Queue for pending automation executions';

