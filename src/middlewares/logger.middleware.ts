import { Request, Response, NextFunction } from 'express'

/**
 * Structured HTTP request logger.
 * Logs method, path, partner (if attached), status, and duration.
 * Strips sensitive headers from the output.
 */
const SENSITIVE_HEADERS = new Set([
  'x-signature',
  'x-api-key',
  'authorization',
  'x-paywise-signature',
])

export default function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now()

  // capture on finish
  res.on('finish', () => {
    const duration = Date.now() - start
    const partnerId = (req as any).partner?.id
    const safeHeaders: Record<string, string> = {}
    for (const [k, v] of Object.entries(req.headers)) {
      if (SENSITIVE_HEADERS.has(k.toLowerCase())) {
        safeHeaders[k] = '***'
      } else if (typeof v === 'string') {
        safeHeaders[k] = v
      }
    }

    const log = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      duration,
      partnerId: partnerId ?? null,
      ip: req.ip,
    }

    // info level for 2xx, warn for 4xx, error for 5xx
    if (res.statusCode >= 500) console.error('[request]', JSON.stringify(log))
    else if (res.statusCode >= 400) console.warn('[request]', JSON.stringify(log))
    else console.info('[request]', JSON.stringify(log))
  })

  next()
}
