/**
 * ULTRA AUTOMATION ORCHESTRATOR
 * Coordinates all 10 layers for seamless automation
 */

import { getSupabase } from '@/lib/supabase';
import { analyzeProperty, generateIntentMatchedLeads } from './layer1-intelligent-leads';
import { initializeBuyerJourney } from './layer2-buyer-journey';
import { generateCommunicationSuggestion } from './layer3-communication';
import { analyzeCompetitivePosition } from './layer8-competitive';
import { generateCrossSellRecommendations } from './layer9-crosssell';
import { initializeDealLifecycle } from './layer7-lifecycle';
import { calculateConversionAnalytics } from './layer10-analytics';

export interface UltraAutomationResult {
  success: boolean;
  propertyId: string;
  leadsGenerated: number;
  journeysCreated: number;
  analysisCompleted: boolean;
  competitiveAdvantages: number;
  layersExecuted: string[];
  error?: string;
}

/**
 * Process property through all automation layers
 */
export async function processPropertyUltraAutomation(
  propertyId: string,
  builderId: string
): Promise<UltraAutomationResult> {
  const supabase = getSupabase();

  try {
    // Get subscription
    const { data: subscription } = await supabase
      .from('builder_subscriptions')
      .select('*')
      .eq('builder_id', builderId)
      .single();

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    const leadCount = subscription.leads_per_property || 50;

    // LAYER 1: Intelligent Lead Generation
    console.log('[Orchestrator] Layer 1: Analyzing property...');
    const analysis = await analyzeProperty(propertyId);

    console.log('[Orchestrator] Layer 1: Generating intent-matched leads...');
    const leads = await generateIntentMatchedLeads(propertyId, analysis, leadCount);

    // Save leads
    const leadsToInsert = leads.map(lead => ({
      property_id: propertyId,
      builder_id: builderId,
      lead_buyer_name: lead.name,
      lead_buyer_email: lead.email,
      lead_buyer_phone: lead.phone,
      lead_quality_score: lead.quality_score,
      intent_score: lead.intent_score,
      interest_level: lead.interest_level,
      estimated_budget: lead.estimated_budget,
      budget_min: lead.budget_min,
      budget_max: lead.budget_max,
      timeline: lead.timeline,
      buyer_persona: lead.buyer_persona,
      payment_capacity: lead.payment_capacity,
      preferred_location: lead.preferred_location,
      property_type_preference: lead.property_type_preference
    }));

    const { error: leadsError } = await supabase
      .from('generated_leads')
      .insert(leadsToInsert);

    if (leadsError) {
      throw new Error(`Failed to save leads: ${leadsError.message}`);
    }

    // LAYER 8: Competitive Intelligence (run in parallel)
    console.log('[Orchestrator] Layer 8: Analyzing competitive position...');
    let competitiveAdvantages = 0;
    try {
      const competitive = await analyzeCompetitivePosition(propertyId);
      competitiveAdvantages = competitive.length;
    } catch (error) {
      console.error('[Orchestrator] Competitive analysis failed:', error);
    }

    // LAYER 2: Initialize Buyer Journeys
    console.log('[Orchestrator] Layer 2: Initializing buyer journeys...');
    const journeyPromises = leads.slice(0, Math.min(leads.length, 100)).map(async (lead, index) => {
      // Find the saved lead
      const { data: savedLead } = await supabase
        .from('generated_leads')
        .select('id')
        .eq('lead_buyer_email', lead.email)
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (savedLead) {
        try {
          const journeyId = await initializeBuyerJourney(savedLead.id, propertyId, builderId);
          
          // LAYER 3: Generate communication suggestions (async, non-blocking)
          try {
            await generateCommunicationSuggestion(journeyId, builderId, 'first_contact');
          } catch (commError) {
            console.error(`[Orchestrator] Communication suggestion failed:`, commError);
          }
          
          // LAYER 7: Initialize deal lifecycle
          try {
            await initializeDealLifecycle(journeyId, propertyId, builderId);
          } catch (lifecycleError) {
            console.error(`[Orchestrator] Failed to initialize lifecycle:`, lifecycleError);
          }
          
          // LAYER 9: Pre-generate cross-sell recommendations (async)
          try {
            await generateCrossSellRecommendations(journeyId, propertyId, builderId);
          } catch (crossSellError) {
            console.error(`[Orchestrator] Cross-sell generation failed:`, crossSellError);
          }
          
          return true;
        } catch (error) {
          console.error(`[Orchestrator] Failed to initialize journey for lead ${index + 1}:`, error);
          return false;
        }
      }
      return false;
    });

    const journeyResults = await Promise.all(journeyPromises);
    const journeysCreated = journeyResults.filter(r => r).length;

    // Update property status
    await supabase
      .from('properties')
      .update({
        processing_status: 'completed',
        processing_metadata: {
          completed_at: new Date().toISOString(),
          leads_generated: leads.length,
          journeys_created: journeysCreated,
          analysis_completed: true
        }
      })
      .eq('id', propertyId);

    return {
      success: true,
      propertyId,
      leadsGenerated: leads.length,
      journeysCreated,
      analysisCompleted: true,
      competitiveAdvantages,
      layersExecuted: [
        'Layer 1: Intelligent Lead Generation',
        'Layer 2: Buyer Journey Automation',
        'Layer 3: Communication Suggestions',
        'Layer 7: Deal Lifecycle Tracking',
        'Layer 8: Competitive Intelligence',
        'Layer 9: Cross-Sell Recommendations'
      ]
    };

  } catch (error) {
    console.error('[Orchestrator] Error:', error);
    
    await supabase
      .from('properties')
      .update({
        processing_status: 'failed',
        processing_metadata: {
          error: error instanceof Error ? error.message : 'Unknown error',
          failed_at: new Date().toISOString()
        }
      })
      .eq('id', propertyId);

    return {
      success: false,
      propertyId,
      leadsGenerated: 0,
      journeysCreated: 0,
      analysisCompleted: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

