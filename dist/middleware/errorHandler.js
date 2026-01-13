"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
exports.errorHandler = errorHandler;
exports.notFoundHandler = notFoundHandler;
class AppError extends Error {
    constructor(statusCode, message, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.message = message;
        this.isOperational = isOperational;
        Object.setPrototypeOf(this, AppError.prototype);
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
/**
 * Global error handling middleware
 * Must be registered last in the middleware chain
 */
function errorHandler(err, req, res, next) {
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
function notFoundHandler(req, res) {
    res.status(404).json({
        status: 'error',
        message: `Route ${req.method} ${req.path} not found`
    });
}
//# sourceMappingURL=errorHandler.js.map