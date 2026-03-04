"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimit = rateLimit;
const AppError_1 = require("../utils/AppError");
const defaultConfigs = {
    payment: { windowMs: 60000, max: 100 },
    webhook: { windowMs: 60000, max: 500 },
    report: { windowMs: 60000, max: 30 },
    adminLogin: { windowMs: 15 * 60000, max: 5 },
    default: { windowMs: 60000, max: 200 },
};
// key → timestamps[]
const buckets = new Map();
function slidingWindow(key, cfg) {
    const now = Date.now();
    const hits = (buckets.get(key) || []).filter((t) => now - t < cfg.windowMs);
    if (hits.length >= cfg.max) {
        const oldest = hits[0];
        const retryAfterMs = cfg.windowMs - (now - oldest);
        buckets.set(key, hits);
        return { allowed: false, retryAfterMs };
    }
    hits.push(now);
    buckets.set(key, hits);
    return { allowed: true, retryAfterMs: 0 };
}
/**
 * Factory: rateLimit('payment') returns middleware with that bucket config.
 */
function rateLimit(bucket = 'default') {
    const cfg = defaultConfigs[bucket] || defaultConfigs.default;
    // If not running in production, disable rate limiting to ease development/testing.
    if (process.env.NODE_ENV !== 'production') {
        return (req, _res, next) => next();
    }
    return (req, _res, next) => {
        // key = partner id or IP
        const partnerId = req.partner?.id;
        const ip = req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown';
        const key = `${bucket}:${partnerId || ip}`;
        const { allowed, retryAfterMs } = slidingWindow(key, cfg);
        if (!allowed) {
            const retryAfter = Math.ceil(retryAfterMs / 1000);
            const err = new AppError_1.AppError(429, 'Too many requests, please retry later', AppError_1.ErrorCodes.RATE_LIMIT_EXCEEDED, { retryAfter });
            _res.set?.('Retry-After', String(retryAfter));
            return next(err);
        }
        next();
    };
}
