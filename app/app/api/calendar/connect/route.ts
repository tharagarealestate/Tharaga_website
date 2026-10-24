// =============================================
// GOOGLE CALENDAR OAUTH - CONNECT
// Redirects user to Google consent screen
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
    
    if (!builder) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Builder profile not found',
          errorType: 'NOT_FOUND',
          message: 'Please complete your builder profile setup to connect Google Calendar.',
        },
        { status: 404 }
      );
    }

    // =============================================
    // GENERATE OAUTH URL
    // =============================================
    // Generate OAuth URL with builder_id in state
    const authUrl = googleCalendarClient.getAuthUrl(user!.id);

    // =============================================
    // RETURN RESPONSE
    // =============================================
    // Return redirect URL
    return NextResponse.json({ 
      auth_url: authUrl,
      message: 'Redirect user to this URL to connect Google Calendar'
    });
  } catch (error: any) {
    console.error('Error initiating calendar connection:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to initiate calendar connection' },
      { status: 500 }
    );
  }
}

