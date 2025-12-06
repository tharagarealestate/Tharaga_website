// File: /app/app/api/social-media/post/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    const { property_id, social_account_id, template_id } = await request.json();
    
    if (!property_id || !social_account_id) {
      return NextResponse.json(
        { success: false, error: 'property_id and social_account_id are required' },
        { status: 400 }
      );
    }
    
    // Verify property belongs to builder
    const { data: property } = await supabase
      .from('properties')
      .select('builder_id')
      .eq('id', property_id)
      .single();
    
    if (!property || property.builder_id !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Property not found or access denied' },
        { status: 403 }
      );
    }
    
    // Trigger backend social media post
    const backendUrl = process.env.NEXT_PUBLIC_API_URL;
    const response = await fetch(`${backendUrl}/integrations/social-media/post`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        property_id,
        social_account_id,
        template_id: template_id || null
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Social media post failed');
    }
    
    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      message: 'Social media post queued successfully',
      data
    });
    
  } catch (error) {
    console.error('Social media post error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create social media post' },
      { status: 500 }
    );
  }
}








