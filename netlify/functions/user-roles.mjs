/**
 * Get user roles and profile information
 * GET /api/user/roles
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

export async function handler(event, context) {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'GET') {
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
        body: JSON.stringify({ error: 'Unauthorized' }),
      };
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid token' }),
      };
    }

    // Get user roles
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role, is_primary, verified')
      .eq('user_id', user.id);

    if (rolesError) {
      console.error('Error fetching roles:', rolesError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to fetch roles' }),
      };
    }

    // Get builder profile if has builder role
    let builderProfile = null;
    const hasBuilderRole = roles.some(r => r.role === 'builder');
    if (hasBuilderRole) {
      const { data: builder } = await supabase
        .from('builder_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      builderProfile = builder;
    }

    // Get buyer profile if has buyer role
    let buyerProfile = null;
    const hasBuyerRole = roles.some(r => r.role === 'buyer');
    if (hasBuyerRole) {
      const { data: buyer } = await supabase
        .from('buyer_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      buyerProfile = buyer;
    }

    // Determine primary role
    const primaryRole = roles.find(r => r.is_primary)?.role || roles[0]?.role || null;

    // Build response
    const response = {
      roles: roles.map(r => r.role),
      primary_role: primaryRole,
      role_details: roles,
      builder_profile: builderProfile,
      buyer_profile: buyerProfile,
      has_builder_role: hasBuilderRole,
      has_buyer_role: hasBuyerRole,
      builder_verified: builderProfile?.verification_status === 'verified',
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response),
    };

  } catch (error) {
    console.error('Error in user-roles function:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}
