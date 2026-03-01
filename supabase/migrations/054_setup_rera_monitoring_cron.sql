-- =====================================================
-- SETUP RERA MONITORING CRON JOB
-- =====================================================
-- This migration sets up pg_cron to call the RERA monitoring
-- edge function daily at 2 AM IST (8:30 PM UTC previous day)
-- =====================================================

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL ON SCHEMA cron TO postgres;

-- Function to call the RERA monitoring edge function
CREATE OR REPLACE FUNCTION call_rera_monitor_edge_function()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_response text;
  v_url text;
  v_service_role_key text;
BEGIN
  -- Get Supabase URL and service role key from environment
  -- In Supabase, these are available via current_setting
  v_url := current_setting('app.settings.supabase_url', true);
  v_service_role_key := current_setting('app.settings.service_role_key', true);
  
  -- If not set via settings, use default Supabase project URL pattern
  -- You'll need to replace with your actual project URL
  IF v_url IS NULL THEN
    v_url := 'https://wedevtjjmdvngyshqdro.supabase.co';
  END IF;
  
  -- Construct the edge function URL
  v_url := v_url || '/functions/v1/rera-monitor';
  
  -- Make HTTP request to edge function
  -- Note: This requires http extension
  BEGIN
    SELECT content INTO v_response
    FROM http((
      'POST',
      v_url,
      ARRAY[
        http_header('Content-Type', 'application/json'),
        http_header('Authorization', 'Bearer ' || COALESCE(v_service_role_key, 'your-service-role-key'))
      ],
      'application/json',
      '{}'
    )::http_request);
    
    RAISE NOTICE 'RERA monitoring called: %', v_response;
  EXCEPTION WHEN OTHERS THEN
    -- If http extension is not available, log error but don't fail
    RAISE WARNING 'Failed to call RERA monitoring edge function: %', SQLERRM;
  END;
END;
$$;

-- Alternative: Direct database monitoring (doesn't require http extension)
-- This calls the database function directly
CREATE OR REPLACE FUNCTION run_rera_monitoring()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Call the check_rera_expiry function
  PERFORM check_rera_expiry();
  
  RAISE NOTICE 'RERA monitoring completed at %', NOW();
END;
$$;

-- Schedule the cron job to run daily at 2 AM IST (8:30 PM UTC previous day)
-- Format: minute hour day month weekday
-- 30 20 * * * = 8:30 PM UTC daily (2:00 AM IST next day)
DO $$
BEGIN
  -- Unschedule if exists
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'rera-daily-monitoring') THEN
    PERFORM cron.unschedule('rera-daily-monitoring');
  END IF;
  
  -- Schedule daily monitoring
  PERFORM cron.schedule(
    'rera-daily-monitoring',
    '30 20 * * *', -- 8:30 PM UTC = 2:00 AM IST
    'SELECT run_rera_monitoring();'
  );
  
  -- Unschedule weekly if exists
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'rera-weekly-deep-check') THEN
    PERFORM cron.unschedule('rera-weekly-deep-check');
  END IF;
  
  -- Schedule weekly deep check
  PERFORM cron.schedule(
    'rera-weekly-deep-check',
    '30 21 * * 6', -- 9:30 PM UTC Saturday = 3:00 AM IST Sunday
    'SELECT run_rera_monitoring();'
  );
END $$;

-- Comment on the cron jobs
COMMENT ON FUNCTION run_rera_monitoring() IS 'Runs daily RERA monitoring checks: expired, expiring soon, and stale verifications';

-- =====================================================
-- MANUAL TRIGGER FUNCTION (for testing)
-- =====================================================
-- You can call this manually to test: SELECT trigger_rera_monitoring();
CREATE OR REPLACE FUNCTION trigger_rera_monitoring()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result text;
BEGIN
  PERFORM run_rera_monitoring();
  v_result := 'RERA monitoring triggered successfully at ' || NOW()::text;
  RETURN v_result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION run_rera_monitoring() TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_rera_monitoring() TO authenticated;

-- =====================================================
-- NOTES
-- =====================================================
-- 1. The cron job runs daily at 2 AM IST (8:30 PM UTC)
-- 2. To test manually, run: SELECT trigger_rera_monitoring();
-- 3. To view cron jobs: SELECT * FROM cron.job;
-- 4. To unschedule: SELECT cron.unschedule('rera-daily-monitoring');
-- 5. To reschedule: First unschedule, then create new schedule
-- 6. The function uses SECURITY DEFINER to run with elevated privileges
-- 7. Make sure pg_cron extension is enabled in your Supabase project

