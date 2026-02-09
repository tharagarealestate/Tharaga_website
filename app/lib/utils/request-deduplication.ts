/**
 * Request Deduplication Utility
 * Prevents duplicate API calls by tracking in-flight requests
 * Production-ready solution for high-traffic applications
 */

interface PendingRequest {
  promise: Promise<any>;
  timestamp: number;
  abortController: AbortController;
}

class RequestDeduplicator {
  private pendingRequests: Map<string, PendingRequest> = new Map();
  private readonly REQUEST_TIMEOUT = 30000; // 30 seconds
  private readonly CLEANUP_INTERVAL = 60000; // Clean up every minute

  constructor() {
    // Cleanup stale requests periodically
    if (typeof window !== 'undefined') {
      setInterval(() => this.cleanup(), this.CLEANUP_INTERVAL);
    }
  }

  /**
   * Generate cache key from request parameters
   */
  private getCacheKey(url: string, options?: RequestInit): string {
    const method = options?.method || 'GET';
    const body = options?.body ? JSON.stringify(options.body) : '';
    const headers = options?.headers ? JSON.stringify(options.headers) : '';
    return `${method}:${url}:${body}:${headers}`;
  }

  /**
   * Deduplicate fetch requests
   * Returns the same promise for identical concurrent requests
   */
  async deduplicateFetch(
    url: string,
    options?: RequestInit
  ): Promise<Response> {
    const cacheKey = this.getCacheKey(url, options);

    // Check if request is already in flight
    const existing = this.pendingRequests.get(cacheKey);
    if (existing) {
      // Check if request is still valid (not timed out)
      const age = Date.now() - existing.timestamp;
      if (age < this.REQUEST_TIMEOUT) {
        console.log(`[RequestDeduplicator] Reusing in-flight request: ${cacheKey.substring(0, 50)}`);
        return existing.promise;
      } else {
        // Request timed out, abort it
        existing.abortController.abort();
        this.pendingRequests.delete(cacheKey);
      }
    }

    // Create new request
    const abortController = new AbortController();
    const requestOptions: RequestInit = {
      ...options,
      signal: abortController.signal,
    };

    const promise = fetch(url, requestOptions)
      .then((response) => {
        // Remove from pending after completion
        this.pendingRequests.delete(cacheKey);
        return response;
      })
      .catch((error) => {
        // Remove from pending on error
        this.pendingRequests.delete(cacheKey);
        throw error;
      });

    // Store pending request
    this.pendingRequests.set(cacheKey, {
      promise,
      timestamp: Date.now(),
      abortController,
    });

    return promise;
  }

  /**
   * Abort a specific request
   */
  abort(url: string, options?: RequestInit): void {
    const cacheKey = this.getCacheKey(url, options);
    const pending = this.pendingRequests.get(cacheKey);
    if (pending) {
      pending.abortController.abort();
      this.pendingRequests.delete(cacheKey);
    }
  }

  /**
   * Abort all pending requests
   */
  abortAll(): void {
    for (const [key, pending] of this.pendingRequests.entries()) {
      pending.abortController.abort();
      this.pendingRequests.delete(key);
    }
  }

  /**
   * Cleanup stale requests
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, pending] of this.pendingRequests.entries()) {
      const age = now - pending.timestamp;
      if (age > this.REQUEST_TIMEOUT) {
        pending.abortController.abort();
        this.pendingRequests.delete(key);
      }
    }
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      pendingRequests: this.pendingRequests.size,
      keys: Array.from(this.pendingRequests.keys()),
    };
  }
}

// Singleton instance
export const requestDeduplicator = new RequestDeduplicator();
