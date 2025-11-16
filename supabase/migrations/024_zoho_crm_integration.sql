-- =============================================
-- ZOHO CRM INTEGRATION TABLES
-- Field mappings, record mappings, sync logs
-- =============================================

-- =============================================
-- 1. CRM FIELD MAPPINGS TABLE
-- Maps Tharaga fields to CRM fields
-- =============================================
CREATE TABLE IF NOT EXISTS public.crm_field_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id uuid NOT NULL REFERENCES public.integrations(id) ON DELETE CASCADE,
  tharaga_field text NOT NULL,
  crm_field text NOT NULL,
  transform_type text NOT NULL DEFAULT 'direct' CHECK (transform_type IN ('direct', 'custom', 'formula')),
  transform_rule jsonb DEFAULT '{}'::jsonb,
  sync_direction text NOT NULL DEFAULT 'bidirectional' CHECK (sync_direction IN ('to_crm', 'from_crm', 'bidirectional')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(integration_id, tharaga_field, crm_field)
);

CREATE INDEX IF NOT EXISTS idx_crm_field_mappings_integration_id ON public.crm_field_mappings(integration_id);
CREATE INDEX IF NOT EXISTS idx_crm_field_mappings_is_active ON public.crm_field_mappings(is_active);

COMMENT ON TABLE public.crm_field_mappings IS 'Maps Tharaga fields to CRM provider fields (Zoho, Salesforce, etc.)';

-- =============================================
-- 2. CRM RECORD MAPPINGS TABLE
-- Maps Tharaga records to CRM records
-- =============================================
CREATE TABLE IF NOT EXISTS public.crm_record_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id uuid NOT NULL REFERENCES public.integrations(id) ON DELETE CASCADE,
  record_type text NOT NULL CHECK (record_type IN ('lead', 'deal', 'property', 'contact')),
  tharaga_id uuid NOT NULL,
  crm_id text NOT NULL,
  sync_status text NOT NULL DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'failed', 'conflict')),
  last_synced_at timestamptz NOT NULL DEFAULT now(),
  sync_metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(integration_id, record_type, tharaga_id)
);

CREATE INDEX IF NOT EXISTS idx_crm_record_mappings_integration_id ON public.crm_record_mappings(integration_id);
CREATE INDEX IF NOT EXISTS idx_crm_record_mappings_record_type ON public.crm_record_mappings(record_type);
CREATE INDEX IF NOT EXISTS idx_crm_record_mappings_tharaga_id ON public.crm_record_mappings(tharaga_id);
CREATE INDEX IF NOT EXISTS idx_crm_record_mappings_crm_id ON public.crm_record_mappings(crm_id);
CREATE INDEX IF NOT EXISTS idx_crm_record_mappings_sync_status ON public.crm_record_mappings(sync_status);

COMMENT ON TABLE public.crm_record_mappings IS 'Maps Tharaga records (leads, deals) to CRM records';

-- =============================================
-- 3. CRM SYNC LOG TABLE
-- Logs all sync operations
-- =============================================
CREATE TABLE IF NOT EXISTS public.crm_sync_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id uuid NOT NULL REFERENCES public.integrations(id) ON DELETE CASCADE,
  sync_type text NOT NULL CHECK (sync_type IN ('lead', 'deal', 'property', 'contact', 'batch')),
  sync_direction text NOT NULL CHECK (sync_direction IN ('to_crm', 'from_crm')),
  tharaga_id uuid,
  crm_id text,
  status text NOT NULL CHECK (status IN ('success', 'failed', 'partial')),
  error_message text,
  error_code text,
  sync_started_at timestamptz NOT NULL DEFAULT now(),
  sync_completed_at timestamptz,
  records_processed integer DEFAULT 0,
  records_successful integer DEFAULT 0,
  records_failed integer DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_crm_sync_log_integration_id ON public.crm_sync_log(integration_id);
