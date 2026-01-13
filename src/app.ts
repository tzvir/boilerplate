import express, { Request, Response } from 'express';
import { errorHandler, notFoundHandler, AppError } from './middleware/errorHandler';

const app = express();

// Parse JSON request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Hello from Node.js Docker boilerplate with TypeScript' });
});

// Example POST endpoint to test JSON parsing
app.post('/echo', (req: Request, res: Response) => {
  res.json({ received: req.body });
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
