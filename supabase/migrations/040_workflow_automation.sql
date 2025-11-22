-- =============================================
-- AUTOMATED WORKFLOWS DATABASE SCHEMA
-- Feature 4: WhatsApp/Email Automation
-- =============================================

-- =============================================
-- 1. WORKFLOW TEMPLATES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.workflow_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  builder_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Template Info
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'lead_nurture', 'follow_up', 'engagement', 'conversion'
  
  -- Template Configuration
  trigger_type TEXT NOT NULL, -- 'lead_created', 'score_change', 'behavior', 'time_based', 'manual'
  trigger_config JSONB DEFAULT '{}'::JSONB,
  
  -- Actions (array of actions to execute)
  actions JSONB NOT NULL DEFAULT '[]'::JSONB,
  -- Example: [
  --   {
  --     "type": "send_whatsapp",
  --     "delay_minutes": 0,
  --     "message_template_id": "uuid",
  --     "personalization": true
  --   },
  --   {
  --     "type": "send_email",
  --     "delay_minutes": 1440,
  --     "email_template_id": "uuid"
  --   }
  -- ]
  
  -- Conditions for execution
  conditions JSONB DEFAULT '[]'::JSONB,
  -- Example: [
  --   {
  --     "field": "smartscore_v2",
  --     "operator": ">=",
  --     "value": 70
  --   },
  --   {
  --     "field": "property.property_type",
  --     "operator": "in",
  --     "value": ["apartment", "villa"]
  --   }
  -- ]
  
  -- Status & Settings
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 5, -- 1-10, higher = more urgent
  
  -- Analytics
  total_executions INTEGER DEFAULT 0,
  successful_executions INTEGER DEFAULT 0,
  failed_executions INTEGER DEFAULT 0,
  avg_execution_time_ms INTEGER DEFAULT 0,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_executed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_workflow_templates_builder ON public.workflow_templates(builder_id);
