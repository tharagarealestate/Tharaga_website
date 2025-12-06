/**
 * Admin API: Get dashboard statistics
 * GET /api/admin/stats
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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

    // Use service role client for admin operations
    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get total users (from auth.users)
    const { count: totalUsers, error: usersError } = await adminSupabase
      .from('user_roles')
      .select('user_id', { count: 'exact', head: true });

    // Get unique users count
    const { data: uniqueUsers, error: uniqueError } = await adminSupabase
      .from('user_roles')
      .select('user_id');

    const uniqueUserCount = uniqueUsers ? new Set(uniqueUsers.map(r => r.user_id)).size : 0;

    // Get buyers count
    const { count: buyersCount, error: buyersError } = await adminSupabase
      .from('user_roles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'buyer');

    // Get builders count
    const { count: buildersCount, error: buildersError } = await adminSupabase
      .from('user_roles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'builder');

    // Get pending verifications
    const { count: pendingCount, error: pendingError } = await adminSupabase
      .from('builder_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('verification_status', 'pending');

    // Get verified builders
    const { count: verifiedCount, error: verifiedError } = await adminSupabase
      .from('builder_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('verification_status', 'verified');

    // Get rejected builders
    const { count: rejectedCount, error: rejectedError } = await adminSupabase
      .from('builder_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('verification_status', 'rejected');

    // Get recent registrations (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { count: recentUsers, error: recentError } = await adminSupabase
      .from('user_roles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString());

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        stats: {
          total_users: uniqueUserCount || 0,
          total_buyers: buyersCount || 0,
          total_builders: buildersCount || 0,
          pending_verifications: pendingCount || 0,
          verified_builders: verifiedCount || 0,
          rejected_builders: rejectedCount || 0,
          recent_signups_7d: recentUsers || 0,
        },
      }),
    };
  } catch (error) {
    console.error('Admin stats error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}
