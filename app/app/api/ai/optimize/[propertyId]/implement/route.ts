// =============================================
// FEATURE 8: IMPLEMENT SUGGESTION API ROUTE
// =============================================
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { propertyId: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    const propertyId = params.propertyId;
    const body = await request.json();
    const { suggestion_id } = body;
    
    if (!suggestion_id) {
      return NextResponse.json(
        { success: false, error: 'suggestion_id is required' },
        { status: 400 }
      );
    }
    
    // Verify property belongs to builder
    const { data: property } = await supabase
      .from('properties')
      .select('builder_id')
      .eq('id', propertyId)
      .maybeSingle();
    
    if (!property || property.builder_id !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Property not found or access denied' },
        { status: 403 }
      );
    }
    
    // Call backend to implement suggestion
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || 'http://localhost:8000';
    const response = await fetch(`${backendUrl}/api/seller-optimizer/optimize/${propertyId}/implement`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ suggestion_id }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to implement suggestion: ${errorText}`);
    }
    
    const data = await response.json();
    
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Implement suggestion error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to implement suggestion' },
      { status: 500 }
    );
  }
}



