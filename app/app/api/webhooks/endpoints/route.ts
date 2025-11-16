// =============================================
// WEBHOOK ENDPOINTS MANAGEMENT API
// CRUD operations for custom webhook endpoints
// =============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Get all webhook endpoints for authenticated builder
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get builder's webhook endpoints (RLS will filter by builder_id)
    const { data: endpoints, error } = await supabase
      .from('webhook_endpoints')
      .select('*')
      .eq('builder_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching webhook endpoints:', error);
      throw error;
    }

    // Add full URLs to each endpoint
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                    'http://localhost:3000';

    const endpointsWithUrls = endpoints.map(endpoint => ({
      ...endpoint,
      full_url: `${baseUrl}${endpoint.url}`,
      // Don't expose webhook_secret in GET response
      webhook_secret: undefined,
    }));

    return NextResponse.json(endpointsWithUrls);

  } catch (error: any) {
    console.error('Error fetching webhook endpoints:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Create new webhook endpoint
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      description,
      url_slug, // Optional custom slug, otherwise auto-generated
      allowed_events,
      event_mapping,
      require_signature,
      signature_header,
      signature_algorithm,
      allowed_ips,
      rate_limit_requests,
      rate_limit_window,
      is_active,
    } = body;

    // Validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'name is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    if (name.length > 255) {
      return NextResponse.json(
        { error: 'name must be 255 characters or less' },
        { status: 400 }
      );
    }

    // Generate webhook secret
    const webhookSecret = crypto.randomBytes(32).toString('hex');

    // Generate URL
    // If url_slug provided, use it; otherwise generate random slug
    let urlSlug: string;
    if (url_slug && typeof url_slug === 'string' && url_slug.trim().length > 0) {
      // Validate slug format (alphanumeric, hyphens, underscores only)
      const slugRegex = /^[a-zA-Z0-9_-]+$/;
      if (!slugRegex.test(url_slug)) {
        return NextResponse.json(
          { error: 'url_slug must contain only alphanumeric characters, hyphens, and underscores' },
          { status: 400 }
        );
      }
      urlSlug = url_slug.trim();
    } else {
      // Generate random slug
      urlSlug = crypto.randomBytes(16).toString('hex');
    }

    const url = `/api/webhooks/custom/${user.id}/${urlSlug}`;

    // Check if URL already exists for this builder
    const { data: existing } = await supabase
      .from('webhook_endpoints')
      .select('id')
      .eq('builder_id', user.id)
      .eq('url', url)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'A webhook endpoint with this URL already exists' },
        { status: 409 }
      );
    }

    // Validate arrays
    if (allowed_events && !Array.isArray(allowed_events)) {
      return NextResponse.json(
        { error: 'allowed_events must be an array' },
        { status: 400 }
      );
    }

    if (allowed_ips && !Array.isArray(allowed_ips)) {
      return NextResponse.json(
        { error: 'allowed_ips must be an array' },
        { status: 400 }
      );
    }

    // Validate signature algorithm
    const validAlgorithms = ['sha256', 'sha512', 'hmac-sha256'];
    const algorithm = signature_algorithm || 'hmac-sha256';
    if (!validAlgorithms.includes(algorithm)) {
      return NextResponse.json(
        { error: `signature_algorithm must be one of: ${validAlgorithms.join(', ')}` },
        { status: 400 }
      );
    }

    // Create endpoint
    const { data: endpoint, error } = await supabase
      .from('webhook_endpoints')
      .insert({
        builder_id: user.id,
        name: name.trim(),
        description: description?.trim() || null,
        url,
        webhook_secret: webhookSecret,
        allowed_events: allowed_events || [],
        event_mapping: event_mapping || {},
        require_signature: require_signature !== undefined ? require_signature : true,
        signature_header: signature_header || 'x-webhook-signature',
        signature_algorithm: algorithm,
        allowed_ips: allowed_ips || [],
        rate_limit_requests: rate_limit_requests || 1000,
        rate_limit_window: rate_limit_window || 3600,
        is_active: is_active !== undefined ? is_active : true,
        is_paused: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating webhook endpoint:', error);
      throw error;
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                    'http://localhost:3000';

    return NextResponse.json({
      ...endpoint,
      full_url: `${baseUrl}${url}`,
      // Include webhook_secret only on creation
      webhook_secret: webhookSecret,
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating webhook endpoint:', error);
    
    // Handle unique constraint violation
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'A webhook endpoint with this URL already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Update webhook endpoint
 */
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Webhook endpoint ID required' },
        { status: 400 }
      );
    }

    // Verify endpoint belongs to user
    const { data: existing, error: fetchError } = await supabase
      .from('webhook_endpoints')
      .select('id, builder_id')
      .eq('id', id)
      .eq('builder_id', user.id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: 'Webhook endpoint not found or access denied' },
        { status: 404 }
      );
    }

    // Remove fields that shouldn't be updated directly
    const restrictedFields = [
      'webhook_secret',
      'url',
      'builder_id',
      'total_requests',
      'successful_requests',
      'failed_requests',
      'last_request_at',
      'created_at',
      'id',
    ];

    const cleanedUpdates: any = {};
    for (const [key, value] of Object.entries(updates)) {
      if (!restrictedFields.includes(key)) {
        cleanedUpdates[key] = value;
      }
    }

    // Validate name if provided
    if (cleanedUpdates.name !== undefined) {
      if (typeof cleanedUpdates.name !== 'string' || cleanedUpdates.name.trim().length === 0) {
        return NextResponse.json(
          { error: 'name must be a non-empty string' },
          { status: 400 }
        );
      }
      if (cleanedUpdates.name.length > 255) {
        return NextResponse.json(
          { error: 'name must be 255 characters or less' },
          { status: 400 }
        );
      }
      cleanedUpdates.name = cleanedUpdates.name.trim();
    }

    // Validate description if provided
    if (cleanedUpdates.description !== undefined) {
      cleanedUpdates.description = cleanedUpdates.description?.trim() || null;
    }

    // Validate arrays
    if (cleanedUpdates.allowed_events !== undefined && !Array.isArray(cleanedUpdates.allowed_events)) {
      return NextResponse.json(
        { error: 'allowed_events must be an array' },
        { status: 400 }
      );
    }

    if (cleanedUpdates.allowed_ips !== undefined && !Array.isArray(cleanedUpdates.allowed_ips)) {
      return NextResponse.json(
        { error: 'allowed_ips must be an array' },
        { status: 400 }
      );
    }

    // Validate signature algorithm if provided
    if (cleanedUpdates.signature_algorithm !== undefined) {
      const validAlgorithms = ['sha256', 'sha512', 'hmac-sha256'];
      if (!validAlgorithms.includes(cleanedUpdates.signature_algorithm)) {
        return NextResponse.json(
          { error: `signature_algorithm must be one of: ${validAlgorithms.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // Update endpoint
    const { data: endpoint, error } = await supabase
      .from('webhook_endpoints')
      .update(cleanedUpdates)
      .eq('id', id)
      .eq('builder_id', user.id) // Ensure user owns the endpoint
      .select()
      .single();

    if (error) {
      console.error('Error updating webhook endpoint:', error);
      throw error;
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                    'http://localhost:3000';

    return NextResponse.json({
      ...endpoint,
      full_url: `${baseUrl}${endpoint.url}`,
      // Don't expose webhook_secret in update response
      webhook_secret: undefined,
    });

  } catch (error: any) {
    console.error('Error updating webhook endpoint:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Delete webhook endpoint
 */
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Webhook endpoint ID required' },
        { status: 400 }
      );
    }

    // Verify endpoint belongs to user before deleting
    const { data: existing, error: fetchError } = await supabase
      .from('webhook_endpoints')
      .select('id, builder_id')
      .eq('id', id)
      .eq('builder_id', user.id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: 'Webhook endpoint not found or access denied' },
        { status: 404 }
      );
    }

    // Delete endpoint
    const { error } = await supabase
      .from('webhook_endpoints')
      .delete()
      .eq('id', id)
      .eq('builder_id', user.id); // Ensure user owns the endpoint

    if (error) {
      console.error('Error deleting webhook endpoint:', error);
      throw error;
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Error deleting webhook endpoint:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}






