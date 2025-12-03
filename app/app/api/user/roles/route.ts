import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// Response type
interface UserRolesResponse {
  success: boolean;
  data?: {
    userId: string;
    email: string;
    roles: string[];
    activeRole: string;
    permissions: {
      permission: string;
      resource: string;
      allowed: boolean;
    }[];
    metadata: {
      createdAt: string;
      lastRoleChange: string | null;
      verificationStatus: {
        builder: 'pending' | 'verified' | 'rejected' | 'not_applicable';
        buyer: 'active' | 'inactive';
      };
    };
  };
  error?: string;
}

export async function GET(request: NextRequest): Promise<NextResponse<UserRolesResponse>> {
  const startTime = Date.now();
  
  try {
    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    // Fetch user profile with roles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        role,
        created_at,
        updated_at
      `)
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch user profile' },
        { status: 500 }
      );
    }

    // Fetch user roles from user_roles table
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const roles = userRoles?.map(r => r.role) || [];
    const activeRole = profile.role || roles[0] || 'buyer';

    // Fetch last role transition
    const { data: lastTransition } = await supabase
      .from('role_transitions')
      .select('created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Fetch permissions for active role
    const { data: permissions, error: permError } = await supabase
      .from('role_permissions')
      .select('permission, resource, allowed')
      .eq('role', activeRole);

    if (permError) {
      console.error('Permissions fetch error:', permError);
    }

    // Check builder verification status if user has builder role
    let builderStatus: 'pending' | 'verified' | 'rejected' | 'not_applicable' = 'not_applicable';
    
    if (roles.includes('builder')) {
      const { data: builderProfile } = await supabase
        .from('builder_profiles')
        .select('verification_status')
        .eq('user_id', user.id)
        .single();
      
      builderStatus = builderProfile?.verification_status || 'pending';
    }

    return NextResponse.json({
      success: true,
      data: {
        userId: user.id,
        email: profile.email || user.email || '',
        roles: roles.length > 0 ? roles : ['buyer'],
        activeRole,
        permissions: permissions || [],
        metadata: {
          createdAt: profile.created_at,
          lastRoleChange: lastTransition?.created_at || null,
          verificationStatus: {
            builder: builderStatus,
            buyer: 'active',
          },
        },
      },
    });
  } catch (error) {
    console.error('Roles API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}



