"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRateLimiterMiddleware = createRateLimiterMiddleware;
/**
 * Express middleware for rate limiting requests
 */
function createRateLimiterMiddleware(rateLimiter) {
    return (req, res, next) => {
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
function getClientIdentifier(req) {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
        const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded;
        return ips.split(',')[0].trim();
    }
    return req.ip || req.socket.remoteAddress || 'unknown';
}
//# sourceMappingURL=rateLimiterMiddleware.js.map