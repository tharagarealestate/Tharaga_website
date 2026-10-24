import { useCallback, useEffect, useRef } from 'react';

interface BehavioralSignal {
  buyer_id?: string;
  session_id: string;
  event_type: string;
  event_metadata?: Record<string, any>;
  property_id?: string;
  builder_id?: string;
  device_type?: string;
  browser?: string;
  location_city?: string;
  time_of_day?: string;
}

export function useBehavioralTracking(buyerId?: string) {
  const sessionIdRef = useRef<string>(crypto.randomUUID());
  const startTimeRef = useRef<Record<string, number>>({});

  // Get device type
  const getDeviceType = useCallback((): string => {
    if (typeof window === 'undefined') return 'desktop';
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }, []);

  // Get browser
  const getBrowser = useCallback((): string => {
    if (typeof window === 'undefined') return 'unknown';
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'unknown';
  }, []);

  // Track event
  const trackEvent = useCallback(async (signal: Omit<BehavioralSignal, 'session_id' | 'device_type' | 'browser'>) => {
    if (!buyerId && !signal.buyer_id) {
      console.warn('No buyer_id provided for behavioral tracking');
      return;
    }

    const now = new Date();
    const timeOfDay = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const payload: BehavioralSignal = {
      ...signal,
      buyer_id: signal.buyer_id || buyerId,
      session_id: sessionIdRef.current,
      device_type: getDeviceType(),
      browser: getBrowser(),
      time_of_day: timeOfDay,
    };

    try {
      const response = await fetch('/api/automation/behavioral-tracking/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.error('Failed to track behavioral signal:', await response.text());
      }
    } catch (error) {
      console.error('Error tracking behavioral signal:', error);
    }
  }, [buyerId, getDeviceType, getBrowser]);

  // Track page view with time spent
  const trackPageView = useCallback(async (
    pageUrl: string,
    propertyId?: string,
    metadata?: Record<string, any>
  ) => {
    const startTime = Date.now();
    const pageKey = `${pageUrl}-${propertyId || 'none'}`;
    startTimeRef.current[pageKey] = startTime;

    await trackEvent({
      event_type: propertyId ? 'property_view' : 'page_view',
      event_metadata: {
        page_url: pageUrl,
        ...metadata,
      },
      property_id: propertyId,
    });

    // Track time spent when leaving
    return () => {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      trackEvent({
        event_type: propertyId ? 'property_view' : 'page_view',
        event_metadata: {
          page_url: pageUrl,
          time_spent_seconds: timeSpent,
          ...metadata,
        },
        property_id: propertyId,
      });
      delete startTimeRef.current[pageKey];
    };
  }, [trackEvent]);

  // Track image view
  const trackImageView = useCallback(async (propertyId: string, imageIndex: number) => {
    await trackEvent({
      event_type: 'image_view',
      event_metadata: {
        image_index: imageIndex,
      },
      property_id: propertyId,
    });
  }, [trackEvent]);

  // Track image zoom
  const trackImageZoom = useCallback(async (propertyId: string) => {
    await trackEvent({
      event_type: 'image_zoom',
      property_id: propertyId,
    });
  }, [trackEvent]);

  // Track document download
  const trackDocumentDownload = useCallback(async (
    propertyId: string,
    documentType: string
  ) => {
    await trackEvent({
      event_type: 'document_download',
      event_metadata: {
        document_type: documentType,
      },
      property_id: propertyId,
    });
  }, [trackEvent]);

  // Track calculator use
  const trackCalculatorUse = useCallback(async (
    calculatorType: 'emi_calculation' | 'roi_analysis',
    propertyId?: string,
    metadata?: Record<string, any>
  ) => {
    await trackEvent({
      event_type: calculatorType,
      event_metadata: metadata,
      property_id: propertyId,
    });
  }, [trackEvent]);

  // Track contact/booking click
  const trackContactClick = useCallback(async (
    propertyId: string,
    actionType: 'contact_builder_click' | 'schedule_visit_click' | 'chat_initiated'
  ) => {
    await trackEvent({
      event_type: actionType,
      property_id: propertyId,
    });
  }, [trackEvent]);

  return {
    trackEvent,
    trackPageView,
    trackImageView,
    trackImageZoom,
    trackDocumentDownload,
    trackCalculatorUse,
    trackContactClick,
    sessionId: sessionIdRef.current,
  };
}

