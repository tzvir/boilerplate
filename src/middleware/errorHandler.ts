import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global error handling middleware
 * Must be registered last in the middleware chain
 */
export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      status: 'error',
      message: err.message
    });
    return;
  }

  // Log unexpected errors
  console.error('Unexpected error:', err);

  // Don't expose internal errors to clients
  res.status(500).json({
    status: 'error',
    message: 'Internal server error'
  });
}

/**
 * Catch-all for 404 errors
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.method} ${req.path} not found`
  });
}
