/**
 * THARAGA SUPABASE REALTIME - Live Data Layer
 *
 * Makes the platform feel alive and team-built:
 * - Live lead notifications for builders
 * - Real-time property view counters
 * - Live dashboard metric updates
 * - Instant notification system
 */

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

// --- Types ---

export interface RealtimeLead {
  id: string;
  name: string;
  email: string;
  phone: string;
  property_id: string;
  status: string;
  score?: number;
  created_at: string;
}

export interface RealtimeNotification {
  id: string;
  type: 'new_lead' | 'lead_update' | 'property_view' | 'payment' | 'rera_alert' | 'system';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  metadata?: Record<string, unknown>;
}

export interface DashboardMetrics {
  totalLeads: number;
  newLeadsToday: number;
  totalProperties: number;
  totalViews: number;
  conversionRate: number;
  revenue: number;
}

// --- Hooks ---

/**
 * Real-time lead notifications for builders.
 * New leads appear instantly without polling.
 */
export function useRealtimeLeads(builderId: string | undefined) {
  const [leads, setLeads] = useState<RealtimeLead[]>([]);
  const [newLeadCount, setNewLeadCount] = useState(0);
  const [latestLead, setLatestLead] = useState<RealtimeLead | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!builderId) return;

    const supabase = createClientComponentClient();

    // Fetch initial leads
    supabase
      .from('leads')
      .select('*')
      .eq('builder_id', builderId)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (data) setLeads(data as RealtimeLead[]);
      });

    // Subscribe to new leads in real-time
    channelRef.current = supabase
      .channel(`leads:${builderId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'leads',
          filter: `builder_id=eq.${builderId}`,
        },
        (payload: RealtimePostgresChangesPayload<RealtimeLead>) => {
          const newLead = payload.new as RealtimeLead;
          setLeads((prev) => [newLead, ...prev]);
          setNewLeadCount((prev) => prev + 1);
          setLatestLead(newLead);

          // Play notification sound
          if (typeof window !== 'undefined') {
            try {
              const audio = new Audio('/sounds/notification.mp3');
              audio.volume = 0.3;
              audio.play().catch(() => {});
            } catch {}
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'leads',
          filter: `builder_id=eq.${builderId}`,
        },
        (payload: RealtimePostgresChangesPayload<RealtimeLead>) => {
          const updated = payload.new as RealtimeLead;
          setLeads((prev) =>
            prev.map((lead) => (lead.id === updated.id ? updated : lead))
          );
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [builderId]);

  const clearNewCount = useCallback(() => setNewLeadCount(0), []);

  return { leads, newLeadCount, latestLead, clearNewCount };
}

/**
 * Real-time property view counter.
 * Shows "X people viewing right now" - creates urgency.
 */
export function useRealtimePropertyViews(propertyId: string | undefined) {
  const [viewCount, setViewCount] = useState(0);
  const [liveViewers, setLiveViewers] = useState(0);

  useEffect(() => {
    if (!propertyId) return;

    const supabase = createClientComponentClient();

    // Get total views
    supabase
      .from('property_analytics')
      .select('view_count')
      .eq('property_id', propertyId)
      .single()
      .then(({ data }) => {
        if (data) setViewCount(data.view_count || 0);
      });

    // Track presence (live viewers)
    const presenceChannel = supabase.channel(`property:${propertyId}`, {
      config: { presence: { key: propertyId } },
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const viewers = Object.keys(state).length;
        setLiveViewers(viewers);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({ online_at: new Date().toISOString() });
        }
      });

    // Listen for view count updates
    const analyticsChannel = supabase
      .channel(`analytics:${propertyId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'property_analytics',
          filter: `property_id=eq.${propertyId}`,
        },
        (payload) => {
          const updated = payload.new as { view_count?: number };
          if (updated.view_count) setViewCount(updated.view_count);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(presenceChannel);
      supabase.removeChannel(analyticsChannel);
    };
  }, [propertyId]);

  return { viewCount, liveViewers };
}

/**
 * Real-time notification system.
 * In-app notifications that update instantly.
 */
export function useRealtimeNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId) return;

    const supabase = createClientComponentClient();

    // Fetch initial notifications
    supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (data) {
          setNotifications(data as RealtimeNotification[]);
          setUnreadCount(data.filter((n: { read: boolean }) => !n.read).length);
        }
      });

    // Subscribe to new notifications
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotif = payload.new as RealtimeNotification;
          setNotifications((prev) => [newNotif, ...prev.slice(0, 19)]);
          setUnreadCount((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const markRead = useCallback(async (notifId: string) => {
    const supabase = createClientComponentClient();
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notifId);
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const markAllRead = useCallback(async () => {
    if (!userId) return;
    const supabase = createClientComponentClient();
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }, [userId]);

  return { notifications, unreadCount, markRead, markAllRead };
}

/**
 * Real-time dashboard metrics.
 * Builder dashboard numbers update live.
 */
export function useRealtimeDashboard(builderId: string | undefined) {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalLeads: 0,
    newLeadsToday: 0,
    totalProperties: 0,
    totalViews: 0,
    conversionRate: 0,
    revenue: 0,
  });
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    if (!builderId) return;

    const supabase = createClientComponentClient();

    // Fetch initial metrics
    async function fetchMetrics() {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [leadsResult, propertiesResult, todayLeadsResult] = await Promise.all([
        supabase
          .from('leads')
          .select('id, status', { count: 'exact' })
          .eq('builder_id', builderId),
        supabase
          .from('properties')
          .select('id', { count: 'exact' })
          .eq('builder_id', builderId),
        supabase
          .from('leads')
          .select('id', { count: 'exact' })
          .eq('builder_id', builderId)
          .gte('created_at', today.toISOString()),
      ]);

      const totalLeads = leadsResult.count || 0;
      const totalProperties = propertiesResult.count || 0;
      const newLeadsToday = todayLeadsResult.count || 0;

      setMetrics({
        totalLeads,
        newLeadsToday,
        totalProperties,
        totalViews: 0,
        conversionRate: totalLeads > 0 ? Math.round((newLeadsToday / totalLeads) * 100) : 0,
        revenue: 0,
      });
      setLastUpdated(new Date());
    }

    fetchMetrics();

    // Subscribe to lead changes for live metric updates
    const channel = supabase
      .channel(`dashboard:${builderId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads',
          filter: `builder_id=eq.${builderId}`,
        },
        () => {
          // Refetch metrics on any lead change
          fetchMetrics();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [builderId]);

  return { metrics, lastUpdated };
}

/**
 * Real-time platform stats for admin.
 */
export function useRealtimePlatformStats() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProperties: 0,
    totalLeads: 0,
    activeBuilders: 0,
  });

  useEffect(() => {
    const supabase = createClientComponentClient();

    async function fetchStats() {
      const [users, properties, leads] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact' }),
        supabase.from('properties').select('id', { count: 'exact' }),
        supabase.from('leads').select('id', { count: 'exact' }),
      ]);

      setStats({
        totalUsers: users.count || 0,
        totalProperties: properties.count || 0,
        totalLeads: leads.count || 0,
        activeBuilders: 0,
      });
    }

    fetchStats();

    // Live updates on key tables
    const channel = supabase
      .channel('platform_stats')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profiles' }, () => fetchStats())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'properties' }, () => fetchStats())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'leads' }, () => fetchStats())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return stats;
}
