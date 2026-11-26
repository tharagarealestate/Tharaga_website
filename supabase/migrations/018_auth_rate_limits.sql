-- Create auth_rate_limits table for tracking authentication attempts
-- This table is used by the auth-rate-limit edge function to prevent brute force attacks

CREATE TABLE IF NOT EXISTS public.auth_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address inet NOT NULL,
  email text,
  endpoint text NOT NULL, -- 'login', 'otp', 'password_reset'
  timestamp timestamptz NOT NULL DEFAULT now(),
  
  -- Constraints
  CHECK (endpoint IN ('login', 'otp', 'password_reset'))
);

-- Index for rate limit lookups
CREATE INDEX IF NOT EXISTS idx_auth_rate_limits_lookup 
  ON public.auth_rate_limits(ip_address, email, endpoint, timestamp);

-- Index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_auth_rate_limits_timestamp 
  ON public.auth_rate_limits(timestamp);

-- TTL (Time To Live) - automatic cleanup of records older than 24 hours
-- This is handled by a scheduled job or we can rely on periodic cleanup in the function
-- Alternatively, we can use pg_cron if available

-- Row Level Security
ALTER TABLE public.auth_rate_limits ENABLE ROW LEVEL SECURITY;

-- Note: Service role automatically bypasses RLS, no policy needed
-- But we add this for clarity and consistency with Edge Functions
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'auth_rate_limits' 
    AND policyname = 'Service role can manage rate limits'
  ) THEN
    CREATE POLICY "Service role can manage rate limits" 
      ON public.auth_rate_limits 
      FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Comments
COMMENT ON TABLE public.auth_rate_limits IS 'Stores authentication attempt records for rate limiting';
COMMENT ON COLUMN public.auth_rate_limits.ip_address IS 'IP address of the requester';
COMMENT ON COLUMN public.auth_rate_limits.email IS 'Email of the user attempting authentication (if provided)';
COMMENT ON COLUMN public.auth_rate_limits.endpoint IS 'The authentication endpoint being accessed';
COMMENT ON COLUMN public.auth_rate_limits.timestamp IS 'When this attempt was recorded';

