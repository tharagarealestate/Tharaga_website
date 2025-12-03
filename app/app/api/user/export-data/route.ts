import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/user/export-data
 * GDPR Article 20 - Right to Data Portability
 * Exports all user data as JSON
 * Returns: profile, roles, properties, leads, documents, subscriptions
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    // Fetch all user data from various tables
    const [
      { data: profile },
      { data: userRoles },
      { data: builderProfile },
      { data: buyerProfile },
      { data: properties },
      { data: leads },
      { data: documents },
      { data: subscriptions },
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('user_roles').select('*').eq('user_id', user.id),
      supabase.from('builder_profiles').select('*').eq('user_id', user.id).single(),
      supabase.from('buyer_profiles').select('*').eq('user_id', user.id).single(),
      supabase.from('properties').select('*').eq('user_id', user.id),
      supabase.from('leads').select('*').eq('user_id', user.id).or(`builder_id.eq.${user.id},buyer_id.eq.${user.id}`),
      supabase.from('documents').select('*').eq('user_id', user.id),
      supabase.from('subscriptions').select('*').eq('user_id', user.id),
    ]);

    // Compile all user data
    const userData = {
      export_date: new Date().toISOString(),
      user_id: user.id,
      email: user.email,
      auth: {
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
        email_confirmed_at: user.email_confirmed_at,
        phone_confirmed_at: user.phone_confirmed_at,
      },
      profile: profile || null,
      roles: userRoles || [],
      builder_profile: builderProfile || null,
      buyer_profile: buyerProfile || null,
      properties: properties || [],
      leads: leads || [],
      documents: documents || [],
      subscriptions: subscriptions || [],
    };

    // Return as JSON download
    return NextResponse.json(userData, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="tharaga-user-data-${user.id}-${Date.now()}.json"`,
      },
    });
  } catch (error) {
    console.error('Export data API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

