import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/user/add-role
 * Inserts into user_roles table
 * Accepts: { role: 'buyer' | 'builder', is_primary: boolean, builder_data?: {...} }
 * If builder role, also creates entry in builder_profiles table
 * Format expected by role-manager-v2.js
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { role, is_primary = false, builder_data } = body;

    // Validate role
    if (!role || !['buyer', 'builder'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be "buyer" or "builder"' },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient({ cookies });
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    // Check if role already exists
    const { data: existingRole } = await supabase
      .from('user_roles')
      .select('id, is_primary')
      .eq('user_id', user.id)
      .eq('role', role)
      .single();

    if (existingRole) {
      // Role exists, just return success
      return NextResponse.json({
        success: true,
        role_added: role,
        is_primary: existingRole.is_primary,
        message: 'Role already exists',
      });
    }

    // If setting as primary, unset other primary roles
    if (is_primary) {
      await supabase
        .from('user_roles')
        .update({ is_primary: false })
        .eq('user_id', user.id)
        .neq('role', role);
    }

    // Insert new role
    const { error: insertError } = await supabase
      .from('user_roles')
      .insert({
        user_id: user.id,
        role: role,
        is_primary: is_primary,
        verified: false,
      });

    if (insertError) {
      console.error('Role insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to add role' },
        { status: 500 }
      );
    }

    // Update profiles table role field for backward compatibility
    if (is_primary) {
      await supabase
        .from('profiles')
        .update({
          role: role,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
    }

    // If builder role, create/update builder profile
    if (role === 'builder') {
      const { data: existingBuilder } = await supabase
        .from('builder_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!existingBuilder && builder_data) {
        const { error: builderError } = await supabase
          .from('builder_profiles')
          .insert({
            user_id: user.id,
            company_name: builder_data.company_name || '',
            gstin: builder_data.gstin || null,
            rera_number: builder_data.rera_number || null,
            verification_status: 'pending',
          });

        if (builderError) {
          console.error('Builder profile creation error:', builderError);
          // Don't fail the request, just log the error
        }
      } else if (existingBuilder && builder_data) {
        // Update existing builder profile
        await supabase
          .from('builder_profiles')
          .update({
            company_name: builder_data.company_name || existingBuilder.company_name,
            gstin: builder_data.gstin || null,
            rera_number: builder_data.rera_number || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingBuilder.id);
      }
    }

    // If buyer role, create buyer profile if not exists
    if (role === 'buyer') {
      const { data: existingBuyer } = await supabase
        .from('buyer_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!existingBuyer) {
        await supabase.from('buyer_profiles').insert({
          user_id: user.id,
          preferences: {},
          saved_properties: [],
        });
      }
    }

    return NextResponse.json({
      success: true,
      role_added: role,
      is_primary: is_primary,
      verification_required: role === 'builder',
    });
  } catch (error) {
    console.error('Add role API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}



