import { injectable } from 'tsyringe';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

export interface RateLimiterOptions {
  windowMs: number;
  maxRequests: number;
}

/**
 * In-memory rate limiter using sliding window algorithm
 */
@injectable()
export class RateLimiter {
  private store: Map<string, RateLimitRecord>;
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(options: RateLimiterOptions = { windowMs: 60000, maxRequests: 100 }) {
    this.store = new Map();
    this.windowMs = options.windowMs;
    this.maxRequests = options.maxRequests;
  }

  /**
   * Check if a request from the given identifier should be allowed
   * @param identifier - Unique identifier (typically IP address)
   * @returns true if request is allowed, false if rate limit exceeded
   */
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const record = this.store.get(identifier);

    if (!record || now >= record.resetAt) {
      this.resetLimit(identifier, now);
      return true;
    }

    if (record.count < this.maxRequests) {
      record.count++;
      return true;
    }

    return false;
  }

  /**
   * Get remaining requests for an identifier
   */
  getRemaining(identifier: string): number {
    const record = this.store.get(identifier);
    
    if (!record || Date.now() >= record.resetAt) {
      return this.maxRequests;
    }

    return Math.max(0, this.maxRequests - record.count);
  }

  /**
   * Get time until rate limit resets (in milliseconds)
   */
  getResetTime(identifier: string): number {
    const record = this.store.get(identifier);
    
    if (!record) {
      return 0;
    }

    return Math.max(0, record.resetAt - Date.now());
  }

  /**
   * Reset the rate limit for an identifier
   */
  private resetLimit(identifier: string, now: number): void {
    this.store.set(identifier, {
      count: 1,
      resetAt: now + this.windowMs
    });
  }

  /**
   * Clear all stored records (useful for testing)
   */
  clear(): void {
    this.store.clear();
  }
}
