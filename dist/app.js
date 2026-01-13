"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const errorHandler_1 = require("./middleware/errorHandler");
const app = (0, express_1.default)();
// Parse JSON request bodies
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.get('/', (req, res) => {
    res.json({ message: 'Hello from Node.js Docker boilerplate with TypeScript' });
});
// Example POST endpoint to test JSON parsing
app.post('/echo', (req, res) => {
    res.json({ received: req.body });
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