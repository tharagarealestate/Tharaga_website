import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/user/switch-role
 * Updates is_primary flag in user_roles
 * Accepts: { role: 'buyer' | 'builder' }
 * Sets chosen role to is_primary: true, others to false
 * Also updates profiles table role field for backward compatibility
 * Format expected by role-manager-v2.js
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { role } = body;

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

    // Verify user has the target role
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



