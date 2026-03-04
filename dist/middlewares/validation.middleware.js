"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginationSchema = exports.dateRangeSchema = exports.settlementRequestSchema = exports.paymentInitiationSchema = void 0;
exports.validate = validate;
const zod_1 = require("zod");
const AppError_1 = require("../utils/AppError");
// ---- Reusable schemas ----
exports.paymentInitiationSchema = zod_1.z.object({
    amount: zod_1.z.number().positive('amount must be > 0'),
    paymentMethod: zod_1.z.enum(['UPI', 'CARD', 'NETBANKING', 'WALLET']).optional(),
    userReference: zod_1.z.string().min(1).max(512),
    idempotencyKey: zod_1.z.string().uuid('idempotencyKey must be a valid UUID'),
    currency: zod_1.z.string().length(3).default('INR'),
    callbackUrl: zod_1.z.string().url().optional(),
    customerEmail: zod_1.z.string().email().optional(),
    customerPhone: zod_1.z.string().min(7).max(15).optional(),
    metadata: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional(),
});
exports.settlementRequestSchema = zod_1.z.object({
    amount: zod_1.z.number().positive('amount must be > 0'),
    metadata: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional(),
});
exports.dateRangeSchema = zod_1.z.object({
    from: zod_1.z.string().datetime({ offset: true }).optional(),
    to: zod_1.z.string().datetime({ offset: true }).optional(),
});
exports.paginationSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    per: zod_1.z.coerce.number().int().min(1).max(100).default(20),
});
// ---- Generic validate middleware factory ----
/**
 * Returns an Express middleware that validates `req.body` (or `req.query`)
 * against the given Zod schema.
 *
 * Usage:  router.post('/pay', validate(paymentInitiationSchema), handler)
 */
function validate(schema, source = 'body') {
    return (req, _res, next) => {
        const result = schema.safeParse(source === 'body' ? req.body : req.query);
        if (!result.success) {
            const details = result.error.issues.map((i) => ({
                field: i.path.join('.'),
                message: i.message,
            }));
            return next(new AppError_1.AppError(400, 'Validation failed', AppError_1.ErrorCodes.VALIDATION_ERROR, details));
        }
        // replace with parsed & coerced data
        if (source === 'body')
            req.body = result.data;
        else
            req.query = result.data;
        next();
    };
}
