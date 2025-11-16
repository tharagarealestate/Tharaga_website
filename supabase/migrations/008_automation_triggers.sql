-- =============================================
-- AUTOMATION TRIGGER EVENTS TABLE
-- Stores all trigger events and their execution history
-- =============================================
CREATE TABLE IF NOT EXISTS automation_trigger_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_type TEXT NOT NULL, -- 'database', 'behavior', 'webhook', 'schedule'
  trigger_name TEXT NOT NULL,
  event_source TEXT NOT NULL, -- 'leads', 'user_behaviors', 'integrations', etc.
  event_type TEXT NOT NULL, -- 'insert', 'update', 'delete', 'custom'
  event_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  conditions JSONB, -- Trigger conditions to evaluate
  
  -- Execution tracking
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'evaluating', 'triggered', 'skipped', 'failed'
  evaluation_result JSONB, -- Result of condition evaluation
  matched_automations TEXT[], -- Array of automation IDs that were triggered
  
  -- Context
  lead_id UUID,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  builder_id UUID, -- Use builder_id instead of organization_id for compatibility
  
  -- Metadata
  executed_at TIMESTAMPTZ,
  error_message TEXT,
  processing_time_ms INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_trigger_events_type ON automation_trigger_events(trigger_type);
CREATE INDEX IF NOT EXISTS idx_trigger_events_status ON automation_trigger_events(status);
CREATE INDEX IF NOT EXISTS idx_trigger_events_lead ON automation_trigger_events(lead_id) WHERE lead_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_trigger_events_created ON automation_trigger_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trigger_events_builder ON automation_trigger_events(builder_id) WHERE builder_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_trigger_events_user ON automation_trigger_events(user_id) WHERE user_id IS NOT NULL;

-- =============================================
-- TRIGGER SUBSCRIPTIONS TABLE
-- Defines active trigger listeners for each automation
-- =============================================
CREATE TABLE IF NOT EXISTS automation_trigger_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id UUID NOT NULL REFERENCES automations(id) ON DELETE CASCADE,
  builder_id UUID, -- Use builder_id instead of organization_id for compatibility
  
  -- Trigger configuration
  trigger_type TEXT NOT NULL, -- 'database', 'behavior', 'webhook', 'schedule'
  event_source TEXT NOT NULL,
  event_type TEXT NOT NULL,
  
  -- Condition rules (JSON-based rule engine)
  conditions JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Schedule configuration (for scheduled triggers)
  schedule_cron TEXT, -- Cron expression for scheduled triggers
  schedule_timezone TEXT DEFAULT 'UTC',
  last_triggered_at TIMESTAMPTZ,
  next_trigger_at TIMESTAMPTZ,
  
  -- State
  is_active BOOLEAN DEFAULT true,
  is_paused BOOLEAN DEFAULT false,
  
  -- Statistics
  total_events_received INTEGER DEFAULT 0,
  total_events_matched INTEGER DEFAULT 0,
  total_executions INTEGER DEFAULT 0,
  last_execution_at TIMESTAMPTZ,
  last_error TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_trigger_subs_automation ON automation_trigger_subscriptions(automation_id);
CREATE INDEX IF NOT EXISTS idx_trigger_subs_builder ON automation_trigger_subscriptions(builder_id) WHERE builder_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_trigger_subs_active ON automation_trigger_subscriptions(is_active, is_paused) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_trigger_subs_next_trigger ON automation_trigger_subscriptions(next_trigger_at) WHERE next_trigger_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_trigger_subs_type_source ON automation_trigger_subscriptions(trigger_type, event_source, event_type);

-- =============================================
-- UPDATE TIMESTAMP TRIGGERS
-- =============================================

CREATE OR REPLACE FUNCTION update_automation_trigger_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_trigger_events_updated_at ON automation_trigger_events;
CREATE TRIGGER update_trigger_events_updated_at
  BEFORE UPDATE ON automation_trigger_events
  FOR EACH ROW
  EXECUTE FUNCTION update_automation_trigger_events_updated_at();

CREATE OR REPLACE FUNCTION update_automation_trigger_subs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_trigger_subs_updated_at ON automation_trigger_subscriptions;
CREATE TRIGGER update_trigger_subs_updated_at
  BEFORE UPDATE ON automation_trigger_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_automation_trigger_subs_updated_at();

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE automation_trigger_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_trigger_subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their org trigger events" ON automation_trigger_events;
DROP POLICY IF EXISTS "System can insert trigger events" ON automation_trigger_events;
DROP POLICY IF EXISTS "Users can view their org trigger subscriptions" ON automation_trigger_subscriptions;
DROP POLICY IF EXISTS "Admins can manage trigger subscriptions" ON automation_trigger_subscriptions;
DROP POLICY IF EXISTS "Builders can view their trigger events" ON automation_trigger_events;
DROP POLICY IF EXISTS "Builders can manage their trigger subscriptions" ON automation_trigger_subscriptions;

-- Trigger events policies (using builder_id)
CREATE POLICY "Builders can view their trigger events"
  ON automation_trigger_events FOR SELECT
  USING (
    builder_id = auth.uid() OR
    builder_id IN (
      SELECT id FROM builders WHERE id = auth.uid()
    )
  );

CREATE POLICY "System can insert trigger events"
  ON automation_trigger_events FOR INSERT
  WITH CHECK (true);

-- Trigger subscriptions policies (using builder_id)
CREATE POLICY "Builders can view their trigger subscriptions"
  ON automation_trigger_subscriptions FOR SELECT
  USING (
    builder_id = auth.uid() OR
    automation_id IN (
      SELECT id FROM automations WHERE builder_id = auth.uid()
    )
  );

CREATE POLICY "Builders can manage their trigger subscriptions"
  ON automation_trigger_subscriptions FOR ALL
  USING (
    builder_id = auth.uid() OR
    automation_id IN (
      SELECT id FROM automations WHERE builder_id = auth.uid()
    )
  );

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON TABLE automation_trigger_events IS 'Stores all automation trigger events and their execution history';
COMMENT ON TABLE automation_trigger_subscriptions IS 'Defines active trigger listeners for each automation';

COMMENT ON COLUMN automation_trigger_events.trigger_type IS 'Type of trigger: database, behavior, webhook, schedule';
COMMENT ON COLUMN automation_trigger_events.event_source IS 'Source table or system generating the event';
COMMENT ON COLUMN automation_trigger_events.event_type IS 'Type of event: insert, update, delete, custom';
COMMENT ON COLUMN automation_trigger_events.matched_automations IS 'Array of automation IDs that matched this trigger event';

COMMENT ON COLUMN automation_trigger_subscriptions.trigger_type IS 'Type of trigger subscription';
COMMENT ON COLUMN automation_trigger_subscriptions.conditions IS 'JSON-based rule engine conditions for matching events';
COMMENT ON COLUMN automation_trigger_subscriptions.schedule_cron IS 'Cron expression for scheduled triggers';








