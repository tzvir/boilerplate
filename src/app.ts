import express, { Request, Response } from 'express';
import { errorHandler, notFoundHandler, AppError } from './middleware/errorHandler';
import { createRateLimiter } from './middleware/rateLimiter';
import { RateLimiterService } from './services/RateLimiterService';

const app = express();

// Serve static files from public directory
app.use(express.static('public'));

// Parse JSON request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create rate limiter services (dependency injection)
const globalRateLimiterService = new RateLimiterService({
  maxRequests: 100,
  windowMs: 15 * 60 * 1000, // 15 minutes
  message: 'Too many requests from this IP, please try again later.'
});

const strictRateLimiterService = new RateLimiterService({
  maxRequests: 5,
  windowMs: 60 * 1000, // 1 minute
  message: 'Rate limit exceeded for this endpoint. Please wait before trying again.'
});

// Create middleware by injecting services
const globalLimiter = createRateLimiter(globalRateLimiterService, {
  maxRequests: 100,
  windowMs: 15 * 60 * 1000,
  message: 'Too many requests from this IP, please try again later.'
});

const strictLimiter = createRateLimiter(strictRateLimiterService, {
  maxRequests: 5,
  windowMs: 60 * 1000,
  message: 'Rate limit exceeded for this endpoint. Please wait before trying again.'
});

// Root route - serve the welcome page
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Welcome to Rate Limiter API',
    version: '0.1.0',
    endpoints: {
      api: '/api',
      health: '/api/health',
      documentation: '/api/docs'
    },
    rateLimit: {
      global: '100 requests per 15 minutes',
      strict: '5 requests per minute (for sensitive endpoints)'
    }
  });
});

// Apply global rate limiter to API routes only
app.use('/api', globalLimiter);

app.get('/api', (req: Request, res: Response) => {
  res.json({ message: 'Hello from Node.js Docker boilerplate with TypeScript' });
});

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Example POST endpoint to test JSON parsing
app.post('/api/echo', (req: Request, res: Response) => {
  res.json({ received: req.body });
});

// Example of endpoint with stricter rate limiting
app.post('/api/sensitive', strictLimiter, (req: Request, res: Response) => {
  res.json({ message: 'This is a sensitive endpoint with strict rate limiting' });
});

// Example error route for testing
app.get('/api/error', (req: Request, res: Response) => {
  throw new AppError(400, 'This is a test error');
});

// 404 handler (must be after all routes)
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

export default app;
