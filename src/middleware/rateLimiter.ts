import { Request, Response, NextFunction } from 'express';
import { IRateLimiter } from '../interfaces/IRateLimiter';

/**
 * Configuration options for the rate limiter middleware
 */
export interface RateLimiterMiddlewareOptions {
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
  
  /**
   * Function to extract client identifier from request
   * Defaults to using IP address
   */
  keyGenerator?: (req: Request) => string;
  
  /**
   * Function called when rate limit is exceeded
   */
  onLimitReached?: (req: Request, res: Response) => void;
  
  /**
   * Whether to include rate limit headers in response
   * Defaults to true
   */
  includeHeaders?: boolean;
  
  /**
   * HTTP status code to return when rate limit is exceeded
   * Defaults to 429 (Too Many Requests)
   */
  statusCode?: number;
}

/**
 * Default function to extract client identifier from request
 * Uses X-Forwarded-For header if available, otherwise falls back to connection IP
 */
function defaultKeyGenerator(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown';
}

/**
 * Creates Express middleware that enforces rate limiting on incoming requests.
 * Depends on an injected IRateLimiter implementation for actual rate limiting logic.
 * 
 * @param rateLimiter The rate limiter service to use (injected dependency)
 * @param options Configuration options for middleware behavior
 * @returns Express middleware function
 * 
 * @example
 * ```typescript
 * const service = new RateLimiterService({
 *   maxRequests: 100,
 *   windowMs: 15 * 60 * 1000
 * });
 * 
 * const limiter = createRateLimiter(service, {
 *   maxRequests: 100,
 *   windowMs: 15 * 60 * 1000,
 *   message: 'Too many requests from this IP'
 * });
 * 
 * app.use('/api/', limiter);
 * ```
 */
export function createRateLimiter(
  rateLimiter: IRateLimiter,
  options: RateLimiterMiddlewareOptions
) {
  const keyGenerator = options.keyGenerator || defaultKeyGenerator;
  const includeHeaders = options.includeHeaders !== false;
  const statusCode = options.statusCode || 429;
  
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const clientId = keyGenerator(req);
      const result = rateLimiter.checkLimit(clientId);
      
      // Add rate limit headers to response if enabled
      if (includeHeaders) {
        res.setHeader('X-RateLimit-Limit', options.maxRequests.toString());
        res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
        res.setHeader('X-RateLimit-Reset', result.resetAt.toISOString());
        
        if (!result.allowed && result.retryAfter) {
          res.setHeader('Retry-After', result.retryAfter.toString());
        }
      }
      
      if (!result.allowed) {
        // Call custom handler if provided
        if (options.onLimitReached) {
          options.onLimitReached(req, res);
          return;
        }
        
        // Default response when rate limit is exceeded
        res.status(statusCode).json({
          error: 'Rate limit exceeded',
          message: options.message || 'Too many requests, please try again later.',
          retryAfter: result.retryAfter
        });
        return;
      }
      
      next();
    } catch (error) {
      // Pass errors to Express error handler
      next(error);
    }
  };
}

/**
 * Factory function to create multiple rate limiters with different configurations.
 * Useful for applying different limits to different routes.
 * Properly manages service instances and their corresponding middleware.
 */
export class RateLimiterFactory {
  private limiters: Map<string, {
    service: IRateLimiter;
    middleware: ReturnType<typeof createRateLimiter>;
  }>;
  
  constructor() {
    this.limiters = new Map();
  }
  
  /**
   * Creates and stores a named rate limiter with its service instance
   * @param name Unique identifier for this rate limiter
   * @param serviceFactory Factory function to create the rate limiter service
   * @param options Middleware configuration options
   */
  create(
    name: string,
    serviceFactory: () => IRateLimiter,
    options: RateLimiterMiddlewareOptions
  ): ReturnType<typeof createRateLimiter> {
    const service = serviceFactory();
    const middleware = createRateLimiter(service, options);
    this.limiters.set(name, { service, middleware });
    return middleware;
  }
  
  /**
   * Retrieves a previously created rate limiter middleware by name
   */
  get(name: string): ReturnType<typeof createRateLimiter> | undefined {
    return this.limiters.get(name)?.middleware;
  }
  
  /**
   * Gets the service instance for a named rate limiter
   */
  getService(name: string): IRateLimiter | undefined {
    return this.limiters.get(name)?.service;
  }
  
  /**
   * Cleans up all rate limiter services
   */
  destroy(): void {
    for (const { service } of this.limiters.values()) {
      service.destroy();
    }
    this.limiters.clear();
  }
}
