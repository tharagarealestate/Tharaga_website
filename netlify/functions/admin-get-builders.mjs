/**
 * Admin API: Get all builders for verification
 * GET /api/admin/builders
 * Query params: ?status=pending|verified|rejected (optional)
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Service role for admin operations

export async function handler(event, context) {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
  };

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

    // Get status filter from query params
    const status = event.queryStringParameters?.status;

    // Use service role client for admin operations
    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

    // Build query
    let query = adminSupabase
      .from('builder_profiles')
      .select(`
        *,
        user:user_id (
          id,
          email,
          user_metadata
        )
      `)
      .order('created_at', { ascending: false });

    if (status && ['pending', 'verified', 'rejected'].includes(status)) {
      query = query.eq('verification_status', status);
    }

    const { data: builders, error: buildersError } = await query;

    if (buildersError) {
      console.error('Error fetching builders:', buildersError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to fetch builders' }),
      };
    }

    // Transform data for frontend
    const buildersData = builders.map(builder => ({
      id: builder.id,
      user_id: builder.user_id,
      email: builder.user?.email || 'N/A',
      user_name: builder.user?.user_metadata?.full_name || builder.user?.user_metadata?.name || 'N/A',
      company_name: builder.company_name,
      gstin: builder.gstin,
      rera_number: builder.rera_number,
      verification_status: builder.verification_status,
      verification_documents: builder.verification_documents,
      rejection_reason: builder.rejection_reason,
      verified_at: builder.verified_at,
      created_at: builder.created_at,
      updated_at: builder.updated_at,
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        builders: buildersData,
        total: buildersData.length,
      }),
    };
  } catch (error) {
    console.error('Admin get builders error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}
