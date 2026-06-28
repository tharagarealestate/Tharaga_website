// =============================================
// GOOGLE CALENDAR OAUTH - CALLBACK
// Exchanges code for tokens and saves connection
// =============================================
import { NextRequest, NextResponse } from 'next/server';
import { googleCalendarClient } from '@/lib/integrations/calendar/googleCalendar';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // This is the builder_id
    const error = searchParams.get('error');

    // =============================================
    // CHECK FOR OAUTH ERRORS
    // =============================================
    // Check for OAuth errors
    if (error) {
      console.error('OAuth error:', error);
      return NextResponse.redirect(
        new URL(`/builder/settings?calendar_error=${error}`, request.url)
      );
    }

    // =============================================
    // VALIDATE PARAMETERS
    // =============================================
    // Validate parameters
    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/builder/settings?calendar_error=missing_params', request.url)
      );
    }

    const builder_id = state;

    // =============================================
    // EXCHANGE CODE FOR TOKENS
    // =============================================
    // Exchange code for tokens
    const tokens = await googleCalendarClient.exchangeCodeForTokens(code);

    // =============================================
    // SAVE CONNECTION TO DATABASE
    // =============================================
    // Save connection to database
    await googleCalendarClient.saveConnection({
      builder_id,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date,
    });

    // =============================================
    // TRIGGER INITIAL SYNC
    // =============================================
    // Trigger initial sync
    await googleCalendarClient.syncEvents(builder_id);

    // =============================================
    // REDIRECT TO SUCCESS PAGE
    // =============================================
    // Redirect to success page
    return NextResponse.redirect(
      new URL('/builder/settings?calendar_connected=true', request.url)
    );
  } catch (error: any) {
    console.error('Error handling OAuth callback:', error);
    return NextResponse.redirect(
      new URL(
        `/builder/settings?calendar_error=${encodeURIComponent(error.message || 'unknown_error')}`,
        request.url
      )
    );
  }
}

