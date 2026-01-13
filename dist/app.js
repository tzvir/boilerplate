"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const errorHandler_1 = require("./middleware/errorHandler");
const rateLimiter_1 = require("./middleware/rateLimiter");
const RateLimiterService_1 = require("./services/RateLimiterService");
const app = (0, express_1.default)();
// Serve static files from public directory
app.use(express_1.default.static('public'));
// Parse JSON request bodies
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Create rate limiter services (dependency injection)
const globalRateLimiterService = new RateLimiterService_1.RateLimiterService({
    maxRequests: 100,
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: 'Too many requests from this IP, please try again later.'
});
const strictRateLimiterService = new RateLimiterService_1.RateLimiterService({
    maxRequests: 5,
    windowMs: 60 * 1000, // 1 minute
    message: 'Rate limit exceeded for this endpoint. Please wait before trying again.'
});
// Create middleware by injecting services
const globalLimiter = (0, rateLimiter_1.createRateLimiter)(globalRateLimiterService, {
    maxRequests: 100,
    windowMs: 15 * 60 * 1000,
    message: 'Too many requests from this IP, please try again later.'
});
const strictLimiter = (0, rateLimiter_1.createRateLimiter)(strictRateLimiterService, {
    maxRequests: 5,
    windowMs: 60 * 1000,
    message: 'Rate limit exceeded for this endpoint. Please wait before trying again.'
});
// Root route - serve the welcome page
app.get('/', (req, res) => {
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
app.get('/api', (req, res) => {
    res.json({ message: 'Hello from Node.js Docker boilerplate with TypeScript' });
});
// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});
// Example POST endpoint to test JSON parsing
app.post('/api/echo', (req, res) => {
    res.json({ received: req.body });
});
// Example of endpoint with stricter rate limiting
app.post('/api/sensitive', strictLimiter, (req, res) => {
    res.json({ message: 'This is a sensitive endpoint with strict rate limiting' });
});
// Example error route for testing
app.get('/api/error', (req, res) => {
    throw new errorHandler_1.AppError(400, 'This is a test error');
});
// 404 handler (must be after all routes)
app.use(errorHandler_1.notFoundHandler);
// Error handler (must be last)
app.use(errorHandler_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map