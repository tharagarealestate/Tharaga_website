-- =============================================================
-- FIX: lead_interactions.lead_id is TEXT, leads.id is BIGINT
-- The calculate_smartscore_v2 trigger fires on INSERT of leads
-- and crashes with "operator does not exist: text = bigint"
-- Two fixes:
--   1) Wrap trigger in EXCEPTION so it never blocks inserts
--   2) Fix the lead_interactions WHERE clause with explicit cast
-- =============================================================

-- 1. Make the trigger wrapper non-fatal
CREATE OR REPLACE FUNCTION public.trigger_update_smartscore_v2()
RETURNS TRIGGER AS $$
BEGIN
  BEGIN
    PERFORM public.update_lead_smartscore_v2(NEW.id);
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '[SmartScore] Trigger error for lead % (non-fatal): %', NEW.id, SQLERRM;
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Fix calculate_smartscore_v2: cast bigint lead_id to text for lead_interactions
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

  v_budget_score     DECIMAL(5,2) := 0;
  v_engagement_score DECIMAL(5,2) := 0;
  v_intent_score     DECIMAL(5,2) := 0;
  v_timing_score     DECIMAL(5,2) := 0;
  v_profile_score    DECIMAL(5,2) := 0;
  v_behavior_score   DECIMAL(5,2) := 0;

  v_final_score    DECIMAL(5,2);
  v_conversion_prob DECIMAL(5,4);
  v_ltv            DECIMAL(12,2);
  v_tier           TEXT;
  v_action         TEXT;
  v_contact_time   TIMESTAMPTZ;
  v_insights       JSONB := '{}'::JSONB;
  v_buyer_profile  RECORD;
  v_user_prefs     RECORD;

