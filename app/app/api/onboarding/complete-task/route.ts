/**
 * Complete Onboarding Task API Route
 * POST /api/onboarding/complete-task
 * Marks an onboarding task as complete
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
    const { task } = body;

    if (!task) {
      return NextResponse.json(
        { error: 'Task is required' },
        { status: 400 }
      );
    }

    // Fetch current checklist
    const { data: checklist, error } = await supabase
      .from('onboarding_checklists')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error || !checklist) {
      return NextResponse.json(
        { error: 'Checklist not found' },
        { status: 404 }
      );
    }

    // Update checklist item
    const checklistItems = checklist.checklist_items as any[];
    const updatedItems = checklistItems.map((item: any) => {
      if (item.task === task) {
        return {
          ...item,
          completed: true,
          completed_at: new Date().toISOString()
        };
      }
      return item;
    });

    // Calculate progress
    const completedCount = updatedItems.filter((item: any) => item.completed).length;
    const overallProgress = Math.round((completedCount / updatedItems.length) * 100);
    const isComplete = overallProgress === 100;

    // Update database
    const { error: updateError } = await supabase
      .from('onboarding_checklists')
      .update({
        checklist_items: updatedItems,
        overall_progress: overallProgress,
        current_step: completedCount + 1,
        is_onboarding_complete: isComplete,
        completed_at: isComplete ? new Date().toISOString() : null
      })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error updating checklist:', updateError);
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      overall_progress: overallProgress,
      is_complete: isComplete
    });
  } catch (error: any) {
    console.error('Error completing task:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}




