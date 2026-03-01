// =============================================
// GOOGLE CALENDAR CLIENT - PRODUCTION READY
// OAuth, event CRUD, availability checking
// =============================================
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { createClient } from '@/lib/supabase/server';

// =============================================
// TYPES
// =============================================
export interface CalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: string;
  }>;
  conferenceData?: any;
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{
      method: string;
      minutes: number;
    }>;
  };
}

export interface AvailabilitySlot {
  start: Date;
  end: Date;
  available: boolean;
}

// =============================================
// GOOGLE CALENDAR CLIENT CLASS
// =============================================
export class GoogleCalendarClient {
  private oauth2Client: OAuth2Client;
  private calendar: any;

  constructor() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error('Google Calendar API credentials not configured');
    }

    this.oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );

    this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
  }

  /**
   * Get Supabase client (lazy initialization)
   */
  private getSupabaseClient() {
    return createClient();
  }

  /**
   * Get OAuth authorization URL
   */
  getAuthUrl(builder_id: string): string {
    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: builder_id, // Pass builder_id in state
      prompt: 'consent', // Force consent to get refresh token
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code: string): Promise<{
    access_token: string;
    refresh_token: string;
    expiry_date: number;
  }> {
    const { tokens } = await this.oauth2Client.getToken(code);

    if (!tokens.access_token || !tokens.refresh_token || !tokens.expiry_date) {
      throw new Error('Failed to get tokens from Google');
    }

    return {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date,
    };
  }

  /**
   * Save calendar connection to database
   */
  async saveConnection(params: {
    builder_id: string;
    access_token: string;
    refresh_token: string;
    expiry_date: number;
  }): Promise<void> {
    const expiry = new Date(params.expiry_date);

    // Set credentials for API calls
    this.oauth2Client.setCredentials({
      access_token: params.access_token,
      refresh_token: params.refresh_token,
    });

    // Try to get calendar info, but don't fail if it doesn't work
    let calendarName: string | undefined;
    let timezone: string = 'Asia/Kolkata';

    try {
      const calendarInfo = await this.calendar.calendars.get({
        calendarId: 'primary',
      });
      calendarName = calendarInfo.data.summary;
      timezone = calendarInfo.data.timeZone || 'Asia/Kolkata';
    } catch (error: any) {
      console.warn('Failed to fetch calendar info, using defaults:', error.message);
      // Continue with default values
    }

    // Save to database
    const supabase = this.getSupabaseClient();
    const { error } = await supabase
      .from('calendar_connections')
      .upsert({
        builder_id: params.builder_id,
        access_token: params.access_token,
        refresh_token: params.refresh_token,
        token_expiry: expiry.toISOString(),
        calendar_id: 'primary',
        calendar_name: calendarName,
        timezone: timezone,
        is_active: true,
      }, {
        onConflict: 'builder_id,calendar_id',
      });

    if (error) {
      console.error('Error saving calendar connection:', error);
      throw new Error(`Failed to save calendar connection: ${error.message}`);
    }
  }

  /**
   * Load and refresh credentials for a builder
   */
  private async loadCredentials(builder_id: string): Promise<boolean> {
    const supabase = this.getSupabaseClient();
    const { data: connection, error } = await supabase
      .from('calendar_connections')
      .select('*')
      .eq('builder_id', builder_id)
      .eq('is_active', true)
      .single();

    if (error || !connection) {
      return false;
    }

    // Set credentials
    this.oauth2Client.setCredentials({
      access_token: connection.access_token,
      refresh_token: connection.refresh_token,
      expiry_date: new Date(connection.token_expiry).getTime(),
    });

    // Check if token needs refresh
    const now = Date.now();
    const expiry = new Date(connection.token_expiry).getTime();

    if (expiry - now < 300000) {
      // Less than 5 minutes
      await this.refreshAccessToken(builder_id, connection.refresh_token);
    }

    return true;
  }

  /**
   * Refresh access token
   */
  private async refreshAccessToken(
    builder_id: string,
    refresh_token: string
  ): Promise<void> {
    this.oauth2Client.setCredentials({
      refresh_token,
    });

    const { credentials } = await this.oauth2Client.refreshAccessToken();

    if (!credentials.access_token || !credentials.expiry_date) {
      throw new Error('Failed to refresh access token');
    }

    // Update in database
    const supabase = this.getSupabaseClient();
    const { error } = await supabase
      .from('calendar_connections')
      .update({
        access_token: credentials.access_token,
        token_expiry: new Date(credentials.expiry_date).toISOString(),
      })
      .eq('builder_id', builder_id);

    if (error) {
      console.error('Error updating access token:', error);
      throw new Error('Failed to update access token in database');
    }

    // Update credentials in memory
    this.oauth2Client.setCredentials({
      access_token: credentials.access_token,
      refresh_token: refresh_token,
      expiry_date: credentials.expiry_date,
    });
  }

  /**
   * Create calendar event
   */
  async createEvent(
    builder_id: string,
    event: CalendarEvent
  ): Promise<{ success: boolean; event_id?: string; error?: string }> {
    try {
      // Load credentials
      const loaded = await this.loadCredentials(builder_id);
      if (!loaded) {
        return { success: false, error: 'Calendar not connected' };
      }

      // Create event in Google Calendar
      const response = await this.calendar.events.insert({
        calendarId: 'primary',
        conferenceDataVersion: 1, // Enable Google Meet
        requestBody: event,
      });

      // Save to database
      await this.saveEventToDatabase(builder_id, response.data);

      return {
        success: true,
        event_id: response.data.id,
      };
    } catch (error: any) {
      console.error('Error creating calendar event:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Update calendar event
   */
  async updateEvent(
    builder_id: string,
    event_id: string,
    updates: Partial<CalendarEvent>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const loaded = await this.loadCredentials(builder_id);
      if (!loaded) {
        return { success: false, error: 'Calendar not connected' };
      }

      await this.calendar.events.patch({
        calendarId: 'primary',
        eventId: event_id,
        requestBody: updates,
      });

      // Update in database
      await this.updateEventInDatabase(event_id, updates);

      return { success: true };
    } catch (error: any) {
      console.error('Error updating calendar event:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete calendar event
   */
  async deleteEvent(
    builder_id: string,
    event_id: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const loaded = await this.loadCredentials(builder_id);
      if (!loaded) {
        return { success: false, error: 'Calendar not connected' };
      }

      await this.calendar.events.delete({
        calendarId: 'primary',
        eventId: event_id,
      });

      // Mark as deleted in database
      const supabase = this.getSupabaseClient();
      await supabase
        .from('calendar_events')
        .update({ status: 'cancelled' })
        .eq('google_event_id', event_id);

      return { success: true };
    } catch (error: any) {
      console.error('Error deleting calendar event:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get free/busy information
   */
  async getFreeBusy(params: {
    builder_id: string;
    start: Date;
    end: Date;
  }): Promise<AvailabilitySlot[]> {
    try {
      const loaded = await this.loadCredentials(params.builder_id);
      if (!loaded) {
        return [];
      }

      const response = await this.calendar.freebusy.query({
        requestBody: {
          timeMin: params.start.toISOString(),
          timeMax: params.end.toISOString(),
          items: [{ id: 'primary' }],
        },
      });

      const busySlots = response.data.calendars?.primary?.busy || [];

      const slots: AvailabilitySlot[] = [];

      // Convert busy slots to availability slots
      let currentTime = params.start;
      for (const busy of busySlots) {
        const busyStart = new Date(busy.start);
        const busyEnd = new Date(busy.end);

        // Add available slot before busy period
        if (currentTime < busyStart) {
          slots.push({
            start: currentTime,
            end: busyStart,
            available: true,
          });
        }

        // Add busy slot
        slots.push({
          start: busyStart,
          end: busyEnd,
          available: false,
        });

        currentTime = busyEnd;
      }

      // Add final available slot if exists
      if (currentTime < params.end) {
        slots.push({
          start: currentTime,
          end: params.end,
          available: true,
        });
      }

      return slots;
    } catch (error) {
      console.error('Error getting free/busy:', error);
      return [];
    }
  }

  /**
   * List events for a date range
   */
  async listEvents(params: {
    builder_id: string;
    start: Date;
    end: Date;
  }): Promise<any[]> {
    try {
      const loaded = await this.loadCredentials(params.builder_id);
      if (!loaded) {
        return [];
      }

      const response = await this.calendar.events.list({
        calendarId: 'primary',
        timeMin: params.start.toISOString(),
        timeMax: params.end.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
      });

      return response.data.items || [];
    } catch (error) {
      console.error('Error listing events:', error);
      return [];
    }
  }

  /**
   * Sync events from Google Calendar to database
   */
  async syncEvents(builder_id: string): Promise<{
    synced: number;
    errors: number;
  }> {
    try {
      const loaded = await this.loadCredentials(builder_id);
      if (!loaded) {
        return { synced: 0, errors: 1 };
      }

      // Get sync token for incremental sync
      const supabase = this.getSupabaseClient();
      const { data: connection } = await supabase
        .from('calendar_connections')
        .select('sync_token, total_events_synced')
        .eq('builder_id', builder_id)
        .single();

      const requestParams: any = {
        calendarId: 'primary',
        maxResults: 250,
      };

      if (connection?.sync_token) {
        requestParams.syncToken = connection.sync_token;
      } else {
        // Full sync - last 90 days
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        requestParams.timeMin = ninetyDaysAgo.toISOString();
      }

      const response = await this.calendar.events.list(requestParams);

      let synced = 0;
      let errors = 0;

      // Save events to database
      for (const event of response.data.items || []) {
        try {
          await this.saveEventToDatabase(builder_id, event);
          synced++;
        } catch (error) {
          console.error('Error saving event:', error);
          errors++;
        }
      }

      // Save new sync token
      if (response.data.nextSyncToken) {
        await supabase
          .from('calendar_connections')
          .update({
            sync_token: response.data.nextSyncToken,
            last_sync_at: new Date().toISOString(),
            total_events_synced: (connection?.total_events_synced || 0) + synced,
          })
          .eq('builder_id', builder_id);
      }

      return { synced, errors };
    } catch (error: any) {
      console.error('Error syncing events:', error);
      return { synced: 0, errors: 1 };
    }
  }

  /**
   * Save event to database
   */
  private async saveEventToDatabase(builder_id: string, event: any): Promise<void> {
    const eventData: any = {
      builder_id,
      google_event_id: event.id,
      google_calendar_id: 'primary',
      title: event.summary || 'Untitled Event',
      description: event.description,
      location: event.location,
      start_time: event.start.dateTime || event.start.date,
      end_time: event.end.dateTime || event.end.date,
      timezone: event.start.timeZone || 'Asia/Kolkata',
      is_all_day: !!event.start.date,
      status: event.status === 'cancelled' ? 'cancelled' : 'confirmed',
      attendees: event.attendees || [],
      meet_link: event.hangoutLink || event.conferenceData?.entryPoints?.[0]?.uri,
      reminders: event.reminders,
      is_synced: true,
      last_synced_at: new Date().toISOString(),
    };

    const supabase = this.getSupabaseClient();
    const { error } = await supabase
      .from('calendar_events')
      .upsert(eventData, {
        onConflict: 'google_event_id,google_calendar_id',
      });

    if (error) {
      console.error('Error saving event to database:', error);
      throw new Error(`Failed to save event: ${error.message}`);
    }
  }

  /**
   * Update event in database
   */
  private async updateEventInDatabase(
    event_id: string,
    updates: Partial<CalendarEvent>
  ): Promise<void> {
    const dbUpdates: any = {};
    if (updates.summary) dbUpdates.title = updates.summary;
    if (updates.description) dbUpdates.description = updates.description;
    if (updates.location) dbUpdates.location = updates.location;
    if (updates.start) dbUpdates.start_time = updates.start.dateTime;
    if (updates.end) dbUpdates.end_time = updates.end.dateTime;

    const supabase = this.getSupabaseClient();
    const { error } = await supabase
      .from('calendar_events')
      .update(dbUpdates)
      .eq('google_event_id', event_id);

    if (error) {
      console.error('Error updating event in database:', error);
      throw new Error(`Failed to update event: ${error.message}`);
    }
  }

  /**
   * Create site visit event
   */
  async createSiteVisitEvent(params: {
    builder_id: string;
    lead_name: string;
    lead_email: string;
    lead_phone: string;
    property_title: string;
    property_address: string;
    visit_datetime: Date;
    duration_minutes: number;
  }): Promise<{ success: boolean; event_id?: string; meet_link?: string; error?: string }> {
    const endTime = new Date(params.visit_datetime);
    endTime.setMinutes(endTime.getMinutes() + params.duration_minutes);

    const event: CalendarEvent = {
      summary: `Site Visit: ${params.property_title}`,
      description: `Site visit scheduled with ${params.lead_name}\n\nPhone: ${params.lead_phone}\nEmail: ${params.lead_email}\n\nProperty: ${params.property_title}\nAddress: ${params.property_address}`,
      location: params.property_address,
      start: {
        dateTime: params.visit_datetime.toISOString(),
        timeZone: 'Asia/Kolkata',
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: 'Asia/Kolkata',
      },
      attendees: [
        {
          email: params.lead_email,
          displayName: params.lead_name,
        },
      ],
      conferenceData: {
        createRequest: {
          requestId: `site-visit-${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 1440 }, // 24 hours
          { method: 'popup', minutes: 120 }, // 2 hours
        ],
      },
    };

    const result = await this.createEvent(params.builder_id, event);

    if (result.success && result.event_id) {
      // Get the created event to extract Meet link
      const loaded = await this.loadCredentials(params.builder_id);
      if (loaded) {
        try {
          const eventDetails = await this.calendar.events.get({
            calendarId: 'primary',
            eventId: result.event_id,
          });

          return {
            success: true,
            event_id: result.event_id,
            meet_link: eventDetails.data.hangoutLink,
          };
        } catch (error) {
          console.error('Error fetching event details:', error);
          return result;
        }
      }
    }

    return result;
  }

  /**
   * Get calendar connection status
   */
  async getConnectionStatus(builder_id: string): Promise<{
    connected: boolean;
    calendar_name?: string;
    last_sync_at?: string;
    total_events_synced?: number;
  }> {
    const supabase = this.getSupabaseClient();
    const { data: connection } = await supabase
      .from('calendar_connections')
      .select('*')
      .eq('builder_id', builder_id)
      .eq('is_active', true)
      .single();

    if (!connection) {
      return { connected: false };
    }

    return {
      connected: true,
      calendar_name: connection.calendar_name,
      last_sync_at: connection.last_sync_at,
      total_events_synced: connection.total_events_synced,
    };
  }

  /**
   * Disconnect calendar
   */
  async disconnectCalendar(builder_id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = this.getSupabaseClient();
      const { error } = await supabase
        .from('calendar_connections')
        .update({ is_active: false })
        .eq('builder_id', builder_id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance (lazy-initialized to avoid build-time errors)
let googleCalendarClientInstance: GoogleCalendarClient | null = null;

export function getGoogleCalendarClient(): GoogleCalendarClient {
  if (!googleCalendarClientInstance) {
    googleCalendarClientInstance = new GoogleCalendarClient();
  }
  return googleCalendarClientInstance;
}

// For backward compatibility, export the old name
export const googleCalendarClient = {
  getAuthUrl: (...args: Parameters<GoogleCalendarClient['getAuthUrl']>) => getGoogleCalendarClient().getAuthUrl(...args),
  exchangeCodeForTokens: (...args: Parameters<GoogleCalendarClient['exchangeCodeForTokens']>) => getGoogleCalendarClient().exchangeCodeForTokens(...args),
  saveConnection: (...args: Parameters<GoogleCalendarClient['saveConnection']>) => getGoogleCalendarClient().saveConnection(...args),
  createEvent: (...args: Parameters<GoogleCalendarClient['createEvent']>) => getGoogleCalendarClient().createEvent(...args),
  updateEvent: (...args: Parameters<GoogleCalendarClient['updateEvent']>) => getGoogleCalendarClient().updateEvent(...args),
  deleteEvent: (...args: Parameters<GoogleCalendarClient['deleteEvent']>) => getGoogleCalendarClient().deleteEvent(...args),
  getFreeBusy: (...args: Parameters<GoogleCalendarClient['getFreeBusy']>) => getGoogleCalendarClient().getFreeBusy(...args),
  listEvents: (...args: Parameters<GoogleCalendarClient['listEvents']>) => getGoogleCalendarClient().listEvents(...args),
  syncEvents: (...args: Parameters<GoogleCalendarClient['syncEvents']>) => getGoogleCalendarClient().syncEvents(...args),
  createSiteVisitEvent: (...args: Parameters<GoogleCalendarClient['createSiteVisitEvent']>) => getGoogleCalendarClient().createSiteVisitEvent(...args),
  getConnectionStatus: (...args: Parameters<GoogleCalendarClient['getConnectionStatus']>) => getGoogleCalendarClient().getConnectionStatus(...args),
  disconnectCalendar: (...args: Parameters<GoogleCalendarClient['disconnectCalendar']>) => getGoogleCalendarClient().disconnectCalendar(...args),
};

