import { injectable } from 'tsyringe';
import { IRateLimiter } from '../interfaces/IRateLimiter';

/**
 * Configuration options for the rate limiter
 */
export interface RateLimiterOptions {
  /**
   * Maximum number of requests allowed within the time window
   */
  maxRequests: number;
  
  /**
   * Time window in milliseconds
   */
  windowMs: number;
  
  /**
   * Message to return when rate limit is exceeded
   */
  message?: string;
}

/**
 * Tracks request history for a client
 */
interface ClientRecord {
  /**
   * Array of timestamps (in ms) when requests were made
   */
  requests: number[];
  
  /**
   * Timestamp when this record was last accessed
   */
  lastAccessed: number;
}

/**
 * Service that implements rate limiting using a sliding window algorithm.
 * Tracks requests per client identifier (typically IP address) and enforces
 * configurable limits on request frequency.
 */
@injectable()
export class RateLimiterService implements IRateLimiter {
  private clients: Map<string, ClientRecord>;
  private options: Required<RateLimiterOptions>;
  private cleanupInterval: NodeJS.Timeout | null;

  /**
   * Creates a new rate limiter service
   * @param options Configuration for rate limiting behavior
   */
  constructor(options: RateLimiterOptions) {
    this.clients = new Map();
    this.options = {
      maxRequests: options.maxRequests,
      windowMs: options.windowMs,
      message: options.message || 'Too many requests, please try again later.'
    };
    
    // Clean up stale client records every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupStaleRecords();
    }, 5 * 60 * 1000);
  }

  /**
   * Checks if a request from the given client should be allowed
   * @param clientId Unique identifier for the client (e.g., IP address)
   * @returns Object indicating if request is allowed and current rate limit info
   */
  checkLimit(clientId: string): {
    allowed: boolean;
    remaining: number;
    resetAt: Date;
    retryAfter?: number;
  } {
    const now = Date.now();
    const windowStart = now - this.options.windowMs;
    
    // Get or create client record
    let clientRecord = this.clients.get(clientId);
    if (!clientRecord) {
      clientRecord = {
        requests: [],
        lastAccessed: now
      };
      this.clients.set(clientId, clientRecord);
    }
    
    // Remove requests outside the current window
    clientRecord.requests = clientRecord.requests.filter(
      timestamp => timestamp > windowStart
    );
    
    // Update last accessed time
    clientRecord.lastAccessed = now;
    
    // Calculate remaining requests
    const requestCount = clientRecord.requests.length;
    const remaining = Math.max(0, this.options.maxRequests - requestCount);
    
    // Determine if request is allowed
    const allowed = requestCount < this.options.maxRequests;
    
    if (allowed) {
      // Add current request timestamp
      clientRecord.requests.push(now);
    }
    
    // Calculate reset time (when the oldest request will expire)
    const oldestRequest = clientRecord.requests[0] || now;
    const resetAt = new Date(oldestRequest + this.options.windowMs);
    
    // Calculate retry after (in seconds) if request is not allowed
    let retryAfter: number | undefined;
    if (!allowed) {
      retryAfter = Math.ceil((resetAt.getTime() - now) / 1000);
    }
    
    return {
      allowed,
      remaining: allowed ? remaining - 1 : 0,
      resetAt,
      retryAfter
    };
  }

  /**
   * Resets the rate limit for a specific client
   * @param clientId Unique identifier for the client
   */
  resetClient(clientId: string): void {
    this.clients.delete(clientId);
  }

  /**
   * Resets all rate limits
   */
  resetAll(): void {
    this.clients.clear();
  }

  /**
   * Gets the current status for a client without consuming a request
   * @param clientId Unique identifier for the client
   * @returns Current rate limit status
   */
  getStatus(clientId: string): {
    requestCount: number;
    remaining: number;
    resetAt: Date;
  } {
    const now = Date.now();
    const windowStart = now - this.options.windowMs;
    const clientRecord = this.clients.get(clientId);
    
    if (!clientRecord) {
      return {
        requestCount: 0,
        remaining: this.options.maxRequests,
        resetAt: new Date(now + this.options.windowMs)
      };
    }
    
    // Filter requests within window
    const validRequests = clientRecord.requests.filter(
      timestamp => timestamp > windowStart
    );
    
    const requestCount = validRequests.length;
    const remaining = Math.max(0, this.options.maxRequests - requestCount);
    const oldestRequest = validRequests[0] || now;
    const resetAt = new Date(oldestRequest + this.options.windowMs);
    
    return {
      requestCount,
      remaining,
      resetAt
    };
  }

  /**
   * Removes client records that haven't been accessed recently
   * to prevent memory leaks
   */
  private cleanupStaleRecords(): void {
    const now = Date.now();
    const staleThreshold = now - (this.options.windowMs * 2);
    
    for (const [clientId, record] of this.clients.entries()) {
      if (record.lastAccessed < staleThreshold) {
        this.clients.delete(clientId);
      }
    }
  }

  /**
   * Cleans up resources when the service is destroyed
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clients.clear();
  }
}
