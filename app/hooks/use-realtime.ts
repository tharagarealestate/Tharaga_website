'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { realtimeManager } from '@/lib/realtime/subscription-manager';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

/**
 * Hook for subscribing to table changes
 */
export function useRealtimeTable<T extends Record<string, any>>(
  table: string,
  options: {
    filter?: string;
    userId?: string;
    enabled?: boolean;
  } = {}
) {
  const { filter, userId, enabled = true } = options;
  const [data, setData] = useState<T[]>([]);
  const [lastChange, setLastChange] = useState<{
    type: 'INSERT' | 'UPDATE' | 'DELETE';
    record: T;
  } | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const unsubscribe = realtimeManager.subscribeToTable<T>(
      table,
      {
        filter,
        onInsert: (payload) => {
          const newRecord = payload.new as T;
          setData((prev) => [newRecord, ...prev]);
          setLastChange({ type: 'INSERT', record: newRecord });
        },
        onUpdate: (payload) => {
          const updatedRecord = payload.new as T;
          setData((prev) =>
            prev.map((item) =>
              (item as any).id === (updatedRecord as any).id ? updatedRecord : item
            )
          );
          setLastChange({ type: 'UPDATE', record: updatedRecord });
        },
        onDelete: (payload) => {
          const deletedRecord = payload.old as T;
          setData((prev) =>
            prev.filter((item) => (item as any).id !== (deletedRecord as any).id)
          );
          setLastChange({ type: 'DELETE', record: deletedRecord });
        },
      },
      userId
    );

    return unsubscribe;
  }, [table, filter, userId, enabled]);

  return { data, setData, lastChange };
}

/**
 * Hook for presence (online users)
 */
export function usePresence(
  channelName: string,
  userId: string,
  userInfo: Record<string, any>
) {
  const [onlineUsers, setOnlineUsers] = useState<Record<string, any>>({});
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const unsubscribe = realtimeManager.subscribeToPresence(
      channelName,
      userId,
      userInfo,
      {
        onSync: (state) => {
          setOnlineUsers(state);
          setIsConnected(true);
        },
        onJoin: ({ key, newPresences }) => {
          setOnlineUsers((prev) => ({
            ...prev,
            [key]: newPresences,
          }));
        },
        onLeave: ({ key }) => {
          setOnlineUsers((prev) => {
            const next = { ...prev };
            delete next[key];
            return next;
          });
        },
      }
    );

    return () => {
      unsubscribe();
      setIsConnected(false);
    };
  }, [channelName, userId]);

  const updateStatus = useCallback(
    async (status: Record<string, any>) => {
      await realtimeManager.updatePresence(channelName, {
        ...userInfo,
        ...status,
      });
    },
    [channelName, userInfo]
  );

  return { onlineUsers, isConnected, updateStatus };
}

/**
 * Hook for typing indicators
 */
export function useTypingIndicator(
  channelName: string,
  userId: string,
  userName: string
) {
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map());
  const typingTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    const unsubscribe = realtimeManager.subscribeToBroadcast(
      channelName,
      'typing',
      (payload: { userId: string; userName: string; isTyping: boolean }) => {
        if (payload.userId === userId) return; // Ignore own typing

        setTypingUsers((prev) => {
          const next = new Map(prev);

          // Clear existing timeout
          const existingTimeout = typingTimeoutRef.current.get(payload.userId);
          if (existingTimeout) {
            clearTimeout(existingTimeout);
          }

          if (payload.isTyping) {
            next.set(payload.userId, payload.userName);

            // Auto-clear after 3 seconds
            const timeout = setTimeout(() => {
              setTypingUsers((p) => {
                const n = new Map(p);
                n.delete(payload.userId);
                return n;
              });
            }, 3000);

            typingTimeoutRef.current.set(payload.userId, timeout);
          } else {
            next.delete(payload.userId);
          }

          return next;
        });
      }
    );

    return () => {
      unsubscribe();
      // Clear all timeouts
      for (const timeout of typingTimeoutRef.current.values()) {
        clearTimeout(timeout);
      }
    };
  }, [channelName, userId]);

  const sendTyping = useCallback(
    async (isTyping: boolean) => {
      await realtimeManager.broadcast(channelName, 'typing', {
        userId,
        userName,
        isTyping,
      });
    },
    [channelName, userId, userName]
  );

  return {
    typingUsers: Array.from(typingUsers.values()),
    sendTyping,
  };
}

/**
 * Hook for real-time notifications
 */
export function useRealtimeNotifications(userId: string) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const unsubscribe = realtimeManager.subscribeToTable(
      'notifications',
      {
        filter: `user_id=eq.${userId}`,
        onInsert: (payload) => {
          const notification = payload.new;
          setNotifications((prev) => [notification, ...prev]);
          if (!notification.read_at) {
            setUnreadCount((prev) => prev + 1);
          }

          // Show browser notification if permitted
          if (typeof window !== 'undefined' && Notification.permission === 'granted') {
            new Notification(notification.title, {
              body: notification.message,
              icon: '/icon-192.png',
            });
          }
        },
        onUpdate: (payload) => {
          const notification = payload.new;
          setNotifications((prev) =>
            prev.map((n) => (n.id === notification.id ? notification : n))
          );

          // Update unread count if marked as read
          if (notification.read_at && !payload.old.read_at) {
            setUnreadCount((prev) => Math.max(0, prev - 1));
          }
        },
      },
      userId
    );

    return unsubscribe;
  }, [userId]);

  return { notifications, unreadCount, setNotifications, setUnreadCount };
}

/**
 * Hook for real-time lead updates
 */
export function useRealtimeLeads(builderId: string) {
  const [leads, setLeads] = useState<any[]>([]);
  const [newLeadAlert, setNewLeadAlert] = useState<any | null>(null);

  useEffect(() => {
    const unsubscribe = realtimeManager.subscribeToTable(
      'leads',
      {
        filter: `builder_id=eq.${builderId}`,
        onInsert: (payload) => {
          const lead = payload.new;
          setLeads((prev) => [lead, ...prev]);
          setNewLeadAlert(lead);

          // Auto-clear alert after 5 seconds
          setTimeout(() => setNewLeadAlert(null), 5000);
        },
        onUpdate: (payload) => {
          const lead = payload.new;
          setLeads((prev) => prev.map((l) => (l.id === lead.id ? lead : l)));
        },
      },
      builderId
    );

    return unsubscribe;
  }, [builderId]);

  return { leads, setLeads, newLeadAlert };
}

/**
 * Hook for real-time messages in a conversation
 */
export function useRealtimeMessages(conversationId: string) {
  const [messages, setMessages] = useState<any[]>([]);
  const [latestMessage, setLatestMessage] = useState<any | null>(null);

  useEffect(() => {
    const unsubscribe = realtimeManager.subscribeToTable(
      'messages',
      {
        filter: `conversation_id=eq.${conversationId}`,
        onInsert: (payload) => {
          const message = payload.new;
          setMessages((prev) => [...prev, message]);
          setLatestMessage(message);
        },
        onUpdate: (payload) => {
          const message = payload.new;
          setMessages((prev) =>
            prev.map((m) => (m.id === message.id ? message : m))
          );
        },
        onDelete: (payload) => {
          const message = payload.old;
          setMessages((prev) => prev.filter((m) => m.id !== message.id));
        },
      },
      conversationId
    );

    return unsubscribe;
  }, [conversationId]);

  return { messages, setMessages, latestMessage };
}





