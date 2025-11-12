// =============================================
// DISCONNECT GOOGLE CALENDAR
// Removes calendar connection and revokes access
// =============================================
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // =============================================
    // AUTHENTICATION
    // =============================================
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // =============================================
    // DEACTIVATE CONNECTION
    // =============================================
    // Deactivate connection (keep historical data)
    const { error: updateError } = await supabase
      .from('calendar_connections')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('builder_id', user.id);

    if (updateError) throw updateError;

    // =============================================
    // RETURN SUCCESS
    // =============================================
    return NextResponse.json({
      success: true,
      message: 'Calendar disconnected successfully',
    });
  } catch (error: any) {
    console.error('Error disconnecting calendar:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to disconnect calendar' },
      { status: 500 }
    );
  }
}

