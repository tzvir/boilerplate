"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimiter = void 0;
const tsyringe_1 = require("tsyringe");
/**
 * In-memory rate limiter using sliding window algorithm
 */
let RateLimiter = class RateLimiter {
    constructor(options = { windowMs: 60000, maxRequests: 100 }) {
        this.store = new Map();
        this.windowMs = options.windowMs;
        this.maxRequests = options.maxRequests;
    }
    /**
     * Check if a request from the given identifier should be allowed
     * @param identifier - Unique identifier (typically IP address)
     * @returns true if request is allowed, false if rate limit exceeded
     */
    isAllowed(identifier) {
        const now = Date.now();
        const record = this.store.get(identifier);
        if (!record || now >= record.resetAt) {
            this.resetLimit(identifier, now);
            return true;
        }
        if (record.count < this.maxRequests) {
            record.count++;
            return true;
        }
        return false;
    }
    /**
     * Get remaining requests for an identifier
     */
    getRemaining(identifier) {
        const record = this.store.get(identifier);
        if (!record || Date.now() >= record.resetAt) {
            return this.maxRequests;
        }
        return Math.max(0, this.maxRequests - record.count);
    }
    /**
     * Get time until rate limit resets (in milliseconds)
     */
    getResetTime(identifier) {
        const record = this.store.get(identifier);
        if (!record) {
            return 0;
        }
        return Math.max(0, record.resetAt - Date.now());
    }
    /**
     * Reset the rate limit for an identifier
     */
    resetLimit(identifier, now) {
        this.store.set(identifier, {
            count: 1,
            resetAt: now + this.windowMs
        });
    }
    /**
     * Clear all stored records (useful for testing)
     */
    clear() {
        this.store.clear();
    }
};
exports.RateLimiter = RateLimiter;
exports.RateLimiter = RateLimiter = __decorate([
    (0, tsyringe_1.injectable)(),
    __metadata("design:paramtypes", [Object])
], RateLimiter);
//# sourceMappingURL=rateLimiter.js.map