-- =============================================
-- TWILIO MESSAGING SYSTEM
-- Migration: 022_twilio_messaging.sql
-- Created: 2025-01-XX
-- =============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. MESSAGE_TEMPLATES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  builder_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('sms', 'whatsapp')),
  body TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb, -- Array of variable names like ['name', 'property_name']
  is_active BOOLEAN DEFAULT true,
  times_used INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for message_templates
CREATE INDEX IF NOT EXISTS idx_message_templates_user_id ON public.message_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_message_templates_builder_id ON public.message_templates(builder_id);
CREATE INDEX IF NOT EXISTS idx_message_templates_type ON public.message_templates(type);
CREATE INDEX IF NOT EXISTS idx_message_templates_is_active ON public.message_templates(is_active);

-- =============================================
-- 2. UPDATE LEAD_INTERACTIONS TABLE
-- Add support for SMS/WhatsApp interaction types
-- =============================================

-- Update the interaction_type check constraint to include SMS/WhatsApp types
-- First, drop the existing constraint if it exists
DO $$
DECLARE
  constraint_name_var TEXT;
BEGIN
  -- Find and drop existing constraint
  SELECT constraint_name INTO constraint_name_var
  FROM information_schema.table_constraints 
  WHERE constraint_schema = 'public'
    AND table_name = 'lead_interactions'
    AND constraint_type = 'CHECK'
    AND constraint_name LIKE '%interaction_type%';
  
  IF constraint_name_var IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.lead_interactions DROP CONSTRAINT %I', constraint_name_var);
  END IF;
END $$;

-- Add new constraint with SMS/WhatsApp types
ALTER TABLE public.lead_interactions 
ADD CONSTRAINT lead_interactions_interaction_type_check 
CHECK (interaction_type IN (
  'phone_call',
  'email_sent',
  'whatsapp_message',
  'sms_sent',
  'whatsapp_sent',
  'site_visit_scheduled',
  'site_visit_completed',
  'negotiation_started',
  'offer_made',
  'offer_accepted',
  'offer_rejected',
  'deal_closed',
  'deal_lost'
));

-- Update status constraint to include 'sent' status
DO $$
DECLARE
  constraint_name_var TEXT;
BEGIN
  -- Find and drop existing constraint
  SELECT constraint_name INTO constraint_name_var
  FROM information_schema.table_constraints 
  WHERE constraint_schema = 'public'
    AND table_name = 'lead_interactions'
    AND constraint_type = 'CHECK'
    AND constraint_name LIKE '%status%';
  
  IF constraint_name_var IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.lead_interactions DROP CONSTRAINT %I', constraint_name_var);
  END IF;
END $$;

ALTER TABLE public.lead_interactions 
ADD CONSTRAINT lead_interactions_status_check 
CHECK (status IN ('pending', 'completed', 'cancelled', 'no_response', 'sent', 'delivered', 'failed'));

-- =============================================
-- 3. MESSAGE_CAMPAIGNS TABLE (Optional - for bulk messaging)
-- =============================================
CREATE TABLE IF NOT EXISTS public.message_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  builder_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('sms', 'whatsapp')),
  template_id UUID REFERENCES public.message_templates(id) ON DELETE SET NULL,
  body TEXT,
  recipient_count INT DEFAULT 0,
  sent_count INT DEFAULT 0,
  failed_count INT DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sending', 'completed', 'cancelled')),
  scheduled_for TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_message_campaigns_builder_id ON public.message_campaigns(builder_id);
CREATE INDEX IF NOT EXISTS idx_message_campaigns_status ON public.message_campaigns(status);

-- =============================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on message_templates
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own templates
CREATE POLICY "Users can view own message templates"
  ON public.message_templates
  FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = builder_id);

-- Policy: Users can insert their own templates
CREATE POLICY "Users can insert own message templates"
  ON public.message_templates
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR auth.uid() = builder_id);

-- Policy: Users can update their own templates
CREATE POLICY "Users can update own message templates"
  ON public.message_templates
  FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() = builder_id);

-- Policy: Users can delete their own templates
CREATE POLICY "Users can delete own message templates"
  ON public.message_templates
  FOR DELETE
  USING (auth.uid() = user_id OR auth.uid() = builder_id);

-- Enable RLS on message_campaigns
ALTER TABLE public.message_campaigns ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own campaigns
CREATE POLICY "Users can view own message campaigns"
  ON public.message_campaigns
  FOR SELECT
  USING (auth.uid() = builder_id);

-- Policy: Users can insert their own campaigns
CREATE POLICY "Users can insert own message campaigns"
  ON public.message_campaigns
  FOR INSERT
  WITH CHECK (auth.uid() = builder_id);

-- Policy: Users can update their own campaigns
CREATE POLICY "Users can update own message campaigns"
  ON public.message_campaigns
  FOR UPDATE
  USING (auth.uid() = builder_id);

-- Policy: Users can delete their own campaigns
CREATE POLICY "Users can delete own message campaigns"
  ON public.message_campaigns
  FOR DELETE
  USING (auth.uid() = builder_id);

-- =============================================
-- 5. TRIGGERS FOR UPDATED_AT
-- =============================================

-- Function for message_templates updated_at
CREATE OR REPLACE FUNCTION public.handle_message_templates_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_message_templates_updated_at ON public.message_templates;
CREATE TRIGGER on_message_templates_updated_at
  BEFORE UPDATE ON public.message_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_message_templates_updated_at();

-- Function for message_campaigns updated_at
CREATE OR REPLACE FUNCTION public.handle_message_campaigns_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_message_campaigns_updated_at ON public.message_campaigns;
CREATE TRIGGER on_message_campaigns_updated_at
  BEFORE UPDATE ON public.message_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_message_campaigns_updated_at();

-- =============================================
-- 6. COMMENTS
-- =============================================
COMMENT ON TABLE public.message_templates IS 'Stores SMS and WhatsApp message templates with variable support';
COMMENT ON TABLE public.message_campaigns IS 'Tracks bulk messaging campaigns';
COMMENT ON COLUMN public.message_templates.variables IS 'Array of variable names that can be replaced in the template body';
COMMENT ON COLUMN public.message_templates.times_used IS 'Counter for how many times this template has been used';

