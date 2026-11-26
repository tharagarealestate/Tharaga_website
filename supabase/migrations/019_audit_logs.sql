-- Create audit_logs table for tracking sensitive actions
-- This table stores security-relevant events for compliance and debugging

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL, -- 'login', 'update_lead', 'delete_property', etc.
  resource_type text NOT NULL, -- 'lead', 'property', 'user', etc.
  resource_id uuid,
  ip_address inet,
  user_agent text,
  metadata jsonb, -- Additional context
  timestamp timestamptz NOT NULL DEFAULT now()
);

-- Indexes for querying audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON public.audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_ip ON public.audit_logs(ip_address);

-- Index for time-based queries (last N days)
CREATE INDEX IF NOT EXISTS idx_audit_logs_time_range 
  ON public.audit_logs(timestamp DESC, action);

-- Row Level Security
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view all audit logs
CREATE POLICY "Admins can view all audit logs" 
  ON public.audit_logs 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Users can view their own audit logs
CREATE POLICY "Users can view own audit logs" 
  ON public.audit_logs 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Service role can insert audit logs (for API usage)
CREATE POLICY "Service role can insert audit logs" 
  ON public.audit_logs 
  FOR INSERT 
  WITH CHECK (true);

-- Function to automatically log auth events
CREATE OR REPLACE FUNCTION public.handle_auth_log()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log successful login when last_sign_in_at is set for first time
  IF (TG_OP = 'UPDATE' AND NEW.last_sign_in_at IS NOT NULL AND OLD.last_sign_in_at IS NULL) THEN
    BEGIN
      INSERT INTO public.audit_logs (user_id, action, resource_type, ip_address, user_agent)
      VALUES (NEW.id, 'login', 'auth', NULL, NULL);
    EXCEPTION WHEN others THEN
      -- Swallow errors to avoid breaking auth flow
      NULL;
    END;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger on auth.users for login events
DROP TRIGGER IF EXISTS on_auth_user_login ON auth.users;
CREATE TRIGGER on_auth_user_login
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_auth_log();

-- Comments
COMMENT ON TABLE public.audit_logs IS 'Audit trail for security-relevant actions';
COMMENT ON COLUMN public.audit_logs.action IS 'Type of action performed (login, update, delete, etc.)';
COMMENT ON COLUMN public.audit_logs.resource_type IS 'Type of resource affected (lead, property, user, etc.)';
COMMENT ON COLUMN public.audit_logs.resource_id IS 'ID of the specific resource affected';
COMMENT ON COLUMN public.audit_logs.metadata IS 'Additional JSON context about the action';
COMMENT ON COLUMN public.audit_logs.ip_address IS 'IP address of the requester';
COMMENT ON COLUMN public.audit_logs.user_agent IS 'User agent string';

