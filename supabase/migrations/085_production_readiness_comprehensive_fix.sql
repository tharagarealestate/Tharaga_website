-- =============================================================================
-- MIGRATION 085: PRODUCTION READINESS COMPREHENSIVE FIX  [run: 2026-05-06-v5]
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.property_marketing_automation_logs (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id     UUID        NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  builder_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id     TEXT,
  automation_type TEXT        NOT NULL DEFAULT 'auto_trigger',
  status          TEXT        NOT NULL DEFAULT 'success'
                  CHECK (status IN ('success', 'partial', 'failed', 'skipped')),
  details         JSONB       DEFAULT '{}'::jsonb,
  error_message   TEXT,
  test_mode       BOOLEAN     DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pmal_property ON public.property_marketing_automation_logs(property_id);
CREATE INDEX IF NOT EXISTS idx_pmal_builder  ON public.property_marketing_automation_logs(builder_id);
CREATE INDEX IF NOT EXISTS idx_pmal_status   ON public.property_marketing_automation_logs(status);
CREATE INDEX IF NOT EXISTS idx_pmal_created  ON public.property_marketing_automation_logs(created_at DESC);

ALTER TABLE public.property_marketing_automation_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public'
    AND tablename='property_marketing_automation_logs'
    AND policyname='builders_view_own_automation_logs') THEN
    CREATE POLICY "builders_view_own_automation_logs"
      ON public.property_marketing_automation_logs FOR SELECT USING (builder_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public'
    AND tablename='property_marketing_automation_logs'
    AND policyname='service_role_full_access_automation_logs') THEN
    CREATE POLICY "service_role_full_access_automation_logs"
      ON public.property_marketing_automation_logs FOR ALL
      USING (auth.jwt() ->> 'role' = 'service_role')
      WITH CHECK (auth.jwt() ->> 'role' = 'service_role');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.workflow_execution_queue (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id     UUID        NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  builder_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workflow_name   TEXT        NOT NULL,
  webhook_path    TEXT        NOT NULL,
  payload         JSONB       NOT NULL DEFAULT '{}'::jsonb,
  priority        TEXT        NOT NULL DEFAULT 'high'
                  CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  status          TEXT        NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'skipped')),
  scheduled_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  attempt_count   INTEGER     NOT NULL DEFAULT 0,
  max_attempts    INTEGER     NOT NULL DEFAULT 3,
  error_message   TEXT,
  response_body   JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_weq_pending  ON public.workflow_execution_queue(status, scheduled_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_weq_property ON public.workflow_execution_queue(property_id);
CREATE INDEX IF NOT EXISTS idx_weq_priority ON public.workflow_execution_queue(priority, scheduled_at) WHERE status = 'pending';

ALTER TABLE public.workflow_execution_queue ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public'
    AND tablename='workflow_execution_queue' AND policyname='builders_view_own_workflow_queue') THEN
    CREATE POLICY "builders_view_own_workflow_queue"
      ON public.workflow_execution_queue FOR SELECT USING (builder_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public'
    AND tablename='workflow_execution_queue' AND policyname='service_role_full_access_workflow_queue') THEN
    CREATE POLICY "service_role_full_access_workflow_queue"
      ON public.workflow_execution_queue FOR ALL
      USING (auth.jwt() ->> 'role' = 'service_role')
      WITH CHECK (auth.jwt() ->> 'role' = 'service_role');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public'
    AND tablename='properties' AND policyname='builders_insert_own_properties') THEN
    CREATE POLICY "builders_insert_own_properties"
      ON public.properties FOR INSERT TO authenticated WITH CHECK (builder_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public'
    AND tablename='properties' AND policyname='builders_select_own_properties') THEN
    CREATE POLICY "builders_select_own_properties"
      ON public.properties FOR SELECT TO authenticated USING (builder_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public'
    AND tablename='properties' AND policyname='builders_update_own_properties') THEN
    CREATE POLICY "builders_update_own_properties"
      ON public.properties FOR UPDATE TO authenticated
      USING (builder_id = auth.uid()) WITH CHECK (builder_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public'
    AND tablename='properties' AND policyname='public_view_active_properties') THEN
    CREATE POLICY "public_view_active_properties"
      ON public.properties FOR SELECT
      USING (listing_status IN ('active','published','available') OR status IN ('active','published','available'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public'
    AND tablename='properties' AND policyname='service_role_full_access_properties') THEN
    CREATE POLICY "service_role_full_access_properties"
      ON public.properties FOR ALL
      USING (auth.jwt() ->> 'role' = 'service_role')
      WITH CHECK (auth.jwt() ->> 'role' = 'service_role');
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.trigger_property_marketing_automation()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE v_payload JSONB; v_effective_status TEXT;
BEGIN
  v_effective_status := COALESCE(NEW.listing_status, NEW.status, '');
  IF v_effective_status IN ('active','available','published')
     AND COALESCE(NEW.marketing_automation_enabled, true) = true THEN
    v_payload := jsonb_build_object('event','property_inserted','record',
      jsonb_build_object('id',NEW.id,'builder_id',NEW.builder_id,'title',NEW.title,
        'price',COALESCE(NEW.price,NEW.price_inr),'price_inr',NEW.price_inr,
        'location',NEW.location,'city',NEW.city,'locality',NEW.locality,
        'bhk_type',NEW.bhk_type,'property_type',NEW.property_type,
        'carpet_area',NEW.carpet_area,'sqft',NEW.sqft,'amenities',NEW.amenities,
        'images',NEW.images,'listing_status',v_effective_status,'created_at',NEW.created_at),
      'timestamp',NOW());
    INSERT INTO public.webhook_logs(source,event_type,event_id,body,status,metadata)
    VALUES('supabase','property.insert',NEW.id::TEXT,v_payload,'pending',
      jsonb_build_object('property_id',NEW.id,'builder_id',NEW.builder_id,'trigger','marketing_automation'));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS property_marketing_automation_trigger ON public.properties;
CREATE TRIGGER property_marketing_automation_trigger
  AFTER INSERT OR UPDATE OF listing_status, status
  ON public.properties FOR EACH ROW
  EXECUTE FUNCTION public.trigger_property_marketing_automation();

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public'
    AND tablename='property_marketing_strategies'
    AND policyname='service_role_insert_marketing_strategies') THEN
    CREATE POLICY "service_role_insert_marketing_strategies"
      ON public.property_marketing_strategies FOR ALL
      USING (auth.jwt() ->> 'role' = 'service_role')
      WITH CHECK (auth.jwt() ->> 'role' = 'service_role');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public'
    AND tablename='property_content_library'
    AND policyname='service_role_insert_content_library') THEN
    CREATE POLICY "service_role_insert_content_library"
      ON public.property_content_library FOR ALL
      USING (auth.jwt() ->> 'role' = 'service_role')
      WITH CHECK (auth.jwt() ->> 'role' = 'service_role');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public'
    AND tablename='property_media_assets'
    AND policyname='service_role_insert_media_assets') THEN
    CREATE POLICY "service_role_insert_media_assets"
      ON public.property_media_assets FOR ALL
      USING (auth.jwt() ->> 'role' = 'service_role')
      WITH CHECK (auth.jwt() ->> 'role' = 'service_role');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public'
    AND tablename='property_landing_pages'
    AND policyname='service_role_insert_landing_pages') THEN
    CREATE POLICY "service_role_insert_landing_pages"
      ON public.property_landing_pages FOR ALL
      USING (auth.jwt() ->> 'role' = 'service_role')
      WITH CHECK (auth.jwt() ->> 'role' = 'service_role');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public'
    AND tablename='whatsapp_campaigns'
    AND policyname='service_role_insert_whatsapp_campaigns') THEN
    CREATE POLICY "service_role_insert_whatsapp_campaigns"
      ON public.whatsapp_campaigns FOR ALL
      USING (auth.jwt() ->> 'role' = 'service_role')
      WITH CHECK (auth.jwt() ->> 'role' = 'service_role');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public'
    AND tablename='whatsapp_messages'
    AND policyname='service_role_insert_whatsapp_messages') THEN
    CREATE POLICY "service_role_insert_whatsapp_messages"
      ON public.whatsapp_messages FOR ALL
      USING (auth.jwt() ->> 'role' = 'service_role')
      WITH CHECK (auth.jwt() ->> 'role' = 'service_role');
  END IF;
END $$;

ALTER DATABASE postgres SET statement_timeout = '30s';

CREATE INDEX IF NOT EXISTS idx_webhook_logs_pending_trigger
  ON public.webhook_logs(status, created_at) WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_properties_listing_status_active
  ON public.properties(listing_status, builder_id)
  WHERE listing_status IN ('active','available','published');

COMMENT ON TABLE public.property_marketing_automation_logs IS 'Audit log for every marketing automation run per property';
COMMENT ON TABLE public.workflow_execution_queue IS 'Serverless-safe async job queue; populated by intelligence-engine, drained by cron';
