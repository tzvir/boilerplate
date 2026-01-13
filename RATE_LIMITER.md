# Rate Limiter Implementation

This project includes a custom-built rate limiter implementation using a sliding window algorithm.

## Features

- **Sliding Window Algorithm**: Tracks requests over a configurable time window
- **Per-Client Tracking**: Rate limits are enforced individually per IP address
- **Memory Efficient**: Automatic cleanup of stale records
- **Configurable**: Easily adjust limits and time windows
- **Standard Headers**: Returns standard rate limit headers (X-RateLimit-*)
- **TypeScript**: Fully typed with comprehensive JSDoc comments

## Usage

### Basic Setup

```typescript
import { createRateLimiter } from './middleware/rateLimiter';

// Create a rate limiter: 100 requests per 15 minutes
const limiter = createRateLimiter({
  maxRequests: 100,
  windowMs: 15 * 60 * 1000,
  message: 'Too many requests, please try again later.'
});

// Apply to all routes
app.use(limiter);

// Or apply to specific routes
app.post('/api/login', limiter, (req, res) => {
  // Your route handler
});
```

### Multiple Rate Limiters

You can create different rate limiters for different routes:

```typescript
// General API limiter
const apiLimiter = createRateLimiter({
  maxRequests: 100,
  windowMs: 15 * 60 * 1000
});

// Strict limiter for sensitive endpoints
const strictLimiter = createRateLimiter({
  maxRequests: 5,
  windowMs: 60 * 1000
});

app.use('/api/', apiLimiter);
app.post('/api/login', strictLimiter, loginHandler);
```

### Custom Configuration

```typescript
const limiter = createRateLimiter({
  maxRequests: 50,
  windowMs: 10 * 60 * 1000,
  message: 'Custom error message',
  statusCode: 429,
  includeHeaders: true,
  keyGenerator: (req) => {
    // Custom client identification
    return req.headers['x-api-key'] as string || req.ip;
  },
  onLimitReached: (req, res) => {
    // Custom handler when limit is exceeded
    console.log(`Rate limit exceeded for ${req.ip}`);
  }
});
```

## Configuration Options

- `maxRequests` (number): Maximum number of requests allowed within the time window
- `windowMs` (number): Time window in milliseconds
- `message` (string, optional): Custom error message when rate limit is exceeded
- `statusCode` (number, optional): HTTP status code to return (default: 429)
- `includeHeaders` (boolean, optional): Include rate limit headers in response (default: true)
- `keyGenerator` (function, optional): Custom function to extract client identifier
- `onLimitReached` (function, optional): Custom handler called when limit is exceeded

## Response Headers

When a request is processed, the following headers are included:

- `X-RateLimit-Limit`: Maximum number of requests allowed
- `X-RateLimit-Remaining`: Number of requests remaining in current window
- `X-RateLimit-Reset`: ISO timestamp when the rate limit resets
- `Retry-After`: Seconds until the rate limit resets (only when limit exceeded)

## Example Response

When rate limit is exceeded:

```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests, please try again later.",
  "retryAfter": 45
}
```

## Testing

Run the comprehensive test suite:

```bash
npm test
```

Tests cover:
- Basic rate limiting
- Multiple client tracking
- Sliding window expiration
- Status checking without consuming requests
- Client reset functionality
- Accurate remaining counts
- Rapid sequential requests

## Architecture

### RateLimiterService

The core service that implements the sliding window algorithm. It:
- Tracks request timestamps per client
- Removes expired requests from the window
- Calculates remaining requests
- Provides reset functionality
- Automatically cleans up stale records

### Rate Limiter Middleware

Express middleware that:
- Extracts client identifier (IP address by default)
- Checks rate limits using the service
- Adds standard rate limit headers to responses
- Returns appropriate error responses when limits are exceeded
- Passes successful requests to the next middleware

## Implementation Details

The rate limiter uses a **sliding window** algorithm:

1. Each client has a record with an array of request timestamps
2. When a request comes in, timestamps older than the window are removed
3. If the remaining count is below the limit, the request is allowed
4. The current timestamp is added to the array
5. Rate limit information is calculated and returned

This approach provides:
- Accurate per-second rate limiting
- No sudden bursts at window boundaries
- Memory efficiency through automatic cleanup
- O(n) time complexity where n is requests per window

## Memory Management

The service automatically cleans up stale client records every 5 minutes to prevent memory leaks. Records are considered stale if they haven't been accessed for more than 2x the configured window duration.
