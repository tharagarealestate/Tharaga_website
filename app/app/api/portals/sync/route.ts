// File: /app/app/api/portals/sync/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const syncSchema = z.object({
  property_id: z.string().uuid(),
  portal_account_id: z.string().uuid(),
  sync_type: z.enum(['create', 'update', 'delete']).default('create')
});

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const validatedData = syncSchema.parse(body);
    
    // Verify property ownership
    const { data: property } = await supabase
      .from('properties')
      .select('builder_id')
      .eq('id', validatedData.property_id)
      .single();
    
    if (!property || property.builder_id !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Property not found or access denied' },
        { status: 403 }
      );
    }
    
    // Trigger backend portal sync
    const backendUrl = process.env.NEXT_PUBLIC_API_URL;
    const response = await fetch(`${backendUrl}/integrations/portals/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validatedData)
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Portal sync failed');
    }
    
    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      message: 'Portal sync queued successfully',
      data
    });
    
  } catch (error) {
    console.error('Portal sync error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to sync to portal' },
      { status: 500 }
    );
  }
}








