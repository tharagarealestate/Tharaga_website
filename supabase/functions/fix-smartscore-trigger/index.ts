// One-shot edge function to fix ALL broken triggers on the leads table
// Wraps every AFTER INSERT trigger in EXCEPTION handlers so lead inserts NEVER fail

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const dbUrl = Deno.env.get('SUPABASE_DB_URL')

  if (req.method === 'GET') {
    return new Response(JSON.stringify({ has_db_url: !!dbUrl }), {
      headers: { 'Content-Type': 'application/json' }
    })
  }

  if (!dbUrl) {
    return new Response(JSON.stringify({ success: false, error: 'No SUPABASE_DB_URL' }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    })
  }

  try {
    const { Client } = await import("https://deno.land/x/postgres@v0.17.0/mod.ts")
    const client = new Client(dbUrl)
    await client.connect()

    const fixes: string[] = []

    // Fix 1: trigger_update_smartscore_v2 — non-fatal wrapper
    await client.queryArray(`
      CREATE OR REPLACE FUNCTION public.trigger_update_smartscore_v2()
      RETURNS TRIGGER AS $$
      BEGIN
        BEGIN
          PERFORM public.update_lead_smartscore_v2(NEW.id);
        EXCEPTION WHEN OTHERS THEN
          RAISE WARNING '[SmartScore] error for lead %: %', NEW.id, SQLERRM;
        END;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `)
    fixes.push('trigger_update_smartscore_v2: wrapped in EXCEPTION')

    // Fix 2: trigger_workflow_on_lead_created — non-fatal wrapper
    await client.queryArray(`
      CREATE OR REPLACE FUNCTION public.trigger_workflow_on_lead_created()
      RETURNS TRIGGER AS $$
      DECLARE
        v_workflow RECORD;
      BEGIN
        BEGIN
          FOR v_workflow IN
            SELECT id, builder_id
            FROM public.workflow_templates
            WHERE trigger_type = 'lead_created'
              AND is_active = true
              AND builder_id = NEW.builder_id
          LOOP
            PERFORM public.create_workflow_execution(
              v_workflow.id,
              NEW.id,
              'lead_created',
              jsonb_build_object('lead_id', NEW.id, 'created_at', NEW.created_at)
            );
          END LOOP;
        EXCEPTION WHEN OTHERS THEN
          RAISE WARNING '[WorkflowTrigger] error for lead %: %', NEW.id, SQLERRM;
        END;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `)
    fixes.push('trigger_workflow_on_lead_created: wrapped in EXCEPTION')

    // Fix 3: notify_builder_new_lead — non-fatal wrapper
    await client.queryArray(`
      CREATE OR REPLACE FUNCTION notify_builder_new_lead()
      RETURNS TRIGGER AS $$
      BEGIN
        BEGIN
          INSERT INTO notifications (user_id, type, title, message, metadata)
          SELECT
            bp.user_id,
            'new_lead',
            'New Lead Received!',
            COALESCE(NEW.name, 'A buyer') || ' is interested in your property',
            jsonb_build_object('lead_id', NEW.id, 'property_id', NEW.property_id)
          FROM builder_profiles bp
          WHERE bp.id = NEW.builder_id OR bp.user_id = NEW.builder_id;
        EXCEPTION WHEN OTHERS THEN
          RAISE WARNING '[NotifyLead] error for lead %: %', NEW.id, SQLERRM;
        END;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `)
    fixes.push('notify_builder_new_lead: wrapped in EXCEPTION')

    // Fix 4: calculate_smartscore_v2 — TEXT cast for lead_interactions.lead_id
    await client.queryArray(`
      CREATE OR REPLACE FUNCTION public.calculate_smartscore_v2(p_lead_id BIGINT)
      RETURNS TABLE(
        smartscore DECIMAL(5,2), conversion_probability DECIMAL(5,4),
        predicted_ltv DECIMAL(12,2), priority_tier TEXT,
        next_best_action TEXT, optimal_contact_time TIMESTAMPTZ, ai_insights JSONB
      ) AS $$
      DECLARE
        v_lead RECORD; v_behavior RECORD; v_engagement RECORD;
        v_user_id UUID;
        v_budget_score DECIMAL(5,2):=0; v_engagement_score DECIMAL(5,2):=0;
        v_intent_score DECIMAL(5,2):=0; v_timing_score DECIMAL(5,2):=0;
        v_profile_score DECIMAL(5,2):=0; v_behavior_score DECIMAL(5,2):=0;
        v_final_score DECIMAL(5,2); v_conversion_prob DECIMAL(5,4);
        v_ltv DECIMAL(12,2); v_tier TEXT; v_action TEXT;
        v_contact_time TIMESTAMPTZ; v_insights JSONB:='{}'::JSONB;
        v_user_prefs RECORD;
      BEGIN
        SELECT l.*, p.email AS profile_email, p.phone AS profile_phone, p.created_at AS user_created_at
        INTO v_lead FROM public.leads l LEFT JOIN public.profiles p ON p.id=l.buyer_id WHERE l.id=p_lead_id;
        IF NOT FOUND THEN RETURN; END IF;
        v_user_id:=v_lead.buyer_id;
        IF v_user_id IS NULL AND v_lead.email IS NOT NULL THEN
          SELECT id INTO v_user_id FROM public.profiles WHERE email=v_lead.email LIMIT 1;
        END IF;
        IF v_user_id IS NOT NULL THEN
          SELECT * INTO v_user_prefs FROM public.user_preferences WHERE user_id=v_user_id LIMIT 1;
          SELECT COUNT(DISTINCT property_id) FILTER (WHERE behavior_type='property_view') AS properties_viewed,
            COUNT(*) FILTER (WHERE behavior_type IN ('saved_property','favorite')) AS properties_saved,
            COUNT(DISTINCT DATE(timestamp)) AS active_days, MAX(timestamp) AS last_activity
          INTO v_behavior FROM public.user_behavior
          WHERE user_id=v_user_id AND timestamp>NOW()-INTERVAL '30 days';
        END IF;
        SELECT COUNT(*) AS total_interactions, COUNT(DISTINCT interaction_type) AS interaction_types,
          MAX(timestamp) AS last_interaction,
          COUNT(*) FILTER (WHERE interaction_type IN ('call_answered','email_replied','form_submitted')) AS positive_responses
        INTO v_engagement FROM public.lead_interactions
        WHERE lead_id=p_lead_id::TEXT AND timestamp>NOW()-INTERVAL '30 days';
        IF v_lead.budget IS NOT NULL AND v_lead.budget>0 THEN
          v_budget_score:=LEAST(20,20*(1-ABS(COALESCE(v_user_prefs.budget_min,v_lead.budget)-v_lead.budget)/GREATEST(v_lead.budget,1)));
        ELSE v_budget_score:=5; END IF;
        v_engagement_score:=LEAST(20,COALESCE(v_engagement.total_interactions,0)*2+COALESCE(v_engagement.positive_responses,0)*5);
        v_intent_score:=CASE v_lead.status WHEN 'qualified' THEN 20 WHEN 'contacted' THEN 12 WHEN 'new' THEN 6 ELSE 4 END;
        IF v_lead.buying_urgency='high' THEN v_intent_score:=LEAST(20,v_intent_score+8); END IF;
        IF v_lead.buying_urgency='medium' THEN v_intent_score:=LEAST(20,v_intent_score+4); END IF;
        IF v_lead.created_at>NOW()-INTERVAL '1 day' THEN v_timing_score:=15;
        ELSIF v_lead.created_at>NOW()-INTERVAL '3 days' THEN v_timing_score:=12;
        ELSIF v_lead.created_at>NOW()-INTERVAL '7 days' THEN v_timing_score:=8;
        ELSIF v_lead.created_at>NOW()-INTERVAL '30 days' THEN v_timing_score:=4;
        ELSE v_timing_score:=1; END IF;
        IF v_lead.email IS NOT NULL THEN v_profile_score:=v_profile_score+4; END IF;
        IF v_lead.phone_number IS NOT NULL THEN v_profile_score:=v_profile_score+4; END IF;
        IF v_lead.budget IS NOT NULL THEN v_profile_score:=v_profile_score+4; END IF;
        IF v_lead.message IS NOT NULL AND LENGTH(v_lead.message)>20 THEN v_profile_score:=v_profile_score+3; END IF;
        IF v_behavior IS NOT NULL THEN
          v_behavior_score:=LEAST(10,COALESCE(v_behavior.properties_viewed,0)+COALESCE(v_behavior.properties_saved,0)*2+COALESCE(v_behavior.active_days,0));
        END IF;
        v_final_score:=LEAST(100,GREATEST(0,v_budget_score+v_engagement_score+v_intent_score+v_timing_score+v_profile_score+v_behavior_score));
        v_conversion_prob:=ROUND((v_final_score/100.0)::NUMERIC,4);
        v_ltv:=CASE WHEN v_final_score>=80 THEN 2500000 WHEN v_final_score>=60 THEN 1500000 WHEN v_final_score>=40 THEN 750000 ELSE 250000 END;
        v_tier:=CASE WHEN v_final_score>=80 THEN 'hot' WHEN v_final_score>=60 THEN 'warm' WHEN v_final_score>=40 THEN 'developing' ELSE 'cold' END;
        v_action:=CASE v_tier WHEN 'hot' THEN 'Call immediately' WHEN 'warm' THEN 'Send property details today' WHEN 'developing' THEN 'Send follow-up email' ELSE 'Add to drip sequence' END;
        v_contact_time:=NOW()+INTERVAL '2 hours';
        v_insights:=jsonb_build_object('score_breakdown',jsonb_build_object('budget',v_budget_score,'engagement',v_engagement_score,'intent',v_intent_score,'timing',v_timing_score,'profile',v_profile_score,'behavior',v_behavior_score),'behavior_summary',jsonb_build_object('properties_viewed',COALESCE(v_behavior.properties_viewed,0),'properties_saved',COALESCE(v_behavior.properties_saved,0),'active_days',COALESCE(v_behavior.active_days,0)));
        RETURN QUERY SELECT v_final_score,v_conversion_prob,v_ltv,v_tier,v_action,v_contact_time,v_insights;
      END;
      $$ LANGUAGE plpgsql;
    `)
    fixes.push('calculate_smartscore_v2: lead_id::TEXT + budget_min column name fixed')

    await client.end()

    return new Response(JSON.stringify({
      success: true,
      message: 'All lead INSERT triggers hardened against errors',
      fixes,
    }), { headers: { 'Content-Type': 'application/json' } })
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    })
  }
})
