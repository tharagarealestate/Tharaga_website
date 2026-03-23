/**
 * LAYER 7: CASH FLOW AUTOMATION
 * Deal lifecycle and milestone tracking
 */

import { getSupabase } from '@/lib/supabase';

export interface LifecycleStage {
  stage: string;
  timestamp: Date | null;
  daysInStage: number | null;
}

/**
 * Initialize deal lifecycle
 */
export async function initializeDealLifecycle(
  journeyId: string,
  propertyId: string,
  builderId: string
): Promise<string> {
  const supabase = getSupabase();

  const { data: lifecycle, error } = await supabase
    .from('deal_lifecycle')
    .insert([{
      journey_id: journeyId,
      property_id: propertyId,
      builder_id: builderId,
      current_stage: 'lead_generated',
      lead_generated_at: new Date().toISOString(),
      next_milestone: 'first_contact',
      next_milestone_due_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    }])
    .select('id')
    .single();

  if (error || !lifecycle) {
    throw new Error(`Failed to create lifecycle: ${error?.message}`);
  }

  return lifecycle.id;
}

/**
 * Advance lifecycle stage
 */
export async function advanceLifecycleStage(
  lifecycleId: string,
  newStage: string
): Promise<void> {
  const supabase = getSupabase();

  const { data: lifecycle } = await supabase
    .from('deal_lifecycle')
    .select('*')
    .eq('id', lifecycleId)
    .single();

  if (!lifecycle) return;

  const updates: any = {
    current_stage: newStage
  };

  // Set timestamp for new stage
  const stageTimestampMap: Record<string, string> = {
    'first_contact': 'first_contact_at',
    'viewing_scheduled': 'viewing_scheduled_at',
    'viewing_completed': 'viewing_completed_at',
    'price_negotiation': 'negotiation_started_at',
    'contract_signed': 'contract_signed_at',
    'payment_received': 'first_payment_at',
    'possession_handover': 'possession_handover_at',
    'closed': 'closed_at'
  };

  if (stageTimestampMap[newStage]) {
    updates[stageTimestampMap[newStage]] = new Date().toISOString();
  }

  // Calculate days in previous stage
  if (lifecycle.current_stage && lifecycle.current_stage !== newStage) {
    const previousStageTimestamp = getStageTimestamp(lifecycle, lifecycle.current_stage);
    if (previousStageTimestamp) {
      const daysInStage = Math.floor(
        (Date.now() - new Date(previousStageTimestamp).getTime()) / (24 * 60 * 60 * 1000)
      );
      updates.days_in_stage = daysInStage;
    }
  }

  // Calculate total days to close
  if (newStage === 'closed' && lifecycle.lead_generated_at) {
    const totalDays = Math.floor(
      (Date.now() - new Date(lifecycle.lead_generated_at).getTime()) / (24 * 60 * 60 * 1000)
    );
    updates.total_days_to_close = totalDays;
  }

  // Set next milestone
  const nextMilestone = getNextMilestone(newStage);
  if (nextMilestone) {
    updates.next_milestone = nextMilestone.milestone;
    updates.next_milestone_due_at = nextMilestone.dueAt;
  }

  // Check for stalling
  if (lifecycle.current_stage === newStage) {
    const daysInCurrentStage = lifecycle.days_in_stage || 0;
    if (daysInCurrentStage > getStallingThreshold(newStage)) {
      updates.is_stalling = true;
      updates.stalling_reason = `Deal has been in ${newStage} stage for ${daysInCurrentStage} days`;
    }
  }

  await supabase
    .from('deal_lifecycle')
    .update(updates)
    .eq('id', lifecycleId);
}

function getStageTimestamp(lifecycle: any, stage: string): string | null {
  const map: Record<string, string> = {
    'lead_generated': 'lead_generated_at',
    'first_contact': 'first_contact_at',
    'viewing_scheduled': 'viewing_scheduled_at',
    'viewing_completed': 'viewing_completed_at',
    'price_negotiation': 'negotiation_started_at',
    'contract_signed': 'contract_signed_at',
    'payment_received': 'first_payment_at',
    'possession_handover': 'possession_handover_at',
    'closed': 'closed_at'
  };

  return lifecycle[map[stage]] || null;
}

function getNextMilestone(currentStage: string): { milestone: string; dueAt: string } | null {
  const milestones: Record<string, { milestone: string; days: number }> = {
    'lead_generated': { milestone: 'first_contact', days: 1 },
    'first_contact': { milestone: 'viewing_scheduled', days: 3 },
    'viewing_scheduled': { milestone: 'viewing_completed', days: 7 },
    'viewing_completed': { milestone: 'price_negotiation', days: 3 },
    'price_negotiation': { milestone: 'contract_signed', days: 7 },
    'contract_signed': { milestone: 'payment_received', days: 3 },
    'payment_received': { milestone: 'possession_handover', days: 30 },
    'possession_handover': { milestone: 'closed', days: 1 }
  };

  const next = milestones[currentStage];
  if (!next) return null;

  return {
    milestone: next.milestone,
    dueAt: new Date(Date.now() + next.days * 24 * 60 * 60 * 1000).toISOString()
  };
}

function getStallingThreshold(stage: string): number {
  const thresholds: Record<string, number> = {
    'lead_generated': 3,
    'first_contact': 7,
    'viewing_scheduled': 14,
    'viewing_completed': 7,
    'price_negotiation': 14,
    'contract_signed': 7,
    'payment_received': 14,
    'possession_handover': 60
  };

  return thresholds[stage] || 30;
}

