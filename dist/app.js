"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const rateLimiter_1 = require("./rateLimiter");
const rateLimiterMiddleware_1 = require("./middleware/rateLimiterMiddleware");
const errorHandler_1 = require("./middleware/errorHandler");
const app = (0, express_1.default)();
// Configure rate limiter: 10 requests per minute
const rateLimiter = new rateLimiter_1.RateLimiter({ windowMs: 60000, maxRequests: 10 });
const rateLimiterMiddleware = (0, rateLimiterMiddleware_1.createRateLimiterMiddleware)(rateLimiter);
// Apply rate limiting to all routes
app.use(rateLimiterMiddleware);
app.get('/', (req, res) => {
    res.json({ message: 'Hello from Node.js Docker boilerplate with TypeScript' });
});
// Example error route for testing
app.get('/error', (req, res) => {
    throw new errorHandler_1.AppError(400, 'This is a test error');
});
// 404 handler (must be after all routes)
app.use(errorHandler_1.notFoundHandler);
// Error handler (must be last)
app.use(errorHandler_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map