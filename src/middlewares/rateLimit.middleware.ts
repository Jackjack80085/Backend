import { Request, Response, NextFunction } from 'express'
import { AppError, ErrorCodes } from '../utils/AppError'

// ---- simple in-memory sliding-window rate limiter ----
// Works per-process; swap for Redis-backed limiter in production.

type BucketConfig = { windowMs: number; max: number }

const defaultConfigs: Record<string, BucketConfig> = {
  payment: { windowMs: 60_000, max: 100 },
  webhook: { windowMs: 60_000, max: 500 },
  report: { windowMs: 60_000, max: 30 },
  adminLogin: { windowMs: 15 * 60_000, max: 5 },
  default: { windowMs: 60_000, max: 200 },
}

// key → timestamps[]
const buckets = new Map<string, number[]>()

function slidingWindow(key: string, cfg: BucketConfig): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now()
  const hits = (buckets.get(key) || []).filter((t) => now - t < cfg.windowMs)
  if (hits.length >= cfg.max) {
    const oldest = hits[0]
    const retryAfterMs = cfg.windowMs - (now - oldest)
    buckets.set(key, hits)
    return { allowed: false, retryAfterMs }
  }
  hits.push(now)
  buckets.set(key, hits)
  return { allowed: true, retryAfterMs: 0 }
}

/**
 * Factory: rateLimit('payment') returns middleware with that bucket config.
 */
export function rateLimit(bucket: string = 'default') {
  const cfg = defaultConfigs[bucket] || defaultConfigs.default
  // If not running in production, disable rate limiting to ease development/testing.
  if (process.env.NODE_ENV !== 'production') {
    return (req: Request, _res: Response, next: NextFunction) => next()
  }

  return (req: Request, _res: Response, next: NextFunction) => {
    // key = partner id or IP
    const partnerId = (req as any).partner?.id
    const ip = req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown'
    const key = `${bucket}:${partnerId || ip}`
    const { allowed, retryAfterMs } = slidingWindow(key, cfg)

    if (!allowed) {
      const retryAfter = Math.ceil(retryAfterMs / 1000)
      const err = new AppError(429, 'Too many requests, please retry later', ErrorCodes.RATE_LIMIT_EXCEEDED, { retryAfter })
      // attach Retry-After header
      ;(_res as any).set?.('Retry-After', String(retryAfter))
      return next(err)
    }
    next()
  }
}
