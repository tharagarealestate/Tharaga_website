// =============================================
// SMART LISTING DISTRIBUTION API
// POST /api/ai/distribution - Trigger distribution
// GET /api/ai/distribution?listing_id=xxx - View analytics
// =============================================
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const distributionSchema = z.object({
  listing_id: z.string().uuid(),
  force_redistribute: z.boolean().optional().default(false)
});

// POST endpoint - Trigger distribution
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Verify authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Verify user is a builder
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, id')
      .eq('id', session.user.id)
      .single();
    
    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: 'Profile not found' },
        { status: 404 }
      );
    }
    
    // Check if user has builder role
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .eq('role', 'builder');
    
    const isBuilder = profile.role === 'builder' || (userRoles && userRoles.length > 0);
    
    if (!isBuilder) {
      return NextResponse.json(
        { success: false, error: 'Only builders can trigger distribution' },
        { status: 403 }
      );
    }
    
    // Validate request body
    const body = await request.json().catch(() => ({}));
    const validatedData = distributionSchema.parse(body);
    
    // Check if listing exists and belongs to this builder
    const { data: listing, error: listingError } = await supabase
      .from('properties')
      .select('id, builder_id, listing_status, is_verified')
      .eq('id', validatedData.listing_id)
      .single();
    
    if (listingError || !listing) {
      return NextResponse.json(
        { success: false, error: 'Listing not found' },
        { status: 404 }
      );
    }
    
    // Check ownership - builder_id can be null, so allow if listing exists and user is builder
    if (listing.builder_id && listing.builder_id !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'You can only distribute your own listings' },
        { status: 403 }
      );
    }
    
    if (!listing.is_verified) {
      return NextResponse.json(
        { success: false, error: 'Listing must be verified before distribution' },
        { status: 400 }
      );
    }
    
    if (listing.listing_status !== 'active') {
      return NextResponse.json(
        { success: false, error: 'Listing must be active to distribute' },
        { status: 400 }
      );
    }
    
    // Check if already distributed (unless force)
    if (!validatedData.force_redistribute) {
      const { data: existingDistribution } = await supabase
        .from('listing_distributions')
        .select('id')
        .eq('listing_id', validatedData.listing_id)
        .limit(1)
        .maybeSingle();
      
      if (existingDistribution) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Listing already distributed. Use force_redistribute=true to resend.' 
          },
          { status: 400 }
        );
      }
    }
    
    // Call backend FastAPI service for heavy ML processing
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    
    let distributionResponse;
    try {
      distributionResponse = await fetch(
        `${backendUrl}/ai/distribution/distribute`,
        {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}` 
          },
          body: JSON.stringify({ listing_id: validatedData.listing_id })
        }
      );
      
      if (!distributionResponse.ok) {
        const errorText = await distributionResponse.text();
        throw new Error(`Distribution service failed: ${errorText}`);
      }
    } catch (error: any) {
      console.error('Distribution service error:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Distribution service unavailable',
          details: error.message 
        },
        { status: 503 }
      );
    }
    
    const distributionResults = await distributionResponse.json();
    
    // Update listing with distribution metadata
    const { data: metadata } = await supabase
      .from('properties')
      .select('metadata')
      .eq('id', validatedData.listing_id)
      .single();
    
    const updatedMetadata = {
      ...(metadata?.metadata || {}),
      last_distributed_at: new Date().toISOString(),
      total_distributions: distributionResults.total_matches || 0,
      distribution_stats: distributionResults
    };
    
    await supabase
      .from('properties')
      .update({ metadata: updatedMetadata })
      .eq('id', validatedData.listing_id);
    
    return NextResponse.json({
      success: true,
      data: {
        listing_id: validatedData.listing_id,
        total_matches: distributionResults.total_matches || 0,
        instant_sent: distributionResults.instant_sent || 0,
        daily_queued: distributionResults.daily_queued || 0,
        channels_used: distributionResults.channels_used || {}
      },
      message: `Successfully distributed to ${distributionResults.total_matches || 0} matched buyers`
    });
    
  } catch (error) {
    console.error('Distribution error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint - View distribution analytics
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { searchParams } = new URL(request.url);
    const listing_id = searchParams.get('listing_id');
    
    if (!listing_id) {
      return NextResponse.json(
        { success: false, error: 'listing_id is required' },
        { status: 400 }
      );
    }
    
    // Verify authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Verify user is a builder (can view their own listing distributions)
    const { data: listing } = await supabase
      .from('properties')
      .select('builder_id, id')
      .eq('id', listing_id)
      .single();
    
    if (!listing) {
      return NextResponse.json(
        { success: false, error: 'Listing not found' },
        { status: 404 }
      );
    }
    
    // Get distribution analytics
    const { data: distributions, error } = await supabase
      .from('listing_distributions')
      .select(`
        *,
        buyer:profiles!buyer_id(email, phone, full_name),
        listing:properties!listing_id(title, price, location)
      `)
      .eq('listing_id', listing_id)
      .order('match_score', { ascending: false });
    
    if (error) {
      console.error('Error fetching distributions:', error);
      throw error;
    }
    
    // Calculate stats
    const stats = {
      total_sent: distributions?.length || 0,
      opened: distributions?.filter(d => d.opened_at).length || 0,
      clicked: distributions?.filter(d => d.clicked_at).length || 0,
      conversions: distributions?.filter(d => d.conversion_status === 'converted').length || 0,
      avg_match_score: distributions && distributions.length > 0
        ? distributions.reduce((sum: number, d: any) => sum + parseFloat(d.match_score || 0), 0) / distributions.length
        : 0,
      channel_breakdown: distributions?.reduce((acc: Record<string, number>, d: any) => {
        const channel = d.distribution_channel;
        if (channel) {
          const channels = channel.split(',');
          channels.forEach((ch: string) => {
            acc[ch] = (acc[ch] || 0) + 1;
          });
        }
        return acc;
      }, {} as Record<string, number>)
    };
    
    return NextResponse.json({
      success: true,
      data: {
        distributions: distributions || [],
        stats
      }
    });
    
  } catch (error) {
    console.error('Get distribution analytics error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch distribution analytics' },
      { status: 500 }
    );
  }
}

