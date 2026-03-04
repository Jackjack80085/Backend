import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { AppError } from '../utils/AppError'

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization as string | undefined
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(401, 'Authentication required', 'UNAUTHORIZED')
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET || '') as any

    // Support both partner (partnerId) and admin (adminId) payloads
    ;(req as any).user = {
      id: decoded.partnerId || decoded.adminId,
      partnerId: decoded.partnerId,
      adminId: decoded.adminId,
      email: decoded.email,
      status: decoded.status,
      role: decoded.role,
    }

    next()
  } catch (err) {
    next(new AppError(401, 'Invalid or expired token', 'UNAUTHORIZED'))
  }
}
