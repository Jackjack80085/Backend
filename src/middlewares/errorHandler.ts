import { NextFunction, Request, Response } from 'express'
import { AppError } from '../utils/AppError'

function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  // AppError → structured response
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
    })
  }

  // Legacy errors that have a .status / .statusCode number
  const status: number = err.statusCode || err.status || 500
  const actualMessage: string = err.message || 'Unknown error'
  const message: string = status < 500 ? actualMessage : `Internal Server Error: ${actualMessage}`

  console.error('[errorHandler]', { status, message: actualMessage, stack: err.stack })

  res.status(status).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message,
      debug: process.env.NODE_ENV !== 'production' ? { msg: err?.message, stack: err?.stack?.split('\n').slice(0, 5) } : undefined,
    },
  })
}

export default errorHandler

