-- =============================================
-- SMARTSCORE™ 2.0 - ENHANCED LEAD QUALIFICATION
-- Real-time AI scoring with predictive conversion probability
-- =============================================

-- =============================================
-- 1. ADD SMARTSCORE 2.0 COLUMNS TO LEADS TABLE
-- =============================================

-- Add SmartScore 2.0 columns
DO $$ BEGIN
  ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS smartscore_v2 DECIMAL(5,2) DEFAULT 0;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS conversion_probability DECIMAL(5,4) DEFAULT 0 CHECK (conversion_probability >= 0 AND conversion_probability <= 1);
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS predicted_ltv DECIMAL(12,2) DEFAULT 0;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS ai_insights JSONB DEFAULT '{}'::JSONB;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS priority_tier TEXT DEFAULT 'standard' CHECK (priority_tier IN ('platinum', 'gold', 'silver', 'bronze', 'standard'));
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS next_best_action TEXT;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS optimal_contact_time TIMESTAMPTZ;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS smartscore_updated_at TIMESTAMPTZ DEFAULT NOW();
EXCEPTION WHEN others THEN NULL; END $$;

-- Add buyer_id column if it doesn't exist (to link leads to users)
DO $$ BEGIN
  ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS buyer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
EXCEPTION WHEN others THEN NULL; END $$;

-- Add buying_urgency column if it doesn't exist
DO $$ BEGIN
  ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS buying_urgency TEXT;
EXCEPTION WHEN others THEN NULL; END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_leads_smartscore_v2 ON public.leads(smartscore_v2 DESC, conversion_probability DESC);
CREATE INDEX IF NOT EXISTS idx_leads_priority_tier ON public.leads(priority_tier, smartscore_v2 DESC);
CREATE INDEX IF NOT EXISTS idx_leads_optimal_contact ON public.leads(optimal_contact_time) WHERE optimal_contact_time IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_buyer_id ON public.leads(buyer_id) WHERE buyer_id IS NOT NULL;

-- =============================================
-- 2. SMARTSCORE HISTORY TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.smartscore_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id BIGINT REFERENCES public.leads(id) ON DELETE CASCADE,
  score_version TEXT DEFAULT 'v2',
  score_value DECIMAL(5,2) NOT NULL,
  conversion_probability DECIMAL(5,4),
  score_factors JSONB NOT NULL,
  features_used JSONB NOT NULL,
  model_version TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_smartscore_history_lead ON public.smartscore_history(lead_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_smartscore_history_version ON public.smartscore_history(score_version);

-- =============================================
-- 3. LEAD CONVERSIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.lead_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id BIGINT REFERENCES public.leads(id) ON DELETE CASCADE,
  converted_at TIMESTAMPTZ DEFAULT NOW(),
  conversion_type TEXT NOT NULL CHECK (conversion_type IN ('site_visit', 'booking', 'payment', 'closed_deal')),
  conversion_value DECIMAL(12,2),
  days_to_convert INTEGER,
  touchpoints_count INTEGER,
  metadata JSONB DEFAULT '{}'::JSONB
);

