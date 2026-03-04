import { Request, Response, NextFunction } from 'express'
import { adminAuthService } from '../services/adminAuth.service'
import { AppError } from '../utils/AppError'

class AdminAuthController {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body || {}
      if (!email || !password) throw new AppError(400, 'Email and password required', 'MISSING_FIELDS')

      const result = await adminAuthService.login(email, password)
      res.json({ success: true, data: result })
    } catch (err) {
      next(err)
    }
  }

  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const requester = (req as any).user || (req as any).admin
      if (!requester || requester.role !== 'SUPER_ADMIN') {
        throw new AppError(403, 'Only super admins can create admins', 'FORBIDDEN')
      }

      const { email, password, name, role } = req.body || {}
      if (!email || !password || !name) throw new AppError(400, 'Email, password, and name required', 'MISSING_FIELDS')

      const admin = await adminAuthService.registerAdmin({ email, password, name, role })
      res.status(201).json({ success: true, data: admin })
    } catch (err) {
      next(err)
    }
  }

  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const adminId = (req as any).admin?.adminId || (req as any).user?.adminId
      if (!adminId) throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED')
      const admin = await adminAuthService.getAdminById(adminId)
      res.json({ success: true, data: admin })
    } catch (err) {
      next(err)
    }
  }

  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { oldPassword, newPassword } = req.body || {}
      const adminId = (req as any).admin?.adminId || (req as any).user?.adminId
      if (!oldPassword || !newPassword) throw new AppError(400, 'Old and new password required', 'MISSING_FIELDS')
      if (newPassword.length < 8) throw new AppError(400, 'Password must be at least 8 characters', 'WEAK_PASSWORD')

      await adminAuthService.changePassword(adminId, oldPassword, newPassword)
      res.json({ success: true, message: 'Password changed successfully' })
    } catch (err) {
      next(err)
    }
  }
}

export const adminAuthController = new AdminAuthController()
