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
  const message: string = status < 500 ? err.message : 'Internal Server Error'

  console.error('[errorHandler]', err)

  res.status(status).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message,
    },
  })
}

export default errorHandler
