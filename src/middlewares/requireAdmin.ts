import { Request, Response, NextFunction } from 'express'
import { adminAuthService } from '../services/adminAuth.service'
import { AppError } from '../utils/AppError'

/**
 * requireAdmin: verifies Bearer JWT and attaches admin payload to request
 */
export default function requireAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization as string | undefined
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(401, 'Admin authentication required', 'UNAUTHORIZED')
    }

    const token = authHeader.substring(7)
    const decoded = adminAuthService.verifyToken(token)

    // Attach for backward compatibility as both `user` and `admin`
    ;(req as any).admin = decoded
    ;(req as any).user = decoded

    next()
  } catch (err) {
    next(err)
  }
}

export function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const admin = (req as any).admin || (req as any).user
    if (!admin || admin.role !== 'SUPER_ADMIN') {
      throw new AppError(403, 'Super admin access required', 'FORBIDDEN')
    }
    next()
  } catch (err) {
    next(err)
  }
}
