import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

// Realtime event types
export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

export interface RealtimeSubscription {
  channel: RealtimeChannel;
  unsubscribe: () => void;
}

export interface RealtimeConfig {
  schema: string;
  table: string;
  event: RealtimeEvent;
  filter?: string;
}

// Create Supabase client with realtime enabled
export function createRealtimeClient() {
  const { createClient } = require('@supabase/supabase-js');
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    }
  );
}

// Realtime channel names
export const CHANNELS = {
  LEADS: 'realtime:leads',
  MESSAGES: 'realtime:messages',
  NOTIFICATIONS: 'realtime:notifications',
  SITE_VISITS: 'realtime:site_visits',
  PROPERTIES: 'realtime:properties',
  ANALYTICS: 'realtime:analytics',
} as const;



