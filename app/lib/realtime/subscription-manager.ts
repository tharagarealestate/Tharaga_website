import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { createRealtimeClient, CHANNELS } from './config';

type ChangeHandler<T> = (payload: RealtimePostgresChangesPayload<T>) => void;
type PresenceHandler = (state: Record<string, any>) => void;
type BroadcastHandler = (payload: any) => void;

interface SubscriptionOptions {
  onInsert?: ChangeHandler<any>;
  onUpdate?: ChangeHandler<any>;
  onDelete?: ChangeHandler<any>;
  onPresenceSync?: PresenceHandler;
  onPresenceJoin?: PresenceHandler;
  onPresenceLeave?: PresenceHandler;
  filter?: string;
}

export class RealtimeSubscriptionManager {
  private supabase = createRealtimeClient();
  private channels: Map<string, RealtimeChannel> = new Map();
  private presenceState: Map<string, Record<string, any>> = new Map();

  /**
   * Subscribe to database changes
   */
  subscribeToTable<T extends Record<string, any>>(
    table: string,
    options: SubscriptionOptions,
    userId?: string
  ): () => void {
    const channelName = `${table}:${userId || 'global'}`;

    // Unsubscribe from existing channel if any
    this.unsubscribe(channelName);
    const channel = this.supabase.channel(channelName);

    // Subscribe to INSERT events
    if (options.onInsert) {
      channel.on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table,
          filter: options.filter,
        },
        options.onInsert
      );
    }

    // Subscribe to UPDATE events
    if (options.onUpdate) {
      channel.on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table,
          filter: options.filter,
        },
        options.onUpdate
      );
    }

    // Subscribe to DELETE events
    if (options.onDelete) {
      channel.on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table,
          filter: options.filter,
        },
        options.onDelete
      );
    }

    // Subscribe to channel
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`Subscribed to ${channelName}`);
      }
    });

    this.channels.set(channelName, channel);

    return () => this.unsubscribe(channelName);
  }

  /**
   * Subscribe to presence (online status, typing indicators)
   */
  subscribeToPresence(
    channelName: string,
    userId: string,
    userInfo: Record<string, any>,
    options: {
      onSync?: PresenceHandler;
      onJoin?: PresenceHandler;
      onLeave?: PresenceHandler;
    }
  ): () => void {
    const channel = this.supabase.channel(channelName, {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        this.presenceState.set(channelName, state);
        options.onSync?.(state);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        options.onJoin?.({ key, newPresences });
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        options.onLeave?.({ key, leftPresences });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track(userInfo);
        }
      });

    this.channels.set(channelName, channel);

    return () => this.unsubscribe(channelName);
  }

  /**
   * Subscribe to broadcast messages
   */
  subscribeToBroadcast(
    channelName: string,
    eventName: string,
    handler: BroadcastHandler
  ): () => void {
    const channel = this.supabase.channel(channelName);
    channel
      .on('broadcast', { event: eventName }, (payload) => {
        handler(payload.payload);
      })
      .subscribe();

    this.channels.set(`${channelName}:${eventName}`, channel);

    return () => this.unsubscribe(`${channelName}:${eventName}`);
  }

  /**
   * Send broadcast message
   */
  async broadcast(channelName: string, eventName: string, payload: any): Promise<void> {
    let channel = this.channels.get(channelName);

    if (!channel) {
      channel = this.supabase.channel(channelName);
      await channel.subscribe();
      this.channels.set(channelName, channel);
    }

    await channel.send({
      type: 'broadcast',
      event: eventName,
      payload,
    });
  }

  /**
   * Update presence state
   */
  async updatePresence(channelName: string, state: Record<string, any>): Promise<void> {
    const channel = this.channels.get(channelName);
    if (channel) {
      await channel.track(state);
    }
  }

  /**
   * Get current presence state
   */
  getPresenceState(channelName: string): Record<string, any> {
    return this.presenceState.get(channelName) || {};
  }

  /**
   * Unsubscribe from channel
   */
  unsubscribe(channelName: string): void {
    const channel = this.channels.get(channelName);
    if (channel) {
      this.supabase.removeChannel(channel);
      this.channels.delete(channelName);
      this.presenceState.delete(channelName);
    }
  }

  /**
   * Unsubscribe from all channels
   */
  unsubscribeAll(): void {
    for (const channelName of this.channels.keys()) {
      this.unsubscribe(channelName);
    }
  }
}

// Export singleton
export const realtimeManager = new RealtimeSubscriptionManager();