CREATE INDEX IF NOT EXISTS idx_crm_sync_log_sync_type ON public.crm_sync_log(sync_type);
CREATE INDEX IF NOT EXISTS idx_crm_sync_log_status ON public.crm_sync_log(status);
CREATE INDEX IF NOT EXISTS idx_crm_sync_log_sync_started_at ON public.crm_sync_log(sync_started_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_sync_log_tharaga_id ON public.crm_sync_log(tharaga_id);

COMMENT ON TABLE public.crm_sync_log IS 'Logs all CRM sync operations for debugging and auditing';

-- =============================================
-- 4. ADD MISSING COLUMNS TO INTEGRATIONS TABLE
-- =============================================
DO $$
BEGIN
  -- Add crm_account_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'integrations' 
    AND column_name = 'crm_account_id'
  ) THEN
    ALTER TABLE public.integrations ADD COLUMN crm_account_id text;
  END IF;

  -- Add crm_account_name if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'integrations' 
    AND column_name = 'crm_account_name'
  ) THEN
    ALTER TABLE public.integrations ADD COLUMN crm_account_name text;
  END IF;
END $$;

-- =============================================
-- 5. UPDATED_AT TRIGGERS
-- =============================================

-- CRM Field Mappings updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_crm_field_mappings_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_crm_field_mappings_updated_at ON public.crm_field_mappings;
CREATE TRIGGER on_crm_field_mappings_updated_at
  BEFORE UPDATE ON public.crm_field_mappings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_crm_field_mappings_updated_at();

-- CRM Record Mappings updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_crm_record_mappings_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_crm_record_mappings_updated_at ON public.crm_record_mappings;
CREATE TRIGGER on_crm_record_mappings_updated_at
  BEFORE UPDATE ON public.crm_record_mappings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_crm_record_mappings_updated_at();

-- =============================================
-- 6. ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS
ALTER TABLE public.crm_field_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_record_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_sync_log ENABLE ROW LEVEL SECURITY;

-- CRM Field Mappings policies
CREATE POLICY "Users can view their own field mappings"
  ON public.crm_field_mappings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.integrations i
      WHERE i.id = crm_field_mappings.integration_id
      AND i.builder_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own field mappings"
  ON public.crm_field_mappings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.integrations i
      WHERE i.id = crm_field_mappings.integration_id
      AND i.builder_id = auth.uid()
    )
  );

-- CRM Record Mappings policies
CREATE POLICY "Users can view their own record mappings"
  ON public.crm_record_mappings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.integrations i
      WHERE i.id = crm_record_mappings.integration_id
      AND i.builder_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own record mappings"
  ON public.crm_record_mappings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.integrations i
      WHERE i.id = crm_record_mappings.integration_id
      AND i.builder_id = auth.uid()
    )
  );

-- CRM Sync Log policies
CREATE POLICY "Users can view their own sync logs"
  ON public.crm_sync_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.integrations i
      WHERE i.id = crm_sync_log.integration_id
      AND i.builder_id = auth.uid()
    )
  );

CREATE POLICY "System can insert sync logs"
  ON public.crm_sync_log FOR INSERT
  WITH CHECK (true);

-- =============================================
-- 7. HELPER FUNCTIONS
-- =============================================

-- Function to get sync statistics
CREATE OR REPLACE FUNCTION public.get_crm_sync_stats(p_integration_id uuid)
RETURNS TABLE (
  total_syncs bigint,
  successful_syncs bigint,
  failed_syncs bigint,
  last_sync_at timestamptz
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::bigint as total_syncs,
    COUNT(*) FILTER (WHERE status = 'success')::bigint as successful_syncs,
    COUNT(*) FILTER (WHERE status = 'failed')::bigint as failed_syncs,
    MAX(sync_completed_at) as last_sync_at
  FROM public.crm_sync_log
  WHERE integration_id = p_integration_id
  AND sync_completed_at IS NOT NULL;
END;
$$;

COMMENT ON FUNCTION public.get_crm_sync_stats IS 'Get sync statistics for an integration';









