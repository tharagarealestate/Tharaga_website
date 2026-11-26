// =============================================
// GOOGLE CALENDAR STATUS
// Get calendar connection status
// =============================================
import { NextRequest, NextResponse } from 'next/server';
import { requireBuilder, createErrorResponse } from '@/lib/auth/api-auth-helper';
import { googleCalendarClient } from '@/lib/integrations/calendar/googleCalendar';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // =============================================
    // ENHANCED AUTHENTICATION
    // =============================================
    const { user, builder, error: authError } = await requireBuilder(request);
    
    if (authError) {
      const statusCode = authError.type === 'NOT_BUILDER' ? 403 : 
                        authError.type === 'CONFIG_ERROR' ? 500 : 401;
      return createErrorResponse(authError as any, statusCode);
    }

    // =============================================
    // GET CONNECTION STATUS
    // =============================================
    const status = await googleCalendarClient.getConnectionStatus(user!.id);

    return NextResponse.json({
      success: true,
      ...status,
    });
  } catch (error: any) {
    console.error('Error getting calendar status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get calendar status' },
      { status: 500 }
    );
  }
}

