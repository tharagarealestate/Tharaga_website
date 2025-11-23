// File: /app/app/api/social-media/analytics/[propertyId]/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { propertyId: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    const propertyId = params.propertyId;
    
    // Verify property belongs to builder
    const { data: property } = await supabase
      .from('properties')
      .select('builder_id')
      .eq('id', propertyId)
      .single();
    
    if (!property || property.builder_id !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Property not found or access denied' },
        { status: 403 }
      );
    }
    
    // Get social media analytics from backend
    const backendUrl = process.env.NEXT_PUBLIC_API_URL;
    const response = await fetch(`${backendUrl}/integrations/social-media/analytics/${propertyId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch social media analytics');
    }
    
    const data = await response.json();
    
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Get social media analytics error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch social media analytics' },
      { status: 500 }
    );
  }
}



