/**
 * Switch user's active/primary role
 * POST /api/user/switch-role
 * Body: { role: "buyer" | "builder" }
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
    const { role } = body;

    if (!role || !['buyer', 'builder'].includes(role)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid role' }),
      };
    }

    // Check if user has this role
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    if (!userRoles?.some(r => r.role === role)) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: `User does not have ${role} role` }),
      };
    }

    // Update all roles to set is_primary = false
    await supabase
      .from('user_roles')
      .update({ is_primary: false })
      .eq('user_id', user.id);

    // Set the selected role as primary
    const { error: updateError } = await supabase
      .from('user_roles')
      .update({ is_primary: true })
      .eq('user_id', user.id)
      .eq('role', role);

    if (updateError) {
      console.error('Error updating primary role:', updateError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to switch role' }),
      };
    }

    // Update user metadata
    const metadata = user.user_metadata || {};
    await supabase.auth.updateUser({
      data: {
        ...metadata,
        primary_role: role,
      },
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        active_role: role,
      }),
    };

  } catch (error) {
    console.error('Error in user-switch-role function:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}
