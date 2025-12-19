import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/user/roles
 * Fetches user roles from user_roles table
 * Returns array of roles with is_primary flag
 * Format expected by role-manager-v2.js
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    // Fetch user roles from user_roles table with is_primary flag
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role, is_primary, verified')
      .eq('user_id', user.id)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true });

    if (rolesError) {
      console.error('Roles fetch error:', rolesError);
      return NextResponse.json(
        { error: 'Failed to fetch user roles' },
        { status: 500 }
      );
    }

    // Extract roles array and find primary role
    const roles = userRoles?.map(r => r.role) || [];
    const primaryRoleData = userRoles?.find(r => r.is_primary);
    let primaryRole = primaryRoleData?.role || roles[0] || null;
    
    // Special handling for admin owner (tharagarealestate@gmail.com)
    // Admin owner always has admin access, even if not in user_roles table
    const isAdminOwner = user.email === 'tharagarealestate@gmail.com';
    
    // If admin owner doesn't have admin in roles array, add it (they always have admin privilege)
    if (isAdminOwner && !roles.includes('admin')) {
      roles.push('admin');
      // If no primary role is set, make admin the primary
      if (!primaryRole) {
        primaryRole = 'admin';
      }
    }
    
    // If admin owner has admin role but it's not primary, and they have no primary role,
    // prioritize admin as primary
    if (isAdminOwner && roles.includes('admin') && !primaryRoleData) {
      primaryRole = 'admin';
    }

    // Check builder verification status
    let builderVerified = false;
    let hasBuilderProfile = false;
    if (roles.includes('builder')) {
      const { data: builderProfile } = await supabase
        .from('builder_profiles')
        .select('verification_status')
        .eq('user_id', user.id)
        .single();
      
      hasBuilderProfile = !!builderProfile;
      builderVerified = builderProfile?.verification_status === 'verified';
    }

    // Check buyer profile
    let hasBuyerProfile = false;
    if (roles.includes('buyer')) {
      const { data: buyerProfile } = await supabase
        .from('buyer_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      hasBuyerProfile = !!buyerProfile;
    }

    // Return format expected by role-manager-v2.js
    return NextResponse.json({
      roles,
      primary_role: primaryRole,
      builder_verified: builderVerified,
      has_builder_profile: hasBuilderProfile,
      has_buyer_profile: hasBuyerProfile,
    });
  } catch (error) {
    console.error('Roles API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}