CREATE INDEX IF NOT EXISTS idx_workflow_templates_active ON public.workflow_templates(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_workflow_templates_trigger ON public.workflow_templates(trigger_type);

-- =============================================
-- 2. EXTEND MESSAGE TEMPLATES TABLE
-- =============================================
-- Add workflow-specific columns to existing message_templates
DO $$ BEGIN
  ALTER TABLE public.message_templates ADD COLUMN IF NOT EXISTS channel TEXT CHECK (channel IN ('whatsapp', 'sms', 'email'));
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.message_templates ADD COLUMN IF NOT EXISTS category TEXT;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.message_templates ADD COLUMN IF NOT EXISTS subject TEXT;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.message_templates ADD COLUMN IF NOT EXISTS body_template TEXT;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.message_templates ADD COLUMN IF NOT EXISTS use_ai_generation BOOLEAN DEFAULT false;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.message_templates ADD COLUMN IF NOT EXISTS ai_prompt_template TEXT;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.message_templates ADD COLUMN IF NOT EXISTS tone TEXT DEFAULT 'professional';
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.message_templates ADD COLUMN IF NOT EXISTS media_urls TEXT[];
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.message_templates ADD COLUMN IF NOT EXISTS format TEXT DEFAULT 'text';
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.message_templates ADD COLUMN IF NOT EXISTS personalization_fields TEXT[];
EXCEPTION WHEN others THEN NULL; END $$;

-- Update existing records to set channel from type
UPDATE public.message_templates 
SET channel = CASE 
  WHEN type = 'whatsapp' THEN 'whatsapp'
  WHEN type = 'sms' THEN 'sms'
  ELSE channel
END
WHERE channel IS NULL AND type IS NOT NULL;

-- Set body_template from body if not set
UPDATE public.message_templates
SET body_template = body
WHERE body_template IS NULL AND body IS NOT NULL;

-- =============================================
-- 3. WORKFLOW EXECUTIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.workflow_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_template_id UUID REFERENCES public.workflow_templates(id) ON DELETE CASCADE,
  
  -- Target
  lead_id BIGINT REFERENCES public.leads(id) ON DELETE CASCADE,
  buyer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- Execution Details
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed', 'cancelled'
  trigger_type TEXT NOT NULL,
  trigger_payload JSONB DEFAULT '{}'::JSONB,
  
  -- Actions Status
  actions_total INTEGER DEFAULT 0,
  actions_completed INTEGER DEFAULT 0,
  actions_failed INTEGER DEFAULT 0,
  
  -- Timing
  scheduled_for TIMESTAMPTZ NOT NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  execution_time_ms INTEGER,
  
  -- Results
  result JSONB DEFAULT '{}'::JSONB,
  error_message TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflow_executions_template ON public.workflow_executions(workflow_template_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_lead ON public.workflow_executions(lead_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON public.workflow_executions(status);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_scheduled ON public.workflow_executions(scheduled_for) WHERE status = 'pending';

-- =============================================
-- 4. WORKFLOW ACTIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.workflow_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID REFERENCES public.workflow_executions(id) ON DELETE CASCADE,
  
  -- Action Details
  action_type TEXT NOT NULL, -- 'send_whatsapp', 'send_sms', 'send_email', 'update_lead', 'create_task'
  action_config JSONB NOT NULL DEFAULT '{}'::JSONB,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed', 'skipped'
  
  -- Timing
  scheduled_for TIMESTAMPTZ NOT NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Results
  result JSONB DEFAULT '{}'::JSONB,
  error_message TEXT,
  
  -- External IDs (for tracking)
  external_message_id TEXT,
  external_status TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflow_actions_execution ON public.workflow_actions(execution_id);
CREATE INDEX IF NOT EXISTS idx_workflow_actions_status ON public.workflow_actions(status);
CREATE INDEX IF NOT EXISTS idx_workflow_actions_scheduled ON public.workflow_actions(scheduled_for) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_workflow_actions_external ON public.workflow_actions(external_message_id) WHERE external_message_id IS NOT NULL;

-- =============================================
-- 5. MESSAGE DELIVERY TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.message_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id UUID REFERENCES public.workflow_actions(id) ON DELETE CASCADE,
  
  -- Message Info
  channel TEXT NOT NULL, -- 'whatsapp', 'sms', 'email'
  recipient_id UUID REFERENCES public.profiles(id),
  recipient_phone TEXT,
  recipient_email TEXT,
  
  -- Content
  message_template_id UUID REFERENCES public.message_templates(id),
  subject TEXT,
  body TEXT NOT NULL,
  personalized_data JSONB DEFAULT '{}'::JSONB,
  
  -- Delivery Status
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'failed', 'bounced', 'read'
  
  -- Provider Info
  provider TEXT NOT NULL, -- 'twilio', 'resend'
  provider_message_id TEXT,
  provider_response JSONB DEFAULT '{}'::JSONB,
  
  -- Timing
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  
  -- Error Handling
  error_code TEXT,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Engagement Tracking
  opened BOOLEAN DEFAULT false,
  clicked BOOLEAN DEFAULT false,
  replied BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_message_deliveries_action ON public.message_deliveries(action_id);
CREATE INDEX IF NOT EXISTS idx_message_deliveries_recipient ON public.message_deliveries(recipient_id);
CREATE INDEX IF NOT EXISTS idx_message_deliveries_status ON public.message_deliveries(status);
CREATE INDEX IF NOT EXISTS idx_message_deliveries_channel ON public.message_deliveries(channel);
CREATE INDEX IF NOT EXISTS idx_message_deliveries_provider_id ON public.message_deliveries(provider_message_id) WHERE provider_message_id IS NOT NULL;

-- =============================================
-- 6. WORKFLOW ANALYTICS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.workflow_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_template_id UUID REFERENCES public.workflow_templates(id) ON DELETE CASCADE,
  
  -- Time Period
  date DATE NOT NULL,
  
  -- Execution Metrics
  total_executions INTEGER DEFAULT 0,
  successful_executions INTEGER DEFAULT 0,
  failed_executions INTEGER DEFAULT 0,
  
  -- Message Metrics
  messages_sent INTEGER DEFAULT 0,
  messages_delivered INTEGER DEFAULT 0,
  messages_failed INTEGER DEFAULT 0,
  
  -- Engagement Metrics
  messages_opened INTEGER DEFAULT 0,
  messages_clicked INTEGER DEFAULT 0,
  messages_replied INTEGER DEFAULT 0,
  
  -- Conversion Metrics
  leads_converted INTEGER DEFAULT 0,
  total_revenue DECIMAL(12,2) DEFAULT 0.00,
  
  -- Performance
  avg_execution_time_ms INTEGER DEFAULT 0,
  avg_delivery_time_ms INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_workflow_analytics_unique ON public.workflow_analytics(workflow_template_id, date);

-- =============================================
-- 7. WORKFLOW TRIGGER EVENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.workflow_trigger_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Event Details
  event_type TEXT NOT NULL,
  event_source TEXT NOT NULL,
  event_payload JSONB NOT NULL DEFAULT '{}'::JSONB,
  
  -- Workflow Matching
  matched_workflows UUID[] DEFAULT ARRAY[]::UUID[],
  executions_created UUID[] DEFAULT ARRAY[]::UUID[],
  
  -- Processing
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trigger_events_processed ON public.workflow_trigger_events(processed) WHERE processed = false;
CREATE INDEX IF NOT EXISTS idx_trigger_events_type ON public.workflow_trigger_events(event_type);
CREATE INDEX IF NOT EXISTS idx_trigger_events_created ON public.workflow_trigger_events(created_at);

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function: Evaluate workflow conditions
CREATE OR REPLACE FUNCTION public.evaluate_workflow_conditions(
  p_workflow_id UUID,
  p_lead_id BIGINT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_conditions JSONB;
  v_condition JSONB;
  v_lead_data JSONB;
  v_field_value TEXT;
  v_operator TEXT;
  v_expected_value TEXT;
  v_result BOOLEAN;
BEGIN
  -- Get workflow conditions
  SELECT conditions INTO v_conditions
  FROM public.workflow_templates
  WHERE id = p_workflow_id;
  
  IF v_conditions IS NULL OR jsonb_array_length(v_conditions) = 0 THEN
    RETURN true;
  END IF;
  
  -- Get lead data as JSONB
  SELECT row_to_json(l.*)::JSONB INTO v_lead_data
  FROM public.leads l
  WHERE l.id = p_lead_id;
  
  -- Evaluate each condition (AND logic)
  FOR v_condition IN SELECT * FROM jsonb_array_elements(v_conditions)
  LOOP
    v_field_value := v_lead_data->>v_condition->>'field';
    v_operator := v_condition->>'operator';
    v_expected_value := v_condition->>'value';
    
    -- Evaluate condition based on operator
    CASE v_operator
      WHEN '=' THEN
        v_result := v_field_value = v_expected_value;
      WHEN '!=' THEN
        v_result := v_field_value != v_expected_value;
      WHEN '>' THEN
        v_result := (v_field_value::NUMERIC) > (v_expected_value::NUMERIC);
      WHEN '>=' THEN
        v_result := (v_field_value::NUMERIC) >= (v_expected_value::NUMERIC);
      WHEN '<' THEN
        v_result := (v_field_value::NUMERIC) < (v_expected_value::NUMERIC);
      WHEN '<=' THEN
        v_result := (v_field_value::NUMERIC) <= (v_expected_value::NUMERIC);
      WHEN 'in' THEN
        v_result := v_field_value = ANY(SELECT jsonb_array_elements_text(v_condition->'value'));
      WHEN 'not_in' THEN
        v_result := v_field_value != ALL(SELECT jsonb_array_elements_text(v_condition->'value'));
      WHEN 'contains' THEN
        v_result := v_field_value ILIKE '%' || v_expected_value || '%';
      ELSE
        v_result := true;
    END CASE;
    
    -- If any condition fails, return false
    IF NOT v_result THEN
      RETURN false;
    END IF;
  END LOOP;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Create workflow execution
CREATE OR REPLACE FUNCTION public.create_workflow_execution(
  p_workflow_id UUID,
  p_lead_id BIGINT,
  p_trigger_type TEXT,
  p_trigger_payload JSONB DEFAULT '{}'::JSONB
)
RETURNS UUID AS $$
DECLARE
  v_execution_id UUID;
  v_workflow RECORD;
  v_action JSONB;
  v_delay_minutes INTEGER;
  v_buyer_id UUID;
BEGIN
  -- Get workflow details
  SELECT * INTO v_workflow
  FROM public.workflow_templates
  WHERE id = p_workflow_id AND is_active = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Workflow not found or inactive';
  END IF;
  
  -- Evaluate conditions
  IF NOT public.evaluate_workflow_conditions(p_workflow_id, p_lead_id) THEN
    RAISE NOTICE 'Workflow conditions not met for lead %', p_lead_id;
    RETURN NULL;
  END IF;
  
  -- Get buyer_id from lead
  SELECT buyer_id INTO v_buyer_id
  FROM public.leads
  WHERE id = p_lead_id;
  
  -- Create execution record
  INSERT INTO public.workflow_executions (
    workflow_template_id,
    lead_id,
    buyer_id,
    status,
    trigger_type,
    trigger_payload,
    actions_total,
    scheduled_for
  )
  VALUES (
    p_workflow_id,
    p_lead_id,
    v_buyer_id,
    'pending',
    p_trigger_type,
    p_trigger_payload,
    jsonb_array_length(v_workflow.actions),
    NOW()
  )
  RETURNING id INTO v_execution_id;
  
  -- Create action records with delays
  FOR v_action IN SELECT * FROM jsonb_array_elements(v_workflow.actions)
  LOOP
    v_delay_minutes := COALESCE((v_action->>'delay_minutes')::INTEGER, 0);
    
    INSERT INTO public.workflow_actions (
      execution_id,
      action_type,
      action_config,
      scheduled_for
    ) VALUES (
      v_execution_id,
      v_action->>'type',
      v_action,
      NOW() + (v_delay_minutes || ' minutes')::INTERVAL
    );
  END LOOP;
  
  -- Update workflow stats
  UPDATE public.workflow_templates
  SET 
    total_executions = total_executions + 1,
    last_executed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_workflow_id;
  
  RETURN v_execution_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- TRIGGERS
-- =============================================

-- Trigger: New lead created
CREATE OR REPLACE FUNCTION public.trigger_workflow_on_lead_created()
RETURNS TRIGGER AS $$
DECLARE
  v_workflow RECORD;
BEGIN
  -- Find matching workflows
  FOR v_workflow IN 
    SELECT id, builder_id
    FROM public.workflow_templates
    WHERE trigger_type = 'lead_created'
      AND is_active = true
      AND builder_id = NEW.builder_id
  LOOP
    -- Create execution
    PERFORM public.create_workflow_execution(
      v_workflow.id,
      NEW.id,
      'lead_created',
      jsonb_build_object(
        'lead_id', NEW.id,
        'created_at', NEW.created_at
      )
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_leads_workflow_created ON public.leads;
CREATE TRIGGER trigger_leads_workflow_created
AFTER INSERT ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.trigger_workflow_on_lead_created();

-- Trigger: SmartScore changed
CREATE OR REPLACE FUNCTION public.trigger_workflow_on_score_change()
RETURNS TRIGGER AS $$
DECLARE
  v_workflow RECORD;
  v_old_score DECIMAL(5,2) := COALESCE((OLD.smartscore_v2)::DECIMAL(5,2), 0);
  v_new_score DECIMAL(5,2) := COALESCE((NEW.smartscore_v2)::DECIMAL(5,2), 0);
BEGIN
  -- Only trigger if score changed significantly (±10 points)
  IF ABS(v_new_score - v_old_score) < 10 THEN
    RETURN NEW;
  END IF;
  
  -- Find matching workflows
  FOR v_workflow IN 
    SELECT id, builder_id
    FROM public.workflow_templates
    WHERE trigger_type = 'score_change'
      AND is_active = true
      AND builder_id = NEW.builder_id
  LOOP
    -- Create execution
    PERFORM public.create_workflow_execution(
      v_workflow.id,
      NEW.id,
      'score_change',
      jsonb_build_object(
        'lead_id', NEW.id,
        'old_score', v_old_score,
        'new_score', v_new_score,
        'score_change', v_new_score - v_old_score
      )
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_leads_workflow_score_change ON public.leads;
CREATE TRIGGER trigger_leads_workflow_score_change
AFTER UPDATE OF smartscore_v2 ON public.leads
FOR EACH ROW
WHEN (NEW.smartscore_v2 IS DISTINCT FROM OLD.smartscore_v2)
EXECUTE FUNCTION public.trigger_workflow_on_score_change();

-- Trigger: Update workflow template stats
CREATE OR REPLACE FUNCTION public.update_workflow_template_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE public.workflow_templates
    SET 
      successful_executions = successful_executions + 1,
      avg_execution_time_ms = CASE
        WHEN NEW.execution_time_ms IS NOT NULL THEN
          (avg_execution_time_ms * successful_executions + NEW.execution_time_ms) / (successful_executions + 1)
        ELSE avg_execution_time_ms
      END,
      updated_at = NOW()
    WHERE id = NEW.workflow_template_id;
  ELSIF NEW.status = 'failed' AND OLD.status != 'failed' THEN
    UPDATE public.workflow_templates
    SET 
      failed_executions = failed_executions + 1,
      updated_at = NOW()
    WHERE id = NEW.workflow_template_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_execution_stats_update ON public.workflow_executions;
CREATE TRIGGER trigger_execution_stats_update
AFTER UPDATE OF status ON public.workflow_executions
FOR EACH ROW
EXECUTE FUNCTION public.update_workflow_template_stats();

-- Trigger: Update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_workflow_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_workflow_templates_updated_at ON public.workflow_templates;
CREATE TRIGGER trigger_workflow_templates_updated_at
BEFORE UPDATE ON public.workflow_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_workflow_templates_updated_at();

-- =============================================
-- RLS POLICIES
-- =============================================
ALTER TABLE public.workflow_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_analytics ENABLE ROW LEVEL SECURITY;

-- Workflow templates: Builders manage their own
DROP POLICY IF EXISTS "Builders manage their workflows" ON public.workflow_templates;
CREATE POLICY "Builders manage their workflows"
ON public.workflow_templates
FOR ALL
USING (auth.uid() = builder_id);

-- Executions: View own builder's executions
DROP POLICY IF EXISTS "View builder executions" ON public.workflow_executions;
CREATE POLICY "View builder executions"
ON public.workflow_executions
FOR SELECT
USING (
  workflow_template_id IN (
    SELECT id FROM public.workflow_templates
    WHERE builder_id = auth.uid()
  )
);

-- Actions: View own builder's actions
DROP POLICY IF EXISTS "View builder actions" ON public.workflow_actions;
CREATE POLICY "View builder actions"
ON public.workflow_actions
FOR SELECT
USING (
  execution_id IN (
    SELECT id FROM public.workflow_executions
    WHERE workflow_template_id IN (
      SELECT id FROM public.workflow_templates
      WHERE builder_id = auth.uid()
    )
  )
);

-- Message deliveries: View own builder's deliveries
DROP POLICY IF EXISTS "View builder deliveries" ON public.message_deliveries;
CREATE POLICY "View builder deliveries"
ON public.message_deliveries
FOR SELECT
USING (
  action_id IN (
    SELECT id FROM public.workflow_actions
    WHERE execution_id IN (
      SELECT id FROM public.workflow_executions
      WHERE workflow_template_id IN (
        SELECT id FROM public.workflow_templates
        WHERE builder_id = auth.uid()
      )
    )
  )
);

-- Analytics: View own builder's analytics
DROP POLICY IF EXISTS "View builder analytics" ON public.workflow_analytics;
CREATE POLICY "View builder analytics"
ON public.workflow_analytics
FOR SELECT
USING (
  workflow_template_id IN (
    SELECT id FROM public.workflow_templates
    WHERE builder_id = auth.uid()
  )
);

-- Grant service role full access
GRANT ALL ON public.workflow_templates TO service_role;
GRANT ALL ON public.message_templates TO service_role;
GRANT ALL ON public.workflow_executions TO service_role;
GRANT ALL ON public.workflow_actions TO service_role;
GRANT ALL ON public.message_deliveries TO service_role;
GRANT ALL ON public.workflow_analytics TO service_role;
GRANT ALL ON public.workflow_trigger_events TO service_role;

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX IF NOT EXISTS idx_executions_status_scheduled 
ON public.workflow_executions(status, scheduled_for)
WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_actions_status_scheduled 
ON public.workflow_actions(status, scheduled_for)
WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_deliveries_status_channel 
ON public.message_deliveries(status, channel);

CREATE INDEX IF NOT EXISTS idx_analytics_recent 
ON public.workflow_analytics(workflow_template_id, date DESC)
WHERE date >= CURRENT_DATE - INTERVAL '90 days';

-- =============================================
-- COMMENTS
-- =============================================
COMMENT ON TABLE public.workflow_templates IS 'Defines automation workflows with triggers, conditions, and actions';
COMMENT ON TABLE public.message_templates IS 'Reusable message templates for WhatsApp, SMS, and Email';
COMMENT ON TABLE public.workflow_executions IS 'Tracks individual workflow execution instances';
COMMENT ON TABLE public.workflow_actions IS 'Individual actions within a workflow execution';
COMMENT ON TABLE public.message_deliveries IS 'Tracks message delivery status and engagement';
COMMENT ON TABLE public.workflow_analytics IS 'Daily aggregated analytics for workflows';
COMMENT ON TABLE public.workflow_trigger_events IS 'Logs workflow trigger events for debugging and analytics';

