/**
 * Admin API: Verify or reject builder
 * POST /api/admin/verify-builder
 * Body: { builder_id, action: 'verify'|'reject', rejection_reason? }
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function handler(event, context) {
  // CORS headers
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
    // Get auth token from header
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Missing or invalid authorization header' }),
      };
    }

    const token = authHeader.replace('Bearer ', '');

    // Create Supabase client with user token
    const supabase = createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unauthorized' }),
      };
    }

    // Check if user is admin
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin');

    if (rolesError || !roles || roles.length === 0) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Admin access required' }),
      };
    }

    // Parse request body
    const { builder_id, action, rejection_reason } = JSON.parse(event.body || '{}');

    if (!builder_id || !action) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields: builder_id, action' }),
      };
    }

    if (!['verify', 'reject'].includes(action)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid action. Must be "verify" or "reject"' }),
      };
    }

    if (action === 'reject' && !rejection_reason) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Rejection reason is required when rejecting' }),
      };
    }

    // Use service role client for admin operations
    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

    // Prepare update data
    const updateData = {
      verification_status: action === 'verify' ? 'verified' : 'rejected',
      updated_at: new Date().toISOString(),
    };

    if (action === 'verify') {
      updateData.verified_at = new Date().toISOString();
      updateData.rejection_reason = null;
    } else {
      updateData.rejection_reason = rejection_reason;
      updateData.verified_at = null;
    }

    // Update builder profile
    const { data: updatedBuilder, error: updateError } = await adminSupabase
      .from('builder_profiles')
      .update(updateData)
      .eq('id', builder_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating builder:', updateError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to update builder' }),
      };
    }

    // If verifying, update user_roles verified flag
    if (action === 'verify') {
      await adminSupabase
        .from('user_roles')
        .update({ verified: true })
        .eq('user_id', updatedBuilder.user_id)
        .eq('role', 'builder');
    }

    // Send email notification (Phase 5)
    try {
      const { data: userData } = await adminSupabase
        .from('auth.users')
        .select('email')
        .eq('id', updatedBuilder.user_id)
        .single();

      if (userData?.email) {
        await fetch(`${process.env.URL || 'http://localhost:8888'}/api/send-verification-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: userData.email,
            status: action === 'verify' ? 'verified' : 'rejected',
            company_name: updatedBuilder.company_name,
            rejection_reason: rejection_reason,
          }),
        });
      }
    } catch (emailError) {
      console.error('Email notification error:', emailError);
      // Don't fail the request if email fails
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        builder: updatedBuilder,
        message: action === 'verify'
          ? 'Builder verified successfully'
          : 'Builder rejected',
      }),
    };
  } catch (error) {
    console.error('Admin verify builder error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}
