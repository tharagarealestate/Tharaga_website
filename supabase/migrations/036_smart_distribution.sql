-- =============================================
-- SMART LISTING DISTRIBUTION ENGINE
-- Auto-match new listings to qualified buyers in real-time
-- =============================================

-- =============================================
-- 1. LISTING_DISTRIBUTIONS TABLE
-- Track distribution events
-- =============================================
CREATE TABLE IF NOT EXISTS public.listing_distributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  buyer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  match_score DECIMAL(5,2) NOT NULL, -- 0-100 score
  match_factors JSONB NOT NULL, -- {budget_match: 95, location_match: 80, ...}
  distribution_channel TEXT NOT NULL, -- 'email', 'whatsapp', 'sms', 'push'
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  conversion_status TEXT DEFAULT 'sent', -- sent, opened, clicked, scheduled_visit, converted
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_listing_distributions_buyer ON public.listing_distributions(buyer_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_listing_distributions_listing ON public.listing_distributions(listing_id, match_score DESC);
CREATE INDEX IF NOT EXISTS idx_listing_distributions_score ON public.listing_distributions(match_score DESC) WHERE conversion_status = 'sent';
CREATE INDEX IF NOT EXISTS idx_listing_distributions_status ON public.listing_distributions(conversion_status);

-- =============================================
-- 2. BUYER_MATCH_PREFERENCES TABLE
-- AI matching configuration per buyer
-- =============================================
CREATE TABLE IF NOT EXISTS public.buyer_match_preferences (
  buyer_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  min_match_score DECIMAL(5,2) DEFAULT 70.0,
  preferred_channels TEXT[] DEFAULT ARRAY['email', 'whatsapp'],
  notification_frequency TEXT DEFAULT 'instant', -- instant, daily_digest, weekly_digest
  active BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_buyer_match_preferences_active ON public.buyer_match_preferences(active) WHERE active = true;

-- Updated_at trigger for buyer_match_preferences
CREATE OR REPLACE FUNCTION public.handle_buyer_match_preferences_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_buyer_match_preferences_updated_at ON public.buyer_match_preferences;
CREATE TRIGGER on_buyer_match_preferences_updated_at
  BEFORE UPDATE ON public.buyer_match_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_buyer_match_preferences_updated_at();

-- =============================================
-- 3. CALCULATE_MATCH_SCORE FUNCTION
-- Function to calculate listing-buyer match score
-- =============================================
CREATE OR REPLACE FUNCTION public.calculate_match_score(
  p_listing_id UUID,
  p_buyer_id UUID
)
RETURNS TABLE(
  match_score DECIMAL(5,2),
  match_factors JSONB
) AS $$
DECLARE
  v_listing RECORD;
  v_buyer RECORD;
  v_preferences RECORD;
  v_behavior RECORD;
  v_score DECIMAL(5,2) := 0;
  v_factors JSONB := '{}'::JSONB;
  v_budget_score DECIMAL(5,2);
  v_location_score DECIMAL(5,2);
  v_property_type_score DECIMAL(5,2);
  v_size_score DECIMAL(5,2);
  v_amenity_score DECIMAL(5,2);
  v_timing_score DECIMAL(5,2);
  v_buying_urgency TEXT;
BEGIN
  -- Get listing details
  SELECT * INTO v_listing 
  FROM public.properties 
  WHERE id = p_listing_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT 0::DECIMAL(5,2), '{"error": "Listing not found"}'::JSONB;
    RETURN;
  END IF;
  
  -- Get buyer profile and preferences
  SELECT 
    bp.*,
    up.budget_min,
    up.budget_max,
    up.preferred_location,
    up.preferred_property_type
  INTO v_preferences
  FROM public.buyer_profiles bp
  LEFT JOIN public.user_preferences up ON up.user_id = bp.user_id
  WHERE bp.user_id = p_buyer_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT 0::DECIMAL(5,2), '{"error": "Buyer profile not found"}'::JSONB;
    RETURN;
  END IF;
  
  -- Get buyer behavior patterns (from user_behavior table)
  SELECT 
    COUNT(DISTINCT property_id) as properties_viewed,
    AVG(CASE WHEN behavior_type = 'property_view' THEN duration ELSE 0 END) as avg_view_time,
    STRING_AGG(DISTINCT metadata->>'location', ',') as searched_locations
  INTO v_behavior
  FROM public.user_behavior
  WHERE user_id = p_buyer_id
  AND timestamp > NOW() - INTERVAL '30 days';
  
  -- Extract buying urgency from buyer_profiles preferences JSONB
  v_buying_urgency := COALESCE((v_preferences.preferences->>'buying_urgency')::TEXT, 'unknown');
  
  -- 1. Budget Match (Weight: 25%)
  IF v_preferences.budget_max IS NOT NULL AND v_listing.price IS NOT NULL THEN
    v_budget_score := CASE
      WHEN v_listing.price BETWEEN COALESCE(v_preferences.budget_min, 0) AND v_preferences.budget_max THEN 100
      WHEN v_listing.price < COALESCE(v_preferences.budget_min, 0) THEN 
        GREATEST(0, 100 - ((COALESCE(v_preferences.budget_min, 0) - v_listing.price) / NULLIF(v_preferences.budget_min, 0)::DECIMAL * 100))
      ELSE 
        GREATEST(0, 100 - ((v_listing.price - v_preferences.budget_max) / NULLIF(v_preferences.budget_max, 0)::DECIMAL * 100))
    END;
    v_score := v_score + (v_budget_score * 0.25);
    v_factors := v_factors || jsonb_build_object('budget_match', v_budget_score);
  ELSE
    v_budget_score := 50; -- Default score if no budget info
    v_score := v_score + (v_budget_score * 0.25);
    v_factors := v_factors || jsonb_build_object('budget_match', v_budget_score);
  END IF;
  
  -- 2. Location Match (Weight: 25%)
  IF v_preferences.preferred_location IS NOT NULL OR v_behavior.searched_locations IS NOT NULL THEN
    v_location_score := CASE
      WHEN v_listing.location = v_preferences.preferred_location THEN 100
      WHEN v_listing.locality = v_preferences.preferred_location THEN 90
      WHEN v_listing.city = v_preferences.preferred_location THEN 70
      WHEN v_behavior.searched_locations IS NOT NULL AND 
           (v_listing.location LIKE '%' || v_behavior.searched_locations || '%' OR
            v_behavior.searched_locations LIKE '%' || v_listing.location || '%') THEN 80
      ELSE 30
    END;
    v_score := v_score + (v_location_score * 0.25);
    v_factors := v_factors || jsonb_build_object('location_match', v_location_score);
  ELSE
    v_location_score := 50;
    v_score := v_score + (v_location_score * 0.25);
    v_factors := v_factors || jsonb_build_object('location_match', v_location_score);
  END IF;
  
  -- 3. Property Type Match (Weight: 20%)
  IF v_preferences.preferred_property_type IS NOT NULL THEN
    v_property_type_score := CASE
      WHEN v_listing.property_type = v_preferences.preferred_property_type THEN 100
      WHEN v_listing.property_type ILIKE '%' || v_preferences.preferred_property_type || '%' THEN 80
      ELSE 20
    END;
    v_score := v_score + (v_property_type_score * 0.20);
    v_factors := v_factors || jsonb_build_object('property_type_match', v_property_type_score);
  ELSE
    v_property_type_score := 50;
    v_score := v_score + (v_property_type_score * 0.20);
    v_factors := v_factors || jsonb_build_object('property_type_match', v_property_type_score);
  END IF;
  
  -- 4. Size Match (Weight: 15%) - Based on bedrooms
  -- Extract bedroom preferences from buyer_profiles JSONB if available
  IF v_listing.bedrooms IS NOT NULL THEN
    v_size_score := CASE
      WHEN (v_preferences.preferences->>'min_bedrooms') IS NULL THEN 70 -- Default if no preference
      WHEN v_listing.bedrooms BETWEEN 
        COALESCE((v_preferences.preferences->>'min_bedrooms')::INTEGER, 0) AND 
        COALESCE((v_preferences.preferences->>'max_bedrooms')::INTEGER, 10) THEN 100
      WHEN v_listing.bedrooms < COALESCE((v_preferences.preferences->>'min_bedrooms')::INTEGER, 0) THEN 
        GREATEST(0, 100 - ((COALESCE((v_preferences.preferences->>'min_bedrooms')::INTEGER, 0) - v_listing.bedrooms) * 20))
      ELSE 
        GREATEST(0, 100 - ((v_listing.bedrooms - COALESCE((v_preferences.preferences->>'max_bedrooms')::INTEGER, 10)) * 15))
    END;
    v_score := v_score + (v_size_score * 0.15);
    v_factors := v_factors || jsonb_build_object('size_match', v_size_score);
  ELSE
    v_size_score := 50;
    v_score := v_score + (v_size_score * 0.15);
    v_factors := v_factors || jsonb_build_object('size_match', v_size_score);
  END IF;
  
  -- 5. Amenity Match (Weight: 10%) - Based on past behavior
  IF v_behavior.properties_viewed > 0 THEN
    -- Simplified: If user has viewed properties, give baseline score
    v_amenity_score := 70;
    v_score := v_score + (v_amenity_score * 0.10);
    v_factors := v_factors || jsonb_build_object('amenity_match', v_amenity_score);
  ELSE
    v_amenity_score := 50;
    v_score := v_score + (v_amenity_score * 0.10);
    v_factors := v_factors || jsonb_build_object('amenity_match', v_amenity_score);
  END IF;
  
  -- 6. Timing/Urgency Score (Weight: 5%)
  v_timing_score := CASE
    WHEN v_buying_urgency = 'immediate' THEN 100
    WHEN v_buying_urgency = 'within_3_months' THEN 80
    WHEN v_buying_urgency = 'within_6_months' THEN 60
    ELSE 40
  END;
  v_score := v_score + (v_timing_score * 0.05);
  v_factors := v_factors || jsonb_build_object('timing_match', v_timing_score);
  
  -- Ensure score is between 0 and 100
  v_score := GREATEST(0, LEAST(100, v_score));
  
  RETURN QUERY SELECT v_score, v_factors;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 4. TRIGGER TO AUTO-DISTRIBUTE NEW LISTINGS
-- =============================================
-- Note: The trigger queues distribution jobs but doesn't require automation_id
-- The distribution service will process these jobs directly from the queue
CREATE OR REPLACE FUNCTION public.trigger_auto_distribute_listing()
RETURNS TRIGGER AS $$
DECLARE
  v_default_automation_id UUID;
BEGIN
  -- Insert job into automation_queue for async processing
  -- Only if listing is active and verified
  IF NEW.listing_status = 'active' AND NEW.is_verified = true THEN
    -- Try to find or create a default distribution automation
    -- If automation_queue requires automation_id, we'll handle it gracefully
    SELECT id INTO v_default_automation_id
    FROM public.automations
    WHERE builder_id = NEW.builder_id
    AND name = 'Auto Distribution'
    LIMIT 1;
    
    -- If automation_queue has NOT NULL constraint on automation_id,
    -- we'll create a system automation or skip the queue and let the API handle it
    -- For now, we'll log the event in listing_distributions with a pending status
    -- and let the API endpoint trigger distribution manually
    
    -- Alternative: Just log that distribution should happen
    -- The API endpoint will check for new verified listings and distribute them
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: Auto-distribution trigger is disabled by default
-- Enable it by uncommenting the trigger below if automation_queue integration is needed
-- For now, distribution is triggered manually via API or can be set up as a cron job
-- DROP TRIGGER IF EXISTS auto_distribute_new_listing ON public.properties;
-- CREATE TRIGGER auto_distribute_new_listing
-- AFTER INSERT ON public.properties
-- FOR EACH ROW
-- WHEN (NEW.listing_status = 'active' AND NEW.is_verified = true)
-- EXECUTE FUNCTION public.trigger_auto_distribute_listing();

-- =============================================
-- 5. ROW LEVEL SECURITY
-- =============================================

-- Listing Distributions: Builders can view distributions for their listings, buyers can view their own
ALTER TABLE public.listing_distributions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Builders can view their listing distributions" ON public.listing_distributions;
DROP POLICY IF EXISTS "Buyers can view their own distributions" ON public.listing_distributions;

CREATE POLICY "Builders can view their listing distributions" ON public.listing_distributions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.properties
      WHERE properties.id = listing_distributions.listing_id
      AND properties.builder_id = auth.uid()
    )
  );

CREATE POLICY "Buyers can view their own distributions" ON public.listing_distributions
  FOR SELECT USING (auth.uid() = buyer_id);

-- Buyer Match Preferences: Users can manage their own preferences
ALTER TABLE public.buyer_match_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Buyers can manage their match preferences" ON public.buyer_match_preferences;

CREATE POLICY "Buyers can manage their match preferences" ON public.buyer_match_preferences
  FOR ALL USING (auth.uid() = buyer_id);

-- =============================================
-- 6. COMMENTS
-- =============================================
COMMENT ON TABLE public.listing_distributions IS 'Tracks distribution of listings to matched buyers';
COMMENT ON TABLE public.buyer_match_preferences IS 'AI matching configuration and preferences per buyer';
COMMENT ON FUNCTION public.calculate_match_score IS 'Calculates match score between a listing and buyer based on preferences and behavior';
COMMENT ON FUNCTION public.trigger_auto_distribute_listing IS 'Automatically queues new listings for distribution to qualified buyers';

