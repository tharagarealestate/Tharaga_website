/**
 * Update Walkthrough Progress API
 * POST /api/documentation/walkthroughs/progress
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      walkthroughId,
      currentStep,
      completedSteps,
      isCompleted,
    } = body;

    if (!walkthroughId) {
      return NextResponse.json(
        { error: 'walkthroughId is required' },
        { status: 400 }
      );
    }

    // Verify walkthrough exists
    const { data: walkthrough, error: walkthroughError } = await supabase
      .from('interactive_walkthroughs')
      .select('id, steps')
      .eq('id', walkthroughId)
      .single();

    if (walkthroughError || !walkthrough) {
      return NextResponse.json(
        { error: 'Walkthrough not found' },
        { status: 404 }
      );
    }

    // Update or create progress
    const progressData: any = {
      user_id: user.id,
      walkthrough_id: walkthroughId,
      current_step: currentStep || 0,
      completed_steps: completedSteps || [],
      is_completed: isCompleted || false,
      last_interaction_at: new Date().toISOString(),
    };

    if (isCompleted) {
      progressData.completed_at = new Date().toISOString();
    }

    const { data: progress, error: progressError } = await supabase
      .from('user_walkthrough_progress')
      .upsert(progressData, {
        onConflict: 'user_id,walkthrough_id',
      })
      .select()
      .single();

    if (progressError) {
      console.error('Error updating progress:', progressError);
      return NextResponse.json(
        { error: progressError.message },
        { status: 500 }
      );
    }

    // Update walkthrough completion statistics
    if (isCompleted) {
      const { data: totalCompletions } = await supabase
        .from('user_walkthrough_progress')
        .select('id', { count: 'exact', head: true })
        .eq('walkthrough_id', walkthroughId)
        .eq('is_completed', true);

      const { data: totalStarts } = await supabase
        .from('user_walkthrough_progress')
        .select('id', { count: 'exact', head: true })
        .eq('walkthrough_id', walkthroughId);

      const completionRate = totalStarts && totalStarts > 0
        ? ((totalCompletions || 0) / totalStarts) * 100
        : 0;

      await supabase
        .from('interactive_walkthroughs')
        .update({
          total_completions: totalCompletions || 0,
          total_starts: totalStarts || 0,
          completion_rate: completionRate,
        })
        .eq('id', walkthroughId);
    }

    return NextResponse.json({
      success: true,
      progress,
    });
  } catch (error: any) {
    console.error('Error updating walkthrough progress:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}














