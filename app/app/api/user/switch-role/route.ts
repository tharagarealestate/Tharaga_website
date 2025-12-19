import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/user/switch-role
 * Updates is_primary flag in user_roles
 * Accepts: { role: 'buyer' | 'builder' | 'admin' (admin only for admin owner) }
 * Sets chosen role to is_primary: true, others to false
 * Also updates profiles table role field for backward compatibility
 * Format expected by role-manager-v2.js
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { role } = body;

    const supabase = createRouteHandlerClient({ cookies });
    
    // Get authenticated user first
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    // Check if admin owner (tharagarealestate@gmail.com) - allow admin role switching
    const isAdminOwner = user.email === 'tharagarealestate@gmail.com';
    
    // Validate role - allow admin for admin owner
    const validRoles = isAdminOwner ? ['buyer', 'builder', 'admin'] : ['buyer', 'builder'];
    
    if (!role || !validRoles.includes(role)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${validRoles.join(', ')}` },
        { status: 400 }
      );
    }
    
    // For admin role, only allow if user is admin owner
    if (role === 'admin' && !isAdminOwner) {
      return NextResponse.json(
        { error: 'Admin role is only available to admin owner' },
        { status: 403 }
      );
    }
    
    // Verify user has the target role (or is admin owner switching to admin)
    if (role === 'admin' && isAdminOwner) {
      // Admin owner can switch to admin even if not in user_roles table
      // Check if admin role exists, if not, create it
      const { data: existingAdminRole } = await supabase
        .from('user_roles')
        .select('role, is_primary')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();
      
      if (!existingAdminRole) {
        // Create admin role for admin owner
        const { error: createError } = await supabase
          .from('user_roles')
          .insert({
            user_id: user.id,
            role: 'admin',
            is_primary: false, // Will be set to true below
            verified: true,
          });
        
        if (createError) {
          console.error('Error creating admin role:', createError);
          return NextResponse.json(
            { error: 'Failed to create admin role' },
            { status: 500 }
          );
        }
      }
    } else {
      // For buyer/builder, verify user has the role
      const { data: userRole } = await supabase
        .from('user_roles')
        .select('role, is_primary')
        .eq('user_id', user.id)
        .eq('role', role)
        .single();

      if (!userRole) {
        return NextResponse.json(
          { error: `You don't have access to the ${role} role` },
          { status: 403 }
        );
      }
    }

    // Set all roles to is_primary: false first
    const { error: unsetError } = await supabase
      .from('user_roles')
      .update({ is_primary: false })
      .eq('user_id', user.id);

    if (unsetError) {
      console.error('Error unsetting primary roles:', unsetError);
      return NextResponse.json(
        { error: 'Failed to switch role' },
        { status: 500 }
      );
    }

    // Set target role to is_primary: true
    const { error: setError } = await supabase
      .from('user_roles')
      .update({ is_primary: true })
      .eq('user_id', user.id)
      .eq('role', role);

    if (setError) {
      console.error('Error setting primary role:', setError);
      return NextResponse.json(
        { error: 'Failed to switch role' },
        { status: 500 }
      );
    }

    // Update profiles table role field for backward compatibility
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        role: role,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (profileError) {
      console.error('Error updating profile:', profileError);
      // Don't fail the request, just log the error
    }

    return NextResponse.json({
      success: true,
      active_role: role,
    });
  } catch (error) {
    console.error('Switch role API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
