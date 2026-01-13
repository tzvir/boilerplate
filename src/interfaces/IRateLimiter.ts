/**
 * Interface for rate limiting functionality.
 * Allows for different implementations (in-memory, Redis, etc.)
 */
export interface IRateLimiter {
  /**
   * Checks if a request from the given client should be allowed
   * @param clientId Unique identifier for the client
   * @returns Rate limit decision and metadata
   */
  checkLimit(clientId: string): {
    allowed: boolean;
    remaining: number;
    resetAt: Date;
    retryAfter?: number;
  };

  /**
   * Gets the current status for a client without consuming a request
   * @param clientId Unique identifier for the client
   * @returns Current rate limit status
   */
  getStatus(clientId: string): {
    requestCount: number;
    remaining: number;
    resetAt: Date;
  };

  /**
   * Resets the rate limit for a specific client
   * @param clientId Unique identifier for the client
   */
  resetClient(clientId: string): void;

  /**
   * Resets all rate limits
   */
  resetAll(): void;

  /**
   * Cleans up resources when the service is destroyed
   */
  destroy(): void;
}
