import { Router, Request, Response, NextFunction } from 'express'
import { adminAuthController } from '../../controllers/adminAuth.controller'
import requireAdmin, { requireSuperAdmin } from '../../middlewares/requireAdmin'
import { rateLimit } from '../../middlewares/rateLimit.middleware'

const router = Router()

// Admin login (rate limited)
router.post('/login', rateLimit('adminLogin'), async (req: Request, res: Response, next: NextFunction) => {
  await adminAuthController.login(req, res, next)
})

// Register new admin (super admin only)
router.post('/register', requireAdmin, requireSuperAdmin, async (req: Request, res: Response, next: NextFunction) => {
  await adminAuthController.register(req, res, next)
})

// Get profile
router.get('/me', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  await adminAuthController.getProfile(req, res, next)
})

// Change password
router.post('/change-password', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  await adminAuthController.changePassword(req, res, next)
})

export default router
