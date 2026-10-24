-- =============================================
-- AUTOMATION ENGINE TABLES
-- =============================================

-- Update automations table with enhanced fields
ALTER TABLE automations ADD COLUMN IF NOT EXISTS 
  version INTEGER DEFAULT 1;

ALTER TABLE automations ADD COLUMN IF NOT EXISTS 
  enabled_at TIMESTAMPTZ;

ALTER TABLE automations ADD COLUMN IF NOT EXISTS 
  disabled_at TIMESTAMPTZ;

ALTER TABLE automations ADD COLUMN IF NOT EXISTS 
  error_count INTEGER DEFAULT 0;

ALTER TABLE automations ADD COLUMN IF NOT EXISTS 
  success_rate DECIMAL(5,2) DEFAULT 100.00;

-- =============================================
-- AUTOMATION TRIGGERS (What starts the automation)
-- =============================================
CREATE TABLE IF NOT EXISTS automation_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id UUID NOT NULL REFERENCES automations(id) ON DELETE CASCADE,
  
  -- Trigger Type
  trigger_type VARCHAR(100) NOT NULL,
  /* Types:
     - 'lead_created': New lead registered
     - 'lead_scored': Lead score calculated/updated
     - 'score_threshold': Lead score crosses threshold
     - 'stage_changed': Pipeline stage changes
     - 'property_viewed': Lead views property
     - 'form_submitted': Lead submits form
     - 'site_visit_booked': Site visit scheduled
     - 'site_visit_completed': Site visit finished
     - 'time_based': Scheduled time trigger
     - 'inactivity': Lead inactive for X days
     - 'webhook': External webhook received
  */
  
  -- Trigger Configuration
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  /* Examples:
  {
    "score_threshold": 8,
    "score_operator": ">=",
    "category": ["hot", "warm"]
  }
  OR
  {
    "schedule": "daily",
    "time": "09:00",
    "timezone": "Asia/Kolkata"
  }
  OR
  {
    "inactivity_days": 7,
    "last_interaction_type": "property_view"
  }
  */
  
  -- Filter Conditions (optional additional filters)
  filters JSONB DEFAULT '{}'::jsonb,
  /* Example:
  {
    "budget_min": 5000000,
    "preferred_location": ["Chennai"],
    "property_type": "3BHK"
  }
  */
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_automation_triggers_automation ON automation_triggers(automation_id);
CREATE INDEX IF NOT EXISTS idx_automation_triggers_type ON automation_triggers(trigger_type);
CREATE INDEX IF NOT EXISTS idx_automation_triggers_active ON automation_triggers(is_active) WHERE is_active = true;

-- =============================================
-- AUTOMATION ACTIONS (What the automation does)
-- =============================================
CREATE TABLE IF NOT EXISTS automation_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id UUID NOT NULL REFERENCES automations(id) ON DELETE CASCADE,
  
  -- Action Order & Dependencies
  step_number INTEGER NOT NULL, -- Order of execution
  parent_action_id UUID REFERENCES automation_actions(id) ON DELETE CASCADE,
  
  -- Action Type
  action_type VARCHAR(100) NOT NULL,
  /* Types:
     - 'send_email': Send email
     - 'send_sms': Send SMS
     - 'send_whatsapp': Send WhatsApp
     - 'assign_lead': Assign to team member
     - 'update_lead': Update lead fields
     - 'create_task': Create follow-up task
     - 'update_stage': Change pipeline stage
     - 'add_tag': Add tag to lead
     - 'sync_crm': Sync to CRM
     - 'trigger_webhook': Call external webhook
     - 'wait': Delay execution
     - 'condition': If/then branch
     - 'end': End workflow
  */
  
  -- Action Configuration
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  /* Example for send_email:
  {
    "template_id": "uuid",
    "subject": "Follow up on {{property_name}}",
    "variables": {
      "property_name": "{{property.title}}",
      "lead_name": "{{lead.name}}"
    }
  }
  OR for wait:
  {
    "delay_type": "minutes",
    "delay_value": 60
  }
  OR for condition:
  {
    "condition": "lead.score > 7",
    "true_action": "step_5",
    "false_action": "step_8"
  }
  */
  
  -- Retry Logic
  retry_on_failure BOOLEAN DEFAULT true,
  max_retries INTEGER DEFAULT 3,
  retry_delay_minutes INTEGER DEFAULT 5,
  
  -- Conditional Execution
  execute_if JSONB DEFAULT '{}'::jsonb,
  /* Example:
  {
    "condition": "lead.budget_max >= 10000000",
    "operator": "AND",
    "conditions": [
      {"field": "lead.score", "operator": ">=", "value": 7},
      {"field": "lead.category", "operator": "in", "value": ["hot", "warm"]}
    ]
  }
  */
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_automation_actions_automation ON automation_actions(automation_id);
CREATE INDEX IF NOT EXISTS idx_automation_actions_step ON automation_actions(automation_id, step_number);
CREATE INDEX IF NOT EXISTS idx_automation_actions_parent ON automation_actions(parent_action_id);
CREATE INDEX IF NOT EXISTS idx_automation_actions_active ON automation_actions(is_active) WHERE is_active = true;

