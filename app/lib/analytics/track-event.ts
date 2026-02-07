/**
 * Client-side event tracking helper
 * Tracks user events to the analytics system
 */

export interface TrackEventParams {
  eventName: string;
  eventCategory: 'page_view' | 'search' | 'property_interaction' | 'lead_action' | 'payment' | 'account';
  properties?: Record<string, any>;
  sessionId?: string;
  deviceType?: string;
  browser?: string;
  os?: string;
  city?: string;
  country?: string;
}

export async function trackEvent(params: TrackEventParams) {
  try {
    const response = await fetch('/api/analytics/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      console.warn('Failed to track event:', params.eventName);
    }
  } catch (error) {
    // Silently fail - analytics should not break the app
    console.warn('Error tracking event:', error);
  }
}

/**
 * Helper to get or create session ID
 */
export function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
}

/**
 * Helper to detect device type
 */
export function getDeviceType(): string {
  if (typeof window === 'undefined') return 'unknown';
  
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

/**
 * Helper to detect browser
 */
export function getBrowser(): string {
  if (typeof window === 'undefined') return 'unknown';
  
  const ua = navigator.userAgent;
  if (ua.includes('Chrome')) return 'chrome';
  if (ua.includes('Firefox')) return 'firefox';
  if (ua.includes('Safari')) return 'safari';
  if (ua.includes('Edge')) return 'edge';
  return 'other';
}

/**
 * Helper to detect OS
 */
export function getOS(): string {
  if (typeof window === 'undefined') return 'unknown';
  
  const ua = navigator.userAgent;
  if (ua.includes('Windows')) return 'windows';
  if (ua.includes('Mac')) return 'macos';
  if (ua.includes('Linux')) return 'linux';
  if (ua.includes('Android')) return 'android';
  if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) return 'ios';
  return 'other';
}

