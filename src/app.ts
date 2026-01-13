import express, { Request, Response } from 'express';
import { container } from 'tsyringe';
import { RateLimiter } from './rateLimiter';
import { createRateLimiterMiddleware } from './middleware/rateLimiterMiddleware';
import { errorHandler, notFoundHandler, AppError } from './middleware/errorHandler';

const app = express();

// Configure rate limiter: 10 requests per minute
const rateLimiter = new RateLimiter({ windowMs: 60000, maxRequests: 10 });
const rateLimiterMiddleware = createRateLimiterMiddleware(rateLimiter);

// Apply rate limiting to all routes
app.use(rateLimiterMiddleware);

app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Hello from Node.js Docker boilerplate with TypeScript' });
});

// Example error route for testing
app.get('/error', (req: Request, res: Response) => {
  throw new AppError(400, 'This is a test error');
});

// 404 handler (must be after all routes)
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

export default app;
