// File: /app/app/api/portals/analytics/[propertyId]/route.ts
import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { propertyId: string } }
) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    const propertyId = params.propertyId;
    
    // Verify property ownership
    const { data: property } = await supabase
      .from('properties')
      .select('builder_id')
      .eq('id', propertyId)
      .single();
    
    if (!property || property.builder_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Property not found or access denied' },
        { status: 403 }
      );
    }
    
    // Get portal analytics from backend
    const backendUrl = process.env.NEXT_PUBLIC_API_URL;
    const response = await fetch(`${backendUrl}/integrations/portals/analytics/${propertyId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch portal analytics');
    }
    
    const data = await response.json();
    
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Get portal analytics error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch portal analytics' },
      { status: 500 }
    );
  }
}








