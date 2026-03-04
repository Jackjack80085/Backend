import { Router, Request, Response, NextFunction } from 'express'
import {
  rotateOwnKey,
  rotatePartnerKey,
  revokePartnerKey,
  getRotationHistory,
  getPartnerRotationHistory,
} from '../../controllers/apiKeyRotation.controller'
import requireAdmin from '../../middlewares/requireAdmin'

const router = Router()

// Partner middleware to verify JWT (sets req.partner)
function requirePartner(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization as string | undefined
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, message: 'Partner authentication required' })
      return
    }

    const token = authHeader.substring(7)
    const jwt = require('jsonwebtoken')
    const decoded = jwt.verify(token, process.env.JWT_SECRET || '') as { partnerId: string; email: string; status: string }

    ;(req as any).partner = decoded
    next()
  } catch (err) {
    res.status(401).json({ success: false, message: 'Invalid token' })
  }
}

// Partner routes (require authentication)
router.get('/partner/api-credentials', requirePartner, async (req, res, next) => {
  try {
    const partnerId = (req as any).partner?.partnerId
    if (!partnerId) return res.status(401).json({ success: false, message: 'Partner authentication required' })

    const prisma = require('../../config/database').default
    const partner = await prisma.partner.findUnique({ where: { id: partnerId } })
    if (!partner) return res.status(404).json({ success: false, message: 'Partner not found' })

    res.json({
      success: true,
      data: {
        apiKey: partner.apiKey || '',
        apiKeyVersion: partner.apiKeyVersion || 1,
        apiKeyActiveFrom: partner.apiKeyActiveFrom || new Date().toISOString(),
        webhookUrl: partner.webhookUrl || '',
        commissionRate: partner.commissionRate || 0,
      },
    })
  } catch (err) {
    next(err)
  }
})
router.post('/partner/rotate-api-key', requirePartner, rotateOwnKey)
router.get('/partner/api-key-history', requirePartner, getRotationHistory)

// Admin routes (require admin role)
router.post('/admin/partners/:partnerId/rotate-api-key', requireAdmin, rotatePartnerKey)
router.post('/admin/partners/:partnerId/revoke-api-key', requireAdmin, revokePartnerKey)
router.get('/admin/partners/:partnerId/api-key-history', requireAdmin, getPartnerRotationHistory)

export default router
