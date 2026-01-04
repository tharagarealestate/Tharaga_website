/**
 * Admin Builder Assignments API
 * Manage admin assignments to builders
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { secureApiRoute } from '@/lib/security/api-security';
import { Permissions } from '@/lib/security/permissions';
import { z } from 'zod';

export const runtime = 'edge';
export const maxDuration = 30;

const assignmentSchema = z.object({
  builder_id: z.string().uuid(),
  permissions: z.object({
    upload_properties: z.boolean().optional(),
    edit_properties: z.boolean().optional(),
    view_analytics: z.boolean().optional(),
    manage_leads: z.boolean().optional(),
  }).optional(),
});

/**
 * GET /api/admin/builder-assignments
 * Get all builder assignments for current admin
 */
export const GET = secureApiRoute(
  async (request: NextRequest, user) => {
    const supabase = getSupabase();
    
    const { data: assignments, error } = await supabase
      .from('admin_builder_assignments')
      .select(`
        *,
        builder:builders(id, name, email, logo_url, status)
      `)
      .eq('admin_user_id', user.id)
      .eq('is_active', true);
    
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      assignments: assignments || [],
    });
  },
  {
    requireAuth: true,
    requireRole: ['admin'],
    requirePermission: Permissions.ADMIN_ACCESS,
  }
);

/**
 * POST /api/admin/builder-assignments
 * Create a new builder assignment
 */
export const POST = secureApiRoute(
  async (request: NextRequest, user) => {
    const supabase = getSupabase();
    const body = await request.json();
    const validatedData = assignmentSchema.parse(body);
    
    // Check if assignment already exists
    const { data: existing } = await supabase
      .from('admin_builder_assignments')
      .select('id')
      .eq('admin_user_id', user.id)
      .eq('builder_id', validatedData.builder_id)
      .eq('is_active', true)
      .single();
    
    if (existing) {
      return NextResponse.json(
        { error: 'Assignment already exists' },
        { status: 400 }
      );
    }
    
    // Create assignment
    const { data: assignment, error } = await supabase
      .from('admin_builder_assignments')
      .insert([
        {
          admin_user_id: user.id,
          builder_id: validatedData.builder_id,
          permissions: validatedData.permissions || {
            upload_properties: true,
            edit_properties: true,
            view_analytics: true,
            manage_leads: true,
          },
          is_active: true,
        },
      ])
      .select()
      .single();
    
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      assignment,
    });
  },
  {
    requireAuth: true,
    requireRole: ['admin'],
    requirePermission: Permissions.ADMIN_ACCESS,
    validateSchema: assignmentSchema,
  }
);











