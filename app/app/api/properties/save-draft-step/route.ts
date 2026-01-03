/**
 * Save Draft Step API
 * Saves progress for a specific step in the property upload form
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { secureApiRoute } from '@/lib/security/api-security';
import { Permissions } from '@/lib/security/permissions';
import { z } from 'zod';

export const runtime = 'nodejs';
export const maxDuration = 30;

const saveDraftStepSchema = z.object({
  draft_id: z.string().uuid(),
  step_number: z.number().int().min(1).max(5),
  step_data: z.record(z.any()),
  mark_step_complete: z.boolean().default(false),
});

/**
 * PUT /api/properties/save-draft-step
 * Saves progress for a specific step
 */
export const PUT = secureApiRoute(
  async (request: NextRequest, user) => {
    const supabase = getSupabase();
    const body = await request.json();
    const validatedData = saveDraftStepSchema.parse(body);

    try {
      // Verify draft ownership
      const { data: draft, error: draftError } = await supabase
        .from('property_upload_drafts')
        .select('uploaded_by_user_id, uploaded_by_admin, builder_id')
        .eq('id', validatedData.draft_id)
        .single();

      if (draftError || !draft) {
        return NextResponse.json(
          { success: false, error: 'Draft not found' },
          { status: 404 }
        );
      }

      // Check permissions
      if (draft.uploaded_by_user_id !== user.id) {
        // Check if admin has permission
        if (draft.uploaded_by_admin) {
          const { data: assignment } = await supabase
            .from('admin_builder_assignments')
            .select('id')
            .eq('admin_user_id', user.id)
            .eq('builder_id', draft.builder_id)
            .eq('is_active', true)
            .single();

          if (!assignment) {
            return NextResponse.json(
              { success: false, error: 'Insufficient permissions' },
              { status: 403 }
            );
          }
        } else {
          return NextResponse.json(
            { success: false, error: 'Insufficient permissions' },
            { status: 403 }
          );
        }
      }

      // Validate step data (basic validation)
      const validationErrors: Record<string, string> = {};
      
      // Step 1: Basic details validation
      if (validatedData.step_number === 1) {
        if (!validatedData.step_data.title || validatedData.step_data.title.length < 5) {
          validationErrors.title = 'Title must be at least 5 characters';
        }
        if (!validatedData.step_data.property_type) {
          validationErrors.property_type = 'Property type is required';
        }
        if (!validatedData.step_data.city) {
          validationErrors.city = 'City is required';
        }
      }

      // Step 5: Pricing validation
      if (validatedData.step_number === 5) {
        if (!validatedData.step_data.price_inr || validatedData.step_data.price_inr <= 0) {
          validationErrors.price_inr = 'Valid price is required';
        }
      }

      const isValid = Object.keys(validationErrors).length === 0;

      // Prepare update object
      const updateData: any = {
        [`step_${validatedData.step_number}_data`]: validatedData.step_data,
        last_auto_save: new Date().toISOString(),
        validation_errors: validationErrors,
        is_valid: isValid,
      };

      if (validatedData.mark_step_complete && isValid) {
        // Update completed_steps array
        const { data: currentDraft } = await supabase
          .from('property_upload_drafts')
          .select('completed_steps')
          .eq('id', validatedData.draft_id)
          .single();

        const completedSteps = [...(currentDraft?.completed_steps || [false, false, false, false, false])];
        completedSteps[validatedData.step_number - 1] = true;

        updateData.completed_steps = completedSteps;
        updateData.overall_completion_percentage =
          (completedSteps.filter(Boolean).length / 5) * 100;

        // Auto-advance to next step if not on last step
        if (validatedData.step_number < 5) {
          updateData.current_step = validatedData.step_number + 1;
        }
      }

      // Update draft
      const { data: updatedDraft, error: updateError } = await supabase
        .from('property_upload_drafts')
        .update(updateData)
        .eq('id', validatedData.draft_id)
        .select()
        .single();

      if (updateError) {
        console.error('[Save Draft Step] Error:', updateError);
        return NextResponse.json(
          { success: false, error: 'Failed to save draft step' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        draft_id: updatedDraft.id,
        current_step: updatedDraft.current_step,
        overall_completion_percentage: updatedDraft.overall_completion_percentage,
        validation_errors: isValid ? undefined : validationErrors,
      });
    } catch (error: any) {
      console.error('[Save Draft Step] Error:', error);
      return NextResponse.json(
        { success: false, error: error.message || 'Failed to save draft step' },
        { status: 500 }
      );
    }
  },
  {
    requireAuth: true,
    requireRole: ['builder', 'admin'],
    requirePermission: Permissions.PROPERTY_CREATE,
  }
);