-- =============================================
-- AUTOMATION EXECUTION LOGS
-- =============================================
CREATE TABLE IF NOT EXISTS automation_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id UUID NOT NULL REFERENCES automations(id) ON DELETE CASCADE,
  
  -- Trigger Info
  trigger_type VARCHAR(100) NOT NULL,
  trigger_data JSONB DEFAULT '{}'::jsonb,
  
  -- Target Record
  target_type VARCHAR(50) NOT NULL, -- 'lead', 'deal', 'property'
  target_id UUID NOT NULL,
  
  -- Execution Status
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  /* Statuses:
     - 'pending': Queued for execution
     - 'running': Currently executing
     - 'completed': Successfully completed
     - 'failed': Execution failed
     - 'cancelled': Manually cancelled
     - 'skipped': Skipped due to conditions
  */
  
  -- Timing
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  
  -- Results
  actions_total INTEGER DEFAULT 0,
  actions_completed INTEGER DEFAULT 0,
  actions_failed INTEGER DEFAULT 0,
  actions_skipped INTEGER DEFAULT 0,
  
  -- Action Results
  action_results JSONB DEFAULT '[]'::jsonb,
  /* Example:
  [
    {
      "step": 1,
      "action": "send_email",
      "status": "success",
      "message_id": "abc123",
      "timestamp": "2025-01-15T10:00:00Z"
    },
    {
      "step": 2,
      "action": "wait",
      "status": "completed",
      "wait_until": "2025-01-15T11:00:00Z"
    }
  ]
  */
  
  -- Error Tracking
  error_message TEXT,
  error_stack TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_automation_executions_automation ON automation_executions(automation_id);
CREATE INDEX IF NOT EXISTS idx_automation_executions_status ON automation_executions(status);
CREATE INDEX IF NOT EXISTS idx_automation_executions_target ON automation_executions(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_automation_executions_created ON automation_executions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_automation_executions_pending ON automation_executions(status, created_at) WHERE status = 'pending';

-- =============================================
-- SCHEDULED AUTOMATION JOBS
-- =============================================
CREATE TABLE IF NOT EXISTS automation_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id UUID NOT NULL REFERENCES automations(id) ON DELETE CASCADE,
  
  -- Schedule Configuration
  schedule_type VARCHAR(50) NOT NULL, -- 'once', 'daily', 'weekly', 'monthly', 'cron'
  schedule_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  /* Example:
  {
    "time": "09:00",
    "timezone": "Asia/Kolkata",
    "days": [1, 2, 3, 4, 5], // Monday to Friday
    "cron": "0 9 * * 1-5"
  }
  */
  
  -- Execution Window
  next_run_at TIMESTAMPTZ NOT NULL,
  last_run_at TIMESTAMPTZ,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  paused_at TIMESTAMPTZ,
  
  -- Statistics
  total_runs INTEGER DEFAULT 0,
  successful_runs INTEGER DEFAULT 0,
  failed_runs INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_automation_schedule_automation ON automation_schedule(automation_id);
CREATE INDEX IF NOT EXISTS idx_automation_schedule_next_run ON automation_schedule(next_run_at) 
  WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_automation_schedule_active ON automation_schedule(is_active) WHERE is_active = true;

-- =============================================
-- AUTOMATION TEMPLATES (Pre-built workflows)
-- =============================================
CREATE TABLE IF NOT EXISTS automation_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Template Info
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100), -- 'lead_nurture', 'follow_up', 'scoring', 'crm_sync'
  
  -- Template Data
  template_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  /* Complete automation configuration that can be cloned:
  {
    "triggers": [...],
    "actions": [...],
    "settings": {...}
  }
  */
  
  -- Usage & Popularity
  usage_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT true,
  
  -- Author
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_automation_templates_category ON automation_templates(category);
CREATE INDEX IF NOT EXISTS idx_automation_templates_public ON automation_templates(is_public) 
  WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_automation_templates_featured ON automation_templates(is_featured) 
  WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_automation_templates_author ON automation_templates(created_by);

