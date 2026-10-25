/**
 * Netlify Function: Update Admin Role
 *
 * This function updates a user's role to 'admin' in the Supabase profiles table.
 * It requires the ADMIN_TOKEN for authentication.
 *
 * Usage:
 * POST /api/update-admin-role
 * Headers:
 *   Authorization: Bearer <ADMIN_TOKEN>
 * Body:
 *   { "email": "user@example.com" }
 */

import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const adminToken = process.env.ADMIN_TOKEN!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  // Check authorization
  const authHeader = event.headers.authorization || event.headers.Authorization
  const token = authHeader?.replace('Bearer ', '')

  if (!token || token !== adminToken) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Unauthorized' })
    }
  }

  try {
    const body = JSON.parse(event.body || '{}')
    const { email } = body

    if (!email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Email is required' })
      }
    }

    // Update the profile
    const { data, error } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('email', email)
      .select()

    if (error) {
      console.error('Error updating role:', error)
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to update role', details: error.message })
      }
    }

    if (!data || data.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          error: 'Profile not found',
          message: 'No profile found with that email. The user may need to sign in first.'
        })
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Admin role updated successfully',
        profile: data[0]
      })
    }

  } catch (err) {
    console.error('Unexpected error:', err)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    }
  }
}