BEGIN
  SELECT l.*,
         p.email       AS profile_email,
         p.phone       AS profile_phone,
         p.created_at  AS user_created_at
  INTO v_lead
  FROM public.leads l
  LEFT JOIN public.profiles p ON p.id = l.buyer_id
  WHERE l.id = p_lead_id;

  IF NOT FOUND THEN RETURN; END IF;

  v_user_id := v_lead.buyer_id;

  IF v_user_id IS NULL AND v_lead.email IS NOT NULL THEN
    SELECT id INTO v_user_id
    FROM public.profiles
    WHERE email = v_lead.email
    LIMIT 1;
  END IF;

  IF v_user_id IS NOT NULL THEN
    SELECT bp.*,
           up.min_budget, up.max_budget,
           up.preferred_location, up.preferred_property_type
    INTO v_buyer_profile
    FROM public.buyer_profiles bp
    LEFT JOIN public.user_preferences up ON up.user_id = bp.user_id
    WHERE bp.user_id = v_user_id
    LIMIT 1;

    SELECT * INTO v_user_prefs
    FROM public.user_preferences
    WHERE user_id = v_user_id
    LIMIT 1;
  END IF;

  IF v_user_id IS NOT NULL THEN
    SELECT
      COUNT(DISTINCT property_id) FILTER (WHERE behavior_type = 'property_view')                       AS properties_viewed,
      COUNT(*)                    FILTER (WHERE behavior_type IN ('saved_property','favorite'))         AS properties_saved,
      COUNT(*)                    FILTER (WHERE behavior_type IN ('share','compared_properties'))       AS properties_shared,
      AVG(duration)               FILTER (WHERE behavior_type = 'property_view')                       AS avg_view_time,
      COUNT(DISTINCT DATE(timestamp))                                                                   AS active_days,
      MAX(timestamp)                                                                                    AS last_activity,
      COUNT(*)                    FILTER (WHERE behavior_type = 'search'
                                    AND (metadata->>'location' IS NOT NULL
                                      OR metadata->>'search_filters' IS NOT NULL))                     AS search_count
    INTO v_behavior
    FROM public.user_behavior
    WHERE user_id = v_user_id
      AND timestamp > NOW() - INTERVAL '30 days';
  END IF;

  -- KEY FIX: lead_interactions.lead_id is TEXT, cast bigint to text
  SELECT
    COUNT(*)                    AS total_interactions,
    COUNT(DISTINCT interaction_type) AS interaction_types,
    MAX(timestamp)              AS last_interaction,
    COUNT(*) FILTER (WHERE interaction_type IN ('call_answered','email_replied','form_submitted')) AS positive_responses
  INTO v_engagement
  FROM public.lead_interactions
  WHERE lead_id = p_lead_id::TEXT
    AND timestamp > NOW() - INTERVAL '30 days';

  SELECT COUNT(*)
  INTO v_similar_converted_leads
  FROM public.leads l
  INNER JOIN public.lead_conversions lc ON lc.lead_id = l.id
  WHERE l.id != p_lead_id
    AND ABS(COALESCE(l.smartscore_v2, l.lead_score, 5)
          - COALESCE(v_lead.smartscore_v2, v_lead.lead_score, 5)) < 10
    AND lc.converted_at > NOW() - INTERVAL '90 days';

  -- Budget alignment (20 pts)
  IF v_lead.budget IS NOT NULL AND v_lead.budget > 0 THEN
    v_budget_score := LEAST(20, 20 * (
      1 - ABS(COALESCE(v_user_prefs.min_budget, v_lead.budget) - v_lead.budget)
            / GREATEST(v_lead.budget, 1)
    ));
  ELSE
    v_budget_score := 5;
  END IF;

  -- Engagement (20 pts)
  v_engagement_score := LEAST(20,
    COALESCE(v_engagement.total_interactions, 0) * 2 +
    COALESCE(v_engagement.positive_responses, 0) * 5
  );

  -- Intent / status (20 pts)
  v_intent_score := CASE v_lead.status
    WHEN 'qualified' THEN 20
    WHEN 'contacted' THEN 12
    WHEN 'new'       THEN 6
    ELSE 4
  END;
  IF v_lead.buying_urgency = 'high'   THEN v_intent_score := LEAST(20, v_intent_score + 8); END IF;
  IF v_lead.buying_urgency = 'medium' THEN v_intent_score := LEAST(20, v_intent_score + 4); END IF;

  -- Recency / timing (15 pts)
  IF    v_lead.created_at > NOW() - INTERVAL '1 day'   THEN v_timing_score := 15;
  ELSIF v_lead.created_at > NOW() - INTERVAL '3 days'  THEN v_timing_score := 12;
  ELSIF v_lead.created_at > NOW() - INTERVAL '7 days'  THEN v_timing_score := 8;
  ELSIF v_lead.created_at > NOW() - INTERVAL '30 days' THEN v_timing_score := 4;
  ELSE  v_timing_score := 1;
  END IF;

  -- Profile completeness (15 pts)
  IF v_lead.email        IS NOT NULL THEN v_profile_score := v_profile_score + 4; END IF;
  IF v_lead.phone_number IS NOT NULL THEN v_profile_score := v_profile_score + 4; END IF;
  IF v_lead.budget       IS NOT NULL THEN v_profile_score := v_profile_score + 4; END IF;
  IF v_lead.message IS NOT NULL AND LENGTH(v_lead.message) > 20
                                     THEN v_profile_score := v_profile_score + 3; END IF;

  -- Behavior signals (10 pts)
  IF v_behavior IS NOT NULL THEN
    v_behavior_score := LEAST(10,
      COALESCE(v_behavior.properties_viewed, 0) +
      COALESCE(v_behavior.properties_saved,  0) * 2 +
      COALESCE(v_behavior.active_days,       0)
    );
  END IF;

  -- Final score
  v_final_score := LEAST(100, GREATEST(0,
    v_budget_score + v_engagement_score + v_intent_score +
    v_timing_score + v_profile_score   + v_behavior_score
  ));

  v_conversion_prob := ROUND((v_final_score / 100.0)::NUMERIC, 4);

  v_ltv := CASE
    WHEN v_final_score >= 80 THEN 2500000
    WHEN v_final_score >= 60 THEN 1500000
    WHEN v_final_score >= 40 THEN 750000
    ELSE 250000
  END;

  v_tier := CASE
    WHEN v_final_score >= 80 THEN 'hot'
    WHEN v_final_score >= 60 THEN 'warm'
    WHEN v_final_score >= 40 THEN 'developing'
    ELSE 'cold'
  END;

  v_action := CASE v_tier
    WHEN 'hot'        THEN 'Call immediately'
    WHEN 'warm'       THEN 'Send property details today'
    WHEN 'developing' THEN 'Send follow-up email'
    ELSE 'Add to drip sequence'
  END;

  v_contact_time := NOW() + INTERVAL '2 hours';

  v_insights := jsonb_build_object(
    'score_breakdown', jsonb_build_object(
      'budget',     v_budget_score,
      'engagement', v_engagement_score,
      'intent',     v_intent_score,
      'timing',     v_timing_score,
      'profile',    v_profile_score,
      'behavior',   v_behavior_score
    ),
    'behavior_summary', jsonb_build_object(
      'properties_viewed', COALESCE(v_behavior.properties_viewed, 0),
      'properties_saved',  COALESCE(v_behavior.properties_saved,  0),
      'active_days',       COALESCE(v_behavior.active_days,       0)
    )
  );

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