-- =============================================
-- UPDATE TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_automation_triggers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_automation_triggers_updated_at
  BEFORE UPDATE ON automation_triggers
  FOR EACH ROW
  EXECUTE FUNCTION update_automation_triggers_updated_at();

CREATE OR REPLACE FUNCTION update_automation_actions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_automation_actions_updated_at
  BEFORE UPDATE ON automation_actions
  FOR EACH ROW
  EXECUTE FUNCTION update_automation_actions_updated_at();

CREATE OR REPLACE FUNCTION update_automation_executions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_automation_executions_updated_at
  BEFORE UPDATE ON automation_executions
  FOR EACH ROW
  EXECUTE FUNCTION update_automation_executions_updated_at();

CREATE TRIGGER update_automation_schedule_timestamp
  BEFORE UPDATE ON automation_schedule
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_automation_templates_timestamp
  BEFORE UPDATE ON automation_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to calculate next run time
CREATE OR REPLACE FUNCTION calculate_next_run(
  p_schedule_type VARCHAR(50),
  p_schedule_config JSONB,
  p_last_run_at TIMESTAMPTZ
)
RETURNS TIMESTAMPTZ AS $$
DECLARE
  v_next_run TIMESTAMPTZ;
  v_time TIME;
  v_timezone VARCHAR(100);
  v_days INTEGER[];
  v_cron VARCHAR(255);
