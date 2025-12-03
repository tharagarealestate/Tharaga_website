import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const SwitchRoleSchema = z.object({
  role: z.enum(['buyer', 'builder', 'admin'], {
    errorMap: () => ({ message: 'Invalid role specified' }),
  }),
});

interface SwitchRoleResponse {
  success: boolean;
  data?: {
    userId: string;
    previousRole: string;
    activeRole: string;
    redirectTo: string;
    permissions: {
      permission: string;
      resource: string;
      allowed: boolean;
    }[];
  };
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<SwitchRoleResponse>> {
  const startTime = Date.now();
  
  try {
    // Parse and validate request
    const body = await request.json();
    const validation = SwitchRoleSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { role: targetRole } = validation.data;

    // Initialize Supabase
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch current profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: 'Profile not found' },
        { status: 404 }
      );
    }

    const previousRole = profile.role || 'buyer';

    // Verify user has the target role
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', targetRole)
      .single();

    if (!userRole) {
      return NextResponse.json(
        { success: false, error: `You don't have access to the ${targetRole} role` },
        { status: 403 }
      );
    }

    // Builder role check - verify builder status
    if (targetRole === 'builder') {
      const { data: builderProfile } = await supabase
        .from('builder_profiles')
        .select('verification_status')
        .eq('user_id', user.id)
        .single();

      if (!builderProfile || builderProfile.verification_status === 'rejected') {
        return NextResponse.json({
          success: false,
          error: 'Builder account pending verification or subscription required',
        }, { status: 403 });
      }
    }

    // Update active role
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        role: targetRole,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      return NextResponse.json(
        { success: false, error: 'Failed to switch role' },
        { status: 500 }
      );
    }

    // Update or create role session
    const sessionId = request.cookies.get('session_id')?.value || 
                      crypto.randomUUID();
    await supabase.from('user_role_sessions').upsert({
      user_id: user.id,
      session_id: sessionId,
      active_role: targetRole,
      last_activity: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    }, {
      onConflict: 'user_id,session_id',
    });

    // Record role transition
    await supabase.from('role_transitions').insert({
      user_id: user.id,
      from_role: previousRole,
      to_role: targetRole,
      transition_reason: 'user_switched_role',
      ip_address: request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown',
    });

    // Fetch permissions for new role
    const { data: permissions } = await supabase
      .from('role_permissions')
      .select('permission, resource, allowed')
      .eq('role', targetRole);

    // Determine redirect URL based on role
    const redirectMap: Record<string, string> = {
      buyer: '/buyer/dashboard',
      builder: '/builder/dashboard',
      admin: '/admin/dashboard',
    };

    const response = NextResponse.json({
      success: true,
      data: {
        userId: user.id,
        previousRole,
        activeRole: targetRole,
        redirectTo: redirectMap[targetRole],
        permissions: permissions || [],
      },
    });

    // Set session cookie if not exists
    if (!request.cookies.get('session_id')) {
      response.cookies.set('session_id', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 60, // 30 minutes
      });
    }

    return response;
  } catch (error) {
    console.error('Switch role API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}