CREATE INDEX IF NOT EXISTS idx_lead_conversions_lead ON public.lead_conversions(lead_id, converted_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_conversions_type ON public.lead_conversions(conversion_type, converted_at DESC);

-- =============================================
-- 4. ENHANCED SMARTSCORE CALCULATION FUNCTION
-- =============================================
CREATE OR REPLACE FUNCTION public.calculate_smartscore_v2(p_lead_id BIGINT)
RETURNS TABLE(
  smartscore DECIMAL(5,2),
  conversion_probability DECIMAL(5,4),
  predicted_ltv DECIMAL(12,2),
  priority_tier TEXT,
  next_best_action TEXT,
  optimal_contact_time TIMESTAMPTZ,
  ai_insights JSONB
) AS $$
DECLARE
  v_lead RECORD;
  v_behavior RECORD;
  v_engagement RECORD;
  v_similar_converted_leads INTEGER;
  v_user_id UUID;
  
  -- Score components
  v_budget_score DECIMAL(5,2) := 0;
  v_engagement_score DECIMAL(5,2) := 0;
  v_intent_score DECIMAL(5,2) := 0;
  v_timing_score DECIMAL(5,2) := 0;
  v_profile_score DECIMAL(5,2) := 0;
  v_behavior_score DECIMAL(5,2) := 0;
  v_social_proof_score DECIMAL(5,2) := 0;
  
  v_final_score DECIMAL(5,2);
  v_conversion_prob DECIMAL(5,4);
  v_ltv DECIMAL(12,2);
  v_tier TEXT;
  v_action TEXT;
  v_contact_time TIMESTAMPTZ;
  v_insights JSONB := '{}'::JSONB;
  v_buyer_profile RECORD;
  v_user_prefs RECORD;
  
BEGIN
  -- Get lead data with all related info
  SELECT 
    l.*,
    p.email as profile_email,
    p.phone as profile_phone,
    p.created_at as user_created_at
  INTO v_lead
  FROM public.leads l
  LEFT JOIN public.profiles p ON p.id = l.buyer_id
  WHERE l.id = p_lead_id;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Try to find user_id from buyer_id or by email/phone
  v_user_id := v_lead.buyer_id;
  
  IF v_user_id IS NULL AND v_lead.email IS NOT NULL THEN
    SELECT id INTO v_user_id
    FROM public.profiles
    WHERE email = v_lead.email
    LIMIT 1;
  END IF;
  
  -- Get buyer profile and preferences if user_id found
  IF v_user_id IS NOT NULL THEN
    SELECT 
      bp.*,
      up.min_budget,
      up.max_budget,
      up.preferred_location,
      up.preferred_property_type
    INTO v_buyer_profile
    FROM public.buyer_profiles bp
    LEFT JOIN public.user_preferences up ON up.user_id = bp.user_id
    WHERE bp.user_id = v_user_id
    LIMIT 1;
    
    -- Get user preferences separately
    SELECT * INTO v_user_prefs
    FROM public.user_preferences
    WHERE user_id = v_user_id
    LIMIT 1;
  END IF;
  
  -- Get behavior metrics (if user_id available)
  IF v_user_id IS NOT NULL THEN
    SELECT 
      COUNT(DISTINCT property_id) FILTER (WHERE behavior_type = 'property_view') as properties_viewed,
      COUNT(*) FILTER (WHERE behavior_type IN ('saved_property', 'favorite')) as properties_saved,
      COUNT(*) FILTER (WHERE behavior_type IN ('share', 'compared_properties')) as properties_shared,
      AVG(duration) FILTER (WHERE behavior_type = 'property_view') as avg_view_time,
      COUNT(DISTINCT DATE(timestamp)) as active_days,
      MAX(timestamp) as last_activity,
      COUNT(*) FILTER (WHERE behavior_type = 'search' AND (metadata->>'location' IS NOT NULL OR metadata->>'search_filters' IS NOT NULL)) as search_count
    INTO v_behavior
    FROM public.user_behavior
    WHERE user_id = v_user_id
    AND timestamp > NOW() - INTERVAL '30 days';
  END IF;
  
  -- Get engagement metrics
  SELECT 
    COUNT(*) as total_interactions,
    COUNT(DISTINCT interaction_type) as interaction_types,
    MAX(timestamp) as last_interaction,
    COUNT(*) FILTER (WHERE interaction_type IN ('call_answered', 'email_replied', 'form_submitted')) as positive_responses
  INTO v_engagement
  FROM public.lead_interactions
  WHERE lead_id = p_lead_id
  AND timestamp > NOW() - INTERVAL '30 days';
  
  -- Find similar converted leads (collaborative filtering signal)
  SELECT COUNT(*)
  INTO v_similar_converted_leads
  FROM public.leads l
  INNER JOIN public.lead_conversions lc ON lc.lead_id = l.id
  WHERE l.id != p_lead_id
  AND ABS(COALESCE(l.smartscore_v2, l.score, 5) - COALESCE(v_lead.smartscore_v2, v_lead.score, 5)) < 10
  AND lc.converted_at > NOW() - INTERVAL '90 days';
  
  -- 1. Budget Alignment Score (20%)
  IF v_lead.budget IS NOT NULL AND v_lead.budget > 0 THEN
    IF v_user_prefs.max_budget IS NOT NULL THEN
      v_budget_score := CASE
        WHEN v_lead.budget BETWEEN COALESCE(v_user_prefs.min_budget, 0) AND v_user_prefs.max_budget THEN 100
        WHEN v_lead.budget < COALESCE(v_user_prefs.min_budget, 0) THEN 
          GREATEST(0, 100 - ((COALESCE(v_user_prefs.min_budget, 0) - v_lead.budget) / NULLIF(v_user_prefs.min_budget, 0)::DECIMAL * 50))
        ELSE 
          GREATEST(0, 100 - ((v_lead.budget - v_user_prefs.max_budget) / NULLIF(v_user_prefs.max_budget, 0)::DECIMAL * 50))
      END;
    ELSE
      -- No preference data, use budget amount as signal
      v_budget_score := CASE
        WHEN v_lead.budget > 10000000 THEN 90
        WHEN v_lead.budget > 5000000 THEN 75
        WHEN v_lead.budget > 2000000 THEN 60
        ELSE 40
      END;
    END IF;
    
    -- Boost if financing pre-approved (from buyer profile)
    IF v_buyer_profile IS NOT NULL AND (v_buyer_profile.preferences->>'financing_pre_approved')::BOOLEAN = true THEN
      v_budget_score := LEAST(100, v_budget_score * 1.15);
    END IF;
  ELSE
    v_budget_score := 50; -- Neutral if no budget data
  END IF;
  
  -- 2. Engagement Score (25%)
  v_engagement_score := LEAST(100, (
    COALESCE(v_engagement.total_interactions, 0) * 5 +
    COALESCE(v_engagement.positive_responses, 0) * 15 +
    COALESCE(v_engagement.interaction_types, 0) * 10 +
    CASE WHEN v_engagement.last_interaction > NOW() - INTERVAL '7 days' THEN 20 ELSE 0 END
  ));
  
  -- 3. Intent Score (20%)
  v_intent_score := LEAST(100, (
    COALESCE(v_behavior.properties_viewed, 0) * 3 +
    COALESCE(v_behavior.properties_saved, 0) * 8 +
    COALESCE(v_behavior.properties_shared, 0) * 12 +
    COALESCE(v_behavior.search_count, 0) * 5 +
    CASE 
      WHEN COALESCE(v_behavior.avg_view_time, 0) > 120 THEN 25
      WHEN COALESCE(v_behavior.avg_view_time, 0) > 60 THEN 15
      ELSE 5
    END
  ));
  
  -- 4. Timing/Urgency Score (15%)
  v_timing_score := CASE
    WHEN v_lead.buying_urgency = 'immediate' THEN 100
    WHEN v_lead.buying_urgency = 'within_3_months' THEN 80
    WHEN v_lead.buying_urgency = 'within_6_months' THEN 60
    WHEN v_lead.buying_urgency = 'within_year' THEN 40
    WHEN v_buyer_profile IS NOT NULL AND (v_buyer_profile.preferences->>'buying_urgency')::TEXT = 'immediate' THEN 100
    WHEN v_buyer_profile IS NOT NULL AND (v_buyer_profile.preferences->>'buying_urgency')::TEXT = 'within_3_months' THEN 80
    ELSE 20
  END;
  
  -- Boost if recently active
  IF v_behavior.last_activity IS NOT NULL AND v_behavior.last_activity > NOW() - INTERVAL '24 hours' THEN
    v_timing_score := LEAST(100, v_timing_score * 1.2);
  END IF;
  
  -- 5. Profile Completeness Score (10%)
  v_profile_score := (
    CASE WHEN v_lead.phone IS NOT NULL THEN 25 ELSE 0 END +
    CASE WHEN v_lead.email IS NOT NULL THEN 25 ELSE 0 END +
    CASE WHEN v_lead.budget IS NOT NULL AND v_lead.budget > 0 THEN 25 ELSE 0 END +
    CASE WHEN v_lead.buying_urgency IS NOT NULL OR (v_buyer_profile IS NOT NULL AND v_buyer_profile.preferences->>'buying_urgency' IS NOT NULL) THEN 25 ELSE 0 END
  );
  
  -- 6. Behavior Consistency Score (5%)
  v_behavior_score := CASE
    WHEN COALESCE(v_behavior.active_days, 0) >= 5 THEN 100
    WHEN COALESCE(v_behavior.active_days, 0) >= 3 THEN 70
    WHEN COALESCE(v_behavior.active_days, 0) >= 1 THEN 40
    ELSE 10
  END;
  
  -- 7. Social Proof Score (5%) - Similar leads converted
  v_social_proof_score := LEAST(100, v_similar_converted_leads * 10);
  
  -- Calculate weighted final score
  v_final_score := (
    (v_budget_score * 0.20) +
    (v_engagement_score * 0.25) +
    (v_intent_score * 0.20) +
    (v_timing_score * 0.15) +
    (v_profile_score * 0.10) +
    (v_behavior_score * 0.05) +
    (v_social_proof_score * 0.05)
  );
  
  -- Ensure score is between 0 and 100
  v_final_score := GREATEST(0, LEAST(100, v_final_score));
  
  -- Calculate conversion probability using logistic function
  -- P = 1 / (1 + e^(-(score - 50)/15))
  v_conversion_prob := 1.0 / (1.0 + EXP(-((v_final_score - 50.0) / 15.0)));
  v_conversion_prob := GREATEST(0.0, LEAST(1.0, v_conversion_prob));
  
  -- Predict Lifetime Value
  v_ltv := CASE
    WHEN v_lead.budget > 0 THEN v_lead.budget * v_conversion_prob * 0.02 -- 2% commission
    ELSE 0
  END;
  
  -- Determine Priority Tier
  v_tier := CASE
    WHEN v_final_score >= 90 AND v_conversion_prob >= 0.7 THEN 'platinum'
    WHEN v_final_score >= 75 AND v_conversion_prob >= 0.5 THEN 'gold'
    WHEN v_final_score >= 60 AND v_conversion_prob >= 0.3 THEN 'silver'
    WHEN v_final_score >= 45 THEN 'bronze'
    ELSE 'standard'
  END;
  
  -- Determine Next Best Action (AI recommendation)
  v_action := CASE
    WHEN COALESCE(v_engagement.total_interactions, 0) = 0 THEN 'send_welcome_email'
    WHEN v_engagement.last_interaction IS NULL OR v_engagement.last_interaction < NOW() - INTERVAL '7 days' THEN 'follow_up_call'
    WHEN COALESCE(v_behavior.properties_saved, 0) > 3 AND COALESCE(v_engagement.total_interactions, 0) < 2 THEN 'schedule_site_visit'
    WHEN v_lead.buying_urgency = 'immediate' AND v_tier IN ('platinum', 'gold') THEN 'priority_call_today'
    WHEN COALESCE(v_behavior.properties_viewed, 0) > 10 THEN 'send_curated_matches'
    ELSE 'nurture_sequence'
  END;
  
  -- Calculate Optimal Contact Time (based on past behavior patterns)
  IF v_user_id IS NOT NULL THEN
    SELECT 
      CASE 
        WHEN EXTRACT(DOW FROM timestamp) IN (0,6) THEN -- Weekend
          DATE_TRUNC('day', NOW() + INTERVAL '1 day') + INTERVAL '11 hours'
        ELSE -- Weekday
          DATE_TRUNC('day', NOW()) + INTERVAL '18 hours' -- 6 PM
      END
    INTO v_contact_time
    FROM public.user_behavior
    WHERE user_id = v_user_id
    ORDER BY timestamp DESC
    LIMIT 1;
  ELSE
    -- Default to tomorrow 6 PM if no behavior data
    v_contact_time := DATE_TRUNC('day', NOW() + INTERVAL '1 day') + INTERVAL '18 hours';
  END IF;
  
  -- Build AI Insights JSON
  v_insights := jsonb_build_object(
    'score_breakdown', jsonb_build_object(
      'budget_alignment', v_budget_score,
      'engagement_level', v_engagement_score,
      'purchase_intent', v_intent_score,
      'timing_urgency', v_timing_score,
      'profile_quality', v_profile_score,
      'behavior_consistency', v_behavior_score,
      'social_proof', v_social_proof_score
    ),
    'key_strengths', (
      SELECT jsonb_agg(strength)
      FROM (VALUES
        (CASE WHEN v_budget_score > 80 THEN 'Strong budget match' END),
        (CASE WHEN v_engagement_score > 70 THEN 'Highly engaged' END),
        (CASE WHEN v_intent_score > 70 THEN 'Clear purchase intent' END),
        (CASE WHEN v_buyer_profile IS NOT NULL AND (v_buyer_profile.preferences->>'financing_pre_approved')::BOOLEAN = true THEN 'Pre-approved financing' END)
      ) AS t(strength)
      WHERE strength IS NOT NULL
    ),
    'improvement_areas', (
      SELECT jsonb_agg(area)
      FROM (VALUES
        (CASE WHEN v_engagement_score < 40 THEN 'Low engagement - needs outreach' END),
        (CASE WHEN v_profile_score < 50 THEN 'Incomplete profile' END),
        (CASE WHEN COALESCE(v_behavior.active_days, 0) < 2 THEN 'Limited activity - risk of churn' END)
      ) AS t(area)
      WHERE area IS NOT NULL
    ),
    'conversion_blockers', (
      SELECT jsonb_agg(blocker)
      FROM (VALUES
        (CASE WHEN v_lead.phone IS NULL THEN 'No phone number' END),
        (CASE WHEN NOT COALESCE((v_buyer_profile.preferences->>'financing_pre_approved')::BOOLEAN, false) AND v_lead.budget > 5000000 THEN 'High budget without financing' END)
      ) AS t(blocker)
      WHERE blocker IS NOT NULL
    ),
    'behavior_summary', jsonb_build_object(
      'properties_viewed', COALESCE(v_behavior.properties_viewed, 0),
      'properties_saved', COALESCE(v_behavior.properties_saved, 0),
      'avg_time_per_view_sec', COALESCE(v_behavior.avg_view_time, 0),
      'active_days_last_month', COALESCE(v_behavior.active_days, 0),
      'last_seen', v_behavior.last_activity
    )
  );
  
  -- Return all calculated values
  RETURN QUERY SELECT 
    v_final_score,
    v_conversion_prob,
    v_ltv,
    v_tier,
    v_action,
    v_contact_time,
    v_insights;
    
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 5. HELPER FUNCTION TO UPDATE SMARTSCORE
-- =============================================
CREATE OR REPLACE FUNCTION public.update_lead_smartscore_v2(p_lead_id BIGINT)
RETURNS VOID AS $$
DECLARE
  v_score_result RECORD;
BEGIN
  -- Calculate new SmartScore
  SELECT * INTO v_score_result
  FROM public.calculate_smartscore_v2(p_lead_id);
  
  -- Update lead record
  UPDATE public.leads
  SET 
    smartscore_v2 = v_score_result.smartscore,
    conversion_probability = v_score_result.conversion_probability,
    predicted_ltv = v_score_result.predicted_ltv,
    priority_tier = v_score_result.priority_tier,
    next_best_action = v_score_result.next_best_action,
    optimal_contact_time = v_score_result.optimal_contact_time,
    ai_insights = v_score_result.ai_insights,
    smartscore_updated_at = NOW()
  WHERE id = p_lead_id;
  
  -- Log to history for ML training
  INSERT INTO public.smartscore_history (
    lead_id,
    score_version,
    score_value,
    conversion_probability,
    score_factors,
    features_used,
    model_version
  ) VALUES (
    p_lead_id,
    'v2',
    v_score_result.smartscore,
    v_score_result.conversion_probability,
    v_score_result.ai_insights->'score_breakdown',
    v_score_result.ai_insights->'behavior_summary',
    'rule_based_v2'
  );
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 6. TRIGGER TO AUTO-UPDATE SMARTSCORE
-- =============================================
CREATE OR REPLACE FUNCTION public.trigger_update_smartscore_v2()
RETURNS TRIGGER AS $$
BEGIN
  -- Call helper function to update score
  PERFORM public.update_lead_smartscore_v2(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_leads_smartscore_update ON public.leads;
CREATE TRIGGER trigger_leads_smartscore_update
AFTER INSERT OR UPDATE OF budget, buying_urgency, buyer_id, status ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.trigger_update_smartscore_v2();

-- =============================================
-- 7. TRIGGER ON BEHAVIOR CHANGES
-- =============================================
CREATE OR REPLACE FUNCTION public.trigger_behavior_smartscore_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Update SmartScore for the user's active leads
  PERFORM public.update_lead_smartscore_v2(l.id)
  FROM public.leads l
  LEFT JOIN public.profiles p ON p.id = l.buyer_id
  WHERE (l.buyer_id = NEW.user_id OR (p.email IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.leads l2 
    WHERE l2.email = p.email AND l2.id = l.id
  )))
  AND l.status IN ('new', 'contacted', 'qualified');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_behavior_updates_score ON public.user_behavior;
CREATE TRIGGER trigger_behavior_updates_score
AFTER INSERT OR UPDATE ON public.user_behavior
FOR EACH ROW
EXECUTE FUNCTION public.trigger_behavior_smartscore_update();

-- =============================================
-- 7. ROW LEVEL SECURITY
-- =============================================

-- SmartScore History: Builders can view history for their leads
ALTER TABLE public.smartscore_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Builders can view smartscore history for their leads" ON public.smartscore_history;

CREATE POLICY "Builders can view smartscore history for their leads" ON public.smartscore_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.leads
      WHERE leads.id = smartscore_history.lead_id
      AND leads.builder_id = auth.uid()
    )
  );

-- Lead Conversions: Builders can manage conversions for their leads
ALTER TABLE public.lead_conversions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Builders can view conversions for their leads" ON public.lead_conversions;
DROP POLICY IF EXISTS "Builders can create conversions for their leads" ON public.lead_conversions;

CREATE POLICY "Builders can view conversions for their leads" ON public.lead_conversions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.leads
      WHERE leads.id = lead_conversions.lead_id
      AND leads.builder_id = auth.uid()
    )
  );

CREATE POLICY "Builders can create conversions for their leads" ON public.lead_conversions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.leads
      WHERE leads.id = lead_conversions.lead_id
      AND leads.builder_id = auth.uid()
    )
  );

-- =============================================
-- 8. COMMENTS
-- =============================================
COMMENT ON FUNCTION public.calculate_smartscore_v2 IS 'Enhanced SmartScore 2.0 calculation with predictive conversion probability and AI insights';
COMMENT ON TABLE public.smartscore_history IS 'Historical SmartScore calculations for ML model training';
COMMENT ON TABLE public.lead_conversions IS 'Tracks actual lead conversions for model accuracy improvement';

