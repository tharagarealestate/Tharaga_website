/**
 * Add a new role to user (buyer or builder)
 * POST /api/user/add-role
 * Body: { role: "buyer" | "builder", builder_data?: {...} }
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

export async function handler(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unauthorized' }),
      };
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid token' }),
      };
    }

    const body = JSON.parse(event.body || '{}');
    const { role, builder_data, buyer_data } = body;

    // Validate role
    if (!role || !['buyer', 'builder'].includes(role)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid role. Must be "buyer" or "builder"' }),
      };
    }

    // Check if user already has this role
    const { data: existingRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const hasRole = existingRoles?.some(r => r.role === role) || false;
    
    // If user already has the role, allow profile creation/update only
    if (hasRole && role === 'builder') {
      // Check if builder profile exists
      const { data: existingProfile } = await supabase
        .from('builder_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!builder_data || !builder_data.company_name) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Builder company_name is required' }),
        };
      }

      if (existingProfile) {
        // Update existing profile
        const { error: updateError } = await supabase
          .from('builder_profiles')
          .update({
            company_name: builder_data.company_name,
            gstin: builder_data.gstin || null,
            rera_number: builder_data.rera_number || null,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);

        if (updateError) {
          console.error('Error updating builder profile:', updateError);
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Failed to update builder profile' }),
          };
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            role_added: role,
            profile_updated: true,
            message: 'Builder profile updated successfully',
          }),
        };
      } else {
        // Create profile for existing role
        const { error: builderError } = await supabase
          .from('builder_profiles')
          .insert({
            user_id: user.id,
            company_name: builder_data.company_name,
            gstin: builder_data.gstin || null,
            rera_number: builder_data.rera_number || null,
            verification_status: 'pending',
          });

        if (builderError) {
          console.error('Error creating builder profile:', builderError);
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Failed to create builder profile' }),
          };
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            role_added: role,
            profile_created: true,
            message: 'Builder profile created successfully',
          }),
        };
      }
    }

    // If user already has the role for non-builder roles, return success
    if (hasRole) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          role_added: role,
          already_had_role: true,
          message: `User already has ${role} role`,
        }),
      };
    }

    // Add role to user_roles table
    const isPrimary = !existingRoles || existingRoles.length === 0;
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: user.id,
        role,
        is_primary: isPrimary,
        verified: role === 'buyer', // Buyers are auto-verified, builders need verification
      });

    if (roleError) {
      console.error('Error adding role:', roleError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to add role' }),
      };
    }

    // Create profile based on role
    if (role === 'builder') {
      if (!builder_data || !builder_data.company_name) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Builder company_name is required' }),
        };
      }

      const { error: builderError } = await supabase
        .from('builder_profiles')
        .insert({
          user_id: user.id,
          company_name: builder_data.company_name,
          gstin: builder_data.gstin || null,
          rera_number: builder_data.rera_number || null,
          verification_status: 'pending',
        });

      if (builderError) {
        console.error('Error creating builder profile:', builderError);
        // Rollback role insertion
        await supabase.from('user_roles').delete().eq('user_id', user.id).eq('role', role);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Failed to create builder profile' }),
        };
      }
    } else if (role === 'buyer') {
      const { error: buyerError } = await supabase
        .from('buyer_profiles')
        .insert({
          user_id: user.id,
          preferences: buyer_data?.preferences || {},
        });

      if (buyerError) {
        console.error('Error creating buyer profile:', buyerError);
        // Rollback role insertion
        await supabase.from('user_roles').delete().eq('user_id', user.id).eq('role', role);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Failed to create buyer profile' }),
        };
      }
    }

    // Update user metadata
    const metadata = user.user_metadata || {};
    const roles = [...(metadata.roles || [])];
    if (!roles.includes(role)) {
      roles.push(role);
    }

    await supabase.auth.updateUser({
      data: {
        ...metadata,
        roles,
        primary_role: metadata.primary_role || role,
      },
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        role_added: role,
        is_primary: isPrimary,
        verification_required: role === 'builder',
      }),
    };

  } catch (error) {
    console.error('Error in user-add-role function:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}
