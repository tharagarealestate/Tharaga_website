import { createClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';

interface WebhookEndpoint {
  id: string;
  url: string;
  authType: string;
  authConfig: Record<string, any>;
  events: string[];
  headers: Record<string, string>;
  maxRetries: number;
  retryDelaySeconds: number;
}

interface WebhookEvent {
  type: string;
  id: string;
  timestamp: string;
  data: Record<string, any>;
}

export class WebhookService {
  private supabase: ReturnType<typeof createClient>;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  /**
   * Trigger webhook for an event
   */
  async triggerEvent(
    builderId: string,
    eventType: string,
    eventId: string,
    data: Record<string, any>
  ): Promise<void> {
    // Get all active endpoints subscribed to this event
    // Using existing schema: allowed_events is an array
    const { data: endpoints } = await this.supabase
      .from('webhook_endpoints')
      .select('*')
      .eq('builder_id', builderId)
      .eq('is_active', true)
      .not('is_paused', 'eq', true);
    
    // Filter by event type (check if event is in allowed_events array)
    const filteredEndpoints = (endpoints || []).filter((endpoint: any) => {
      if (!endpoint.allowed_events || endpoint.allowed_events.length === 0) return true;
      return endpoint.allowed_events.includes(eventType);
    });

    if (!endpoints || endpoints.length === 0) return;

    const event: WebhookEvent = {
      type: eventType,
      id: eventId,
      timestamp: new Date().toISOString(),
      data: this.sanitizeData(data),
    };

    // Queue deliveries for all endpoints
    for (const endpoint of filteredEndpoints) {
      await this.queueDelivery(endpoint, event);
    }
  }

  /**
   * Queue a webhook delivery
   */
  private async queueDelivery(endpoint: any, event: WebhookEvent): Promise<void> {
    // Using existing schema: webhook_id instead of endpoint_id
    await this.supabase.from('webhook_deliveries').insert({
      webhook_id: endpoint.id,
      event_type: event.type,
      payload: event,
      status: 'pending',
    });

    // Trigger immediate delivery (in production, this would be a queue worker)
    await this.processDelivery(endpoint, event);
  }

  /**
   * Process a webhook delivery
   */
  private async processDelivery(
    endpoint: any,
    event: WebhookEvent,
    attemptNumber: number = 1
  ): Promise<void> {
    const startTime = Date.now();

    try {
      // Build request headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Tharaga-Event': event.type,
        'X-Tharaga-Delivery-Id': event.id,
        'X-Tharaga-Timestamp': event.timestamp,
        ...endpoint.headers,
      };

      // Add authentication
      this.addAuthentication(headers, endpoint, event);

      // Send request
      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(event),
        signal: AbortSignal.timeout(30000), // 30 second timeout
      });

      const responseBody = await response.text();
      const duration = Date.now() - startTime;

      // Update delivery record (using existing schema)
      await this.supabase
        .from('webhook_deliveries')
        .update({
          status: response.ok ? 'delivered' : 'failed',
          status_code: response.status,
          response_body: responseBody.substring(0, 10000), // Limit stored response
          response_time_ms: duration,
          attempt_number: attemptNumber,
          error_message: response.ok ? null : `HTTP ${response.status}`,
        })
        .eq('webhook_id', endpoint.id)
        .eq('event_type', event.type);

      // Update endpoint stats (using existing schema)
      await this.supabase
        .from('webhook_endpoints')
        .update({
          total_requests: (endpoint.total_requests || 0) + 1,
          [response.ok ? 'successful_requests' : 'failed_requests']:
            (response.ok ? (endpoint.successful_requests || 0) : (endpoint.failed_requests || 0)) + 1,
          last_request_at: new Date().toISOString(),
        })
        .eq('id', endpoint.id);

      // Schedule retry if failed
      if (!response.ok && attemptNumber < endpoint.max_retries) {
        await this.scheduleRetry(endpoint, event, attemptNumber + 1);
      }
    } catch (error: any) {
      const duration = Date.now() - startTime;

      // Update delivery record with error (using existing schema)
      await this.supabase
        .from('webhook_deliveries')
        .update({
          status: 'failed',
          response_time_ms: duration,
          attempt_number: attemptNumber,
          error_message: error.message,
        })
        .eq('webhook_id', endpoint.id)
        .eq('event_type', event.type);

      // Update endpoint stats (using existing schema)
      await this.supabase
        .from('webhook_endpoints')
        .update({
          total_requests: (endpoint.total_requests || 0) + 1,
          failed_requests: (endpoint.failed_requests || 0) + 1,
          last_request_at: new Date().toISOString(),
        })
        .eq('id', endpoint.id);

      // Schedule retry
      if (attemptNumber < endpoint.max_retries) {
        await this.scheduleRetry(endpoint, event, attemptNumber + 1);
      }
    }
  }

  /**
   * Add authentication to request headers
   */
  private addAuthentication(
    headers: Record<string, string>,
    endpoint: any,
    event: WebhookEvent
  ): void {
    // Using existing schema: webhook_secret and signature settings
    if (endpoint.require_signature && endpoint.webhook_secret) {
      const payload = JSON.stringify(event);
      const algorithm = endpoint.signature_algorithm || 'sha256';
      const signature = crypto
        .createHmac(algorithm, endpoint.webhook_secret)
        .update(payload)
        .digest('hex');
      const headerName = endpoint.signature_header || 'X-Tharaga-Signature';
      headers[headerName] = signature;
    }
  }

  /**
   * Schedule a retry delivery
   */
  private async scheduleRetry(
    endpoint: any,
    event: WebhookEvent,
    attemptNumber: number
  ): Promise<void> {
    const delay = endpoint.retry_delay_seconds * Math.pow(2, attemptNumber - 1); // Exponential backoff
    const nextRetryAt = new Date(Date.now() + delay * 1000);

    await this.supabase
      .from('webhook_deliveries')
      .update({
        status: 'retrying',
        next_retry_at: nextRetryAt.toISOString(),
        attempt_number: attemptNumber,
      })
      .eq('webhook_id', endpoint.id)
      .eq('event_type', event.type);

    // In production, this would be handled by a queue worker
    setTimeout(() => this.processDelivery(endpoint, event, attemptNumber), delay * 1000);
  }

  /**
   * Sanitize data before sending (remove sensitive fields)
   */
  private sanitizeData(data: Record<string, any>): Record<string, any> {
    const sensitiveFields = ['password', 'token', 'secret', 'credit_card', 'ssn'];
    const sanitized = { ...data };

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        delete sanitized[field];
      }
    }

    // Mask PII fields
    if (sanitized.phone) {
      sanitized.phone = this.maskPhone(sanitized.phone);
    }
    if (sanitized.email) {
      sanitized.email = this.maskEmail(sanitized.email);
    }

    return sanitized;
  }

  private maskPhone(phone: string): string {
    if (phone.length <= 4) return '****';
    return phone.slice(0, 2) + '****' + phone.slice(-4);
  }

  private maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (local.length <= 2) return '**@' + domain;
    return local[0] + '***' + local[local.length - 1] + '@' + domain;
  }

  /**
   * Test webhook endpoint
   */
  async testEndpoint(endpointId: string): Promise<{
    success: boolean;
    responseStatus?: number;
    responseTime?: number;
    error?: string;
  }> {
    const { data: endpoint } = await this.supabase
      .from('webhook_endpoints')
      .select('*')
      .eq('id', endpointId)
      .single();

    if (!endpoint) {
      return { success: false, error: 'Endpoint not found' };
    }

    const testEvent: WebhookEvent = {
      type: 'test',
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      data: {
        message: 'This is a test webhook from Tharaga',
        endpoint_id: endpointId,
      },
    };

    const startTime = Date.now();

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Tharaga-Event': 'test',
        ...endpoint.headers,
      };

      this.addAuthentication(headers, endpoint, testEvent);

      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(testEvent),
        signal: AbortSignal.timeout(10000),
      });

      return {
        success: response.ok,
        responseStatus: response.status,
        responseTime: Date.now() - startTime,
        error: response.ok ? undefined : `HTTP ${response.status}`,
      };
    } catch (error: any) {
      return {
        success: false,
        responseTime: Date.now() - startTime,
        error: error.message,
      };
    }
  }
}

// Export singleton
export const webhookService = new WebhookService();

