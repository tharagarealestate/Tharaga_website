// =============================================
// SUPABASE ADMIN CLIENT
// Service role client for admin operations
// =============================================
import { createClient, SupabaseClient } from '@supabase/supabase-js';

let adminClientInstance: SupabaseClient | null = null;

/**
 * Get Supabase admin client with service role
 * This client has full access and bypasses RLS
 * Use with caution - only in trusted server-side code
 */
export function getAdminClient(): SupabaseClient {
  if (adminClientInstance) {
    return adminClientInstance;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

  if (!url || !key) {
    throw new Error(
      'Missing Supabase service role credentials. Set SUPABASE_SERVICE_ROLE_KEY in environment variables.'
    );
  }

  adminClientInstance = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return adminClientInstance;
}

/**
 * Create a user with admin access
 * This requires service role key
 */
export async function createUserWithProfile(params: {
  email: string;
  password?: string;
  email_confirm?: boolean;
  user_metadata?: {
    full_name?: string;
    phone?: string;
    user_type?: string;
    [key: string]: any;
  };
}): Promise<{ user: any; error?: string }> {
  try {
    const adminClient = getAdminClient();

    // Create user in auth.users
    const { data: authData, error: authError } =
      await adminClient.auth.admin.createUser({
        email: params.email,
        password: params.password || undefined,
        email_confirm: params.email_confirm !== false,
        user_metadata: params.user_metadata || {},
      });

    if (authError || !authData.user) {
      return {
        user: null,
        error: authError?.message || 'Failed to create user',
      };
    }

    // Create profile in profiles table
    const { error: profileError } = await adminClient
      .from('profiles')
      .upsert(
        {
          id: authData.user.id,
          email: params.email,
          full_name: params.user_metadata?.full_name || null,
          phone: params.user_metadata?.phone || null,
        },
        {
          onConflict: 'id',
        }
      );

    if (profileError) {
      console.error('Error creating profile:', profileError);
      // Continue even if profile creation fails
    }

    return {
      user: authData.user,
    };
  } catch (error: any) {
    console.error('Error creating user:', error);
    return {
      user: null,
      error: error.message || 'Failed to create user',
    };
  }
}


