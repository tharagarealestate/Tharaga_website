-- =============================================
-- RAZORPAY AUTOMATION TRIGGER SUBSCRIPTIONS
-- Example trigger subscriptions for Razorpay webhook events
-- These can be attached to automations when created
-- =============================================

-- Note: These are template trigger subscriptions that can be used
-- when creating automations. They don't require an automation_id initially.
-- When an automation is created, it can reference these trigger types.

-- Example: Create a system-level automation template for subscription activated
-- This would be used when a builder creates an automation for "Send welcome email on subscription"

-- The actual trigger subscriptions will be created per-automation via the API
-- This migration just ensures the structure is ready

-- Add comment to automation_trigger_subscriptions table
COMMENT ON TABLE automation_trigger_subscriptions IS 
'Stores trigger subscriptions for automations. Each subscription listens for specific events (database, behavior, webhook, schedule) and triggers the associated automation when conditions are met.';

-- Create a function to help create Razorpay webhook trigger subscriptions
CREATE OR REPLACE FUNCTION create_razorpay_webhook_subscription(
  p_automation_id UUID,
  p_builder_id UUID,
  p_event_type TEXT,
  p_conditions JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_subscription_id UUID;
BEGIN
  INSERT INTO automation_trigger_subscriptions (
    automation_id,
    builder_id,
    trigger_type,
    event_source,
    event_type,
    conditions,
    is_active,
    is_paused
  ) VALUES (
    p_automation_id,
    p_builder_id,
    'webhook',
    'razorpay',
    p_event_type,
    p_conditions,
    true,
    false
  )
  RETURNING id INTO v_subscription_id;
  
  RETURN v_subscription_id;
END;
$$ LANGUAGE plpgsql;

-- Create a function to help create Razorpay webhook trigger subscriptions with common patterns
COMMENT ON FUNCTION create_razorpay_webhook_subscription IS 
'Helper function to create Razorpay webhook trigger subscriptions. Usage: SELECT create_razorpay_webhook_subscription(automation_id, builder_id, event_type, conditions)';

-- Example trigger subscription types for Razorpay (documentation only - actual subscriptions created via API):
-- 1. subscription.charged - When subscription payment is successful
-- 2. subscription.activated - When subscription becomes active
-- 3. subscription.cancelled - When subscription is cancelled
-- 4. subscription.paused - When subscription is paused
-- 5. subscription.resumed - When subscription is resumed
-- 6. payment.failed - When payment fails
-- 7. payment.captured - When payment is captured
-- 8. invoice.paid - When invoice is paid
-- 9. invoice.payment_failed - When invoice payment fails

-- Add index for faster webhook event lookups
CREATE INDEX IF NOT EXISTS idx_trigger_subs_razorpay 
ON automation_trigger_subscriptions(event_source, event_type) 
WHERE event_source = 'razorpay' AND is_active = true;








