/**
 * Create Property Upload Draft API
 * Initializes a new property upload draft for multi-step form
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { secureApiRoute } from '@/lib/security/api-security';
import { Permissions } from '@/lib/security/permissions';
import { z } from 'zod';

export const runtime = 'nodejs';
export const maxDuration = 30;

const createDraftSchema = z.object({
  builder_id: z.string().uuid().optional(),
  uploaded_by_admin: z.boolean().default(false),
});

/**
 * POST /api/properties/create-draft
 * Creates a new property upload draft
 */
export const POST = secureApiRoute(
  async (request: NextRequest, user) => {
    const supabase = getSupabase();
    const body = await request.json();
    const validatedData = createDraftSchema.parse(body);

    try {
      // Verify user permissions
      if (validatedData.uploaded_by_admin) {
        const { data: userRole } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (userRole?.role !== 'admin') {
          return NextResponse.json(
            { success: false, error: 'Insufficient permissions. Admin role required.' },
            { status: 403 }
          );
        }

        // If admin is uploading for a builder, verify assignment
        if (validatedData.builder_id) {
          const { data: assignment } = await supabase
            .from('admin_builder_assignments')
            .select('id')
            .eq('admin_user_id', user.id)
            .eq('builder_id', validatedData.builder_id)
            .eq('is_active', true)
            .single();

          if (!assignment) {
            return NextResponse.json(
              { success: false, error: 'You are not assigned to manage this builder' },
              { status: 403 }
            );
          }
        }
      } else {
        // Builder uploading directly - verify builder_id matches user's builder
        if (validatedData.builder_id) {
          const { data: builder } = await supabase
            .from('builders')
            .select('id')
            .eq('id', validatedData.builder_id)
            .single();

          if (!builder) {
            return NextResponse.json(
              { success: false, error: 'Invalid builder ID' },
              { status: 400 }
            );
          }
        }
      }

      // Create draft
      const { data: draft, error } = await supabase
        .from('property_upload_drafts')
        .insert({
          builder_id: validatedData.builder_id || null,
          uploaded_by_user_id: user.id,
          uploaded_by_admin: validatedData.uploaded_by_admin,
          current_step: 1,
          status: 'draft',
          completed_steps: [false, false, false, false, false],
          overall_completion_percentage: 0,
        })
        .select()
        .single();

      if (error) {
        console.error('[Create Draft] Error:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to create draft' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        draft_id: draft.id,
        current_step: draft.current_step,
        message: 'Draft created successfully',
      });
    } catch (error: any) {
      console.error('[Create Draft] Error:', error);
      return NextResponse.json(
        { success: false, error: error.message || 'Failed to create draft' },
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






































