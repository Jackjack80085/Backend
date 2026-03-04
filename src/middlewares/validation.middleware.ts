import { z } from 'zod'
import { Request, Response, NextFunction } from 'express'
import { AppError, ErrorCodes } from '../utils/AppError'

// ---- Reusable schemas ----

export const paymentInitiationSchema = z.object({
  amount: z.number().positive('amount must be > 0'),
  paymentMethod: z.enum(['UPI', 'CARD', 'NETBANKING', 'WALLET']).optional(),
  userReference: z.string().min(1).max(512),
  idempotencyKey: z.string().uuid('idempotencyKey must be a valid UUID'),
  currency: z.string().length(3).default('INR'),
  callbackUrl: z.string().url().optional(),
  customerEmail: z.string().email().optional(),
  customerPhone: z.string().min(7).max(15).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
})

export const settlementRequestSchema = z.object({
  amount: z.number().positive('amount must be > 0'),
  metadata: z.record(z.string(), z.any()).optional(),
})

export const dateRangeSchema = z.object({
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
})

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  per: z.coerce.number().int().min(1).max(100).default(20),
})

// ---- Generic validate middleware factory ----

/**
 * Returns an Express middleware that validates `req.body` (or `req.query`)
 * against the given Zod schema.
 *
 * Usage:  router.post('/pay', validate(paymentInitiationSchema), handler)
 */
export function validate(schema: z.ZodTypeAny, source: 'body' | 'query' = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(source === 'body' ? req.body : req.query)
    if (!result.success) {
      const details = result.error.issues.map((i) => ({
        field: i.path.join('.'),
        message: i.message,
      }))
      return next(
        new AppError(400, 'Validation failed', ErrorCodes.VALIDATION_ERROR, details),
      )
    }
    // replace with parsed & coerced data
    if (source === 'body') (req as any).body = result.data
    else (req as any).query = result.data
    next()
  }
}
