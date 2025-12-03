import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Request validation schema
const AddRoleSchema = z.object({
  role: z.enum(['buyer', 'builder'], {
    errorMap: () => ({ message: 'Role must be either "buyer" or "builder"' }),
  }),
  metadata: z.object({
    source: z.string().optional(),
    referralCode: z.string().optional(),
    companyName: z.string().optional(),
    gstin: z.string().optional(),
    reraNumber: z.string().optional(),
  }).optional(),
});

interface AddRoleResponse {
  success: boolean;
  data?: {
    userId: string;
    roles: string[];
    newRole: string;
    activeRole: string;
    requiresVerification: boolean;
    trialInfo?: {
      trialStartDate: string;
      trialEndDate: string;
      daysRemaining: number;
    };
  };
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<AddRoleResponse>> {
  const startTime = Date.now();
  
  try {
    // Parse and validate request body
    const body = await request.json();
    const validation = AddRoleSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { role, metadata } = validation.data;

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

    // Check if role already exists
    const { data: existingRole } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', user.id)
      .eq('role', role)
      .single();

    if (existingRole) {
      return NextResponse.json(
        { success: false, error: `You already have the ${role} role` },
        { status: 400 }
      );
    }

    // Add new role
    const { error: insertError } = await supabase
      .from('user_roles')
      .insert({
        user_id: user.id,
        role: role,
        is_primary: false,
        verified: false,
      });

    if (insertError) {
      console.error('Role insert error:', insertError);
      return NextResponse.json(
        { success: false, error: 'Failed to add role' },
        { status: 500 }
      );
    }

    // Update profile active role
    await supabase
      .from('profiles')
      .update({
        role: role,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    // Record role transition
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                      request.headers.get('x-real-ip') || 
                      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    await supabase.from('role_transitions').insert({
      user_id: user.id,
      from_role: null,
      to_role: role,
      transition_reason: 'user_added_role',
      metadata: metadata || {},
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    let trialInfo = null;
    let requiresVerification = false;

    // Handle builder-specific setup
    if (role === 'builder') {
      requiresVerification = true;
      
      // Create builder profile if not exists
      const { data: existingBuilder } = await supabase
        .from('builder_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!existingBuilder) {
        const trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + 14);
        
        const { error: builderError } = await supabase
          .from('builder_profiles')
          .insert({
            user_id: user.id,
            company_name: metadata?.companyName || '',
            gstin: metadata?.gstin || '',
            rera_number: metadata?.reraNumber || '',
            verification_status: 'pending',
          });

        if (builderError) {
          console.error('Builder profile creation error:', builderError);
        } else {
          trialInfo = {
            trialStartDate: new Date().toISOString(),
            trialEndDate: trialEndDate.toISOString(),
            daysRemaining: 14,
          };
        }
      }
    }

    // Handle buyer-specific setup
    if (role === 'buyer') {
      // Create buyer profile if not exists
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

    // Get updated roles
    const { data: updatedRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    return NextResponse.json({
      success: true,
      data: {
        userId: user.id,
        roles: updatedRoles?.map(r => r.role) || [role],
        newRole: role,
        activeRole: role,
        requiresVerification,
        trialInfo: trialInfo || undefined,
      },
    });
  } catch (error) {
    console.error('Add role API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}