BEGIN
  v_timezone := COALESCE(p_schedule_config->>'timezone', 'Asia/Kolkata');
  
  CASE p_schedule_type
    WHEN 'once' THEN
      IF p_schedule_config->>'run_at' IS NOT NULL THEN
        v_next_run := (p_schedule_config->>'run_at')::TIMESTAMPTZ;
      ELSE
        v_next_run := NOW() + INTERVAL '1 hour';
      END IF;
    
    WHEN 'daily' THEN
      v_time := COALESCE((p_schedule_config->>'time')::TIME, '09:00'::TIME);
      v_next_run := (CURRENT_DATE + INTERVAL '1 day' + v_time) AT TIME ZONE v_timezone;
      IF p_last_run_at IS NOT NULL AND v_next_run <= p_last_run_at THEN
        v_next_run := v_next_run + INTERVAL '1 day';
      END IF;
    
    WHEN 'weekly' THEN
      v_time := COALESCE((p_schedule_config->>'time')::TIME, '09:00'::TIME);
      v_days := ARRAY(SELECT jsonb_array_elements_text(p_schedule_config->'days'))::INTEGER[];
      IF array_length(v_days, 1) IS NULL THEN
        v_days := ARRAY[1,2,3,4,5]; -- Default to weekdays
      END IF;
      -- Simplified: next week same day
      v_next_run := (CURRENT_DATE + INTERVAL '7 days' + v_time) AT TIME ZONE v_timezone;
    
    WHEN 'monthly' THEN
      v_time := COALESCE((p_schedule_config->>'time')::TIME, '09:00'::TIME);
      v_next_run := (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' + v_time) AT TIME ZONE v_timezone;
    
    WHEN 'cron' THEN
      v_cron := p_schedule_config->>'cron';
      -- For now, return next hour (full cron parsing would require pg_cron extension)
      v_next_run := NOW() + INTERVAL '1 hour';
    
    ELSE
      v_next_run := NOW() + INTERVAL '1 hour';
  END CASE;
  
  RETURN v_next_run;
END;
$$ LANGUAGE plpgsql;

-- Function to check if automation should run for a lead
CREATE OR REPLACE FUNCTION should_run_automation(
  p_automation_id UUID,
  p_lead_id UUID,
  p_trigger_data JSONB
)
RETURNS BOOLEAN AS $$
DECLARE
  v_automation RECORD;
  v_trigger RECORD;
  v_lead RECORD;
BEGIN
  -- Get automation
  SELECT * INTO v_automation
  FROM automations
  WHERE id = p_automation_id AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Get trigger
  SELECT * INTO v_trigger
  FROM automation_triggers
  WHERE automation_id = p_automation_id AND is_active = true
  ORDER BY created_at ASC
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Get lead (from profiles or auth.users)
  SELECT * INTO v_lead
  FROM profiles
  WHERE user_id = p_lead_id;
  
  IF NOT FOUND THEN
    -- Try auth.users
    SELECT * INTO v_lead
    FROM auth.users
    WHERE id = p_lead_id;
    
    IF NOT FOUND THEN
      RETURN false;
    END IF;
  END IF;
  
  -- Check trigger conditions
  -- This is a simplified version - implement full condition checking
  -- For now, return true if automation and trigger are active
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function to queue automation execution
CREATE OR REPLACE FUNCTION queue_automation_execution(
  p_automation_id UUID,
  p_trigger_type VARCHAR(100),
  p_trigger_data JSONB,
  p_target_type VARCHAR(50),
  p_target_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_execution_id UUID;
BEGIN
  INSERT INTO automation_executions (
    automation_id,
    trigger_type,
    trigger_data,
    target_type,
    target_id,
    status
  ) VALUES (
    p_automation_id,
    p_trigger_type,
    p_trigger_data,
    p_target_type,
    p_target_id,
    'pending'
  )
  RETURNING id INTO v_execution_id;
  
  RETURN v_execution_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE automation_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_templates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Builders can manage automation triggers" ON automation_triggers;
DROP POLICY IF EXISTS "Builders can manage automation actions" ON automation_actions;
DROP POLICY IF EXISTS "Builders can view automation executions" ON automation_executions;
DROP POLICY IF EXISTS "Builders can manage automation schedules" ON automation_schedule;
DROP POLICY IF EXISTS "Everyone can view public templates" ON automation_templates;
DROP POLICY IF EXISTS "Authors can manage their templates" ON automation_templates;

-- Automation Triggers
CREATE POLICY "Builders can manage automation triggers"
  ON automation_triggers FOR ALL
  USING (
    automation_id IN (
      SELECT id FROM automations WHERE builder_id = auth.uid()
    )
  );

-- Automation Actions
CREATE POLICY "Builders can manage automation actions"
  ON automation_actions FOR ALL
  USING (
    automation_id IN (
      SELECT id FROM automations WHERE builder_id = auth.uid()
    )
  );

-- Automation Executions (read-only for builders)
CREATE POLICY "Builders can view automation executions"
  ON automation_executions FOR SELECT
  USING (
    automation_id IN (
      SELECT id FROM automations WHERE builder_id = auth.uid()
    )
  );

-- Automation Schedule
CREATE POLICY "Builders can manage automation schedules"
  ON automation_schedule FOR ALL
  USING (
    automation_id IN (
      SELECT id FROM automations WHERE builder_id = auth.uid()
    )
  );

-- Automation Templates
CREATE POLICY "Everyone can view public templates"
  ON automation_templates FOR SELECT
  USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "Authors can manage their templates"
  ON automation_templates FOR ALL
  USING (created_by = auth.uid());

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON TABLE automation_triggers IS 'Defines what events trigger an automation workflow';
COMMENT ON TABLE automation_actions IS 'Defines the actions executed in an automation workflow';
COMMENT ON TABLE automation_executions IS 'Logs all automation execution attempts and results';
COMMENT ON TABLE automation_schedule IS 'Manages scheduled/recurring automation executions';
COMMENT ON TABLE automation_templates IS 'Pre-built automation workflows that can be cloned';

COMMENT ON COLUMN automation_triggers.trigger_type IS 'Type of event that triggers the automation';
COMMENT ON COLUMN automation_triggers.config IS 'Configuration specific to the trigger type';
COMMENT ON COLUMN automation_triggers.filters IS 'Additional filter conditions for the trigger';

COMMENT ON COLUMN automation_actions.step_number IS 'Order of execution in the workflow';
COMMENT ON COLUMN automation_actions.action_type IS 'Type of action to execute';
COMMENT ON COLUMN automation_actions.config IS 'Configuration specific to the action type';
COMMENT ON COLUMN automation_actions.execute_if IS 'Conditional logic for executing this action';

COMMENT ON COLUMN automation_executions.status IS 'Current status of the execution';
COMMENT ON COLUMN automation_executions.action_results IS 'Detailed results for each action step';

