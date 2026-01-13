import { Request, Response, NextFunction } from 'express';
import { RateLimiter } from '../rateLimiter';

/**
 * Express middleware for rate limiting requests
 */
export function createRateLimiterMiddleware(rateLimiter: RateLimiter) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const identifier = getClientIdentifier(req);
    
    if (!rateLimiter.isAllowed(identifier)) {
      const resetTime = rateLimiter.getResetTime(identifier);
      const resetInSeconds = Math.ceil(resetTime / 1000);
      
      res.status(429).json({
        error: 'Too many requests',
        message: 'Rate limit exceeded',
        retryAfter: resetInSeconds
      });
      return;
    }

    const remaining = rateLimiter.getRemaining(identifier);
    const resetTime = rateLimiter.getResetTime(identifier);
    
    res.setHeader('X-RateLimit-Remaining', remaining.toString());
    res.setHeader('X-RateLimit-Reset', Math.ceil(resetTime / 1000).toString());
    
    next();
  };
}

/**
 * Extract client identifier from request
 * Supports X-Forwarded-For for proxied requests
 */
function getClientIdentifier(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  
  if (forwarded) {
    const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    return ips.split(',')[0].trim();
  }
  
  return req.ip || req.socket.remoteAddress || 'unknown';
}
