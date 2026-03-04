import { Router, Request, Response, NextFunction } from 'express'
import { kycDocumentController } from '../../controllers/kycDocument.controller'
import { uploadKYC } from '../../middlewares/upload.middleware'

const router = Router()

// Partner middleware to verify JWT
function requirePartner(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization as string | undefined
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, error: 'Partner authentication required' })
      return
    }

    const token = authHeader.substring(7)
    const jwt = require('jsonwebtoken')
    const decoded = jwt.verify(token, process.env.JWT_SECRET || '') as { partnerId: string; email: string; status: string }

    ;(req as any).partner = decoded
    next()
  } catch (err) {
    res.status(401).json({ success: false, error: 'Invalid token' })
  }
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization as string | undefined
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, error: 'Admin authentication required' })
      return
    }

    const token = authHeader.substring(7)
    const jwt = require('jsonwebtoken')
    const decoded = jwt.verify(token, process.env.JWT_SECRET || '') as { adminId: string; role: string }

    if (decoded.role !== 'SUPER_ADMIN' && decoded.role !== 'ADMIN') {
      res.status(403).json({ success: false, error: 'Admin access required' })
      return
    }

    ;(req as any).admin = decoded
    next()
  } catch (err) {
    res.status(401).json({ success: false, error: 'Invalid token' })
  }
}

// Partner routes
router.post(
  '/partner/kyc-documents',
  requirePartner,
  uploadKYC.single('file'),
  (req: Request, res: Response, next: NextFunction) => kycDocumentController.uploadDocument(req, res, next)
)

router.get(
  '/partner/kyc-documents',
  requirePartner,
  (req: Request, res: Response, next: NextFunction) => kycDocumentController.getDocuments(req, res, next)
)

router.delete(
  '/partner/kyc-documents/:id',
  requirePartner,
  (req: Request, res: Response, next: NextFunction) => kycDocumentController.deleteDocument(req, res, next)
)

// Admin routes
router.get(
  '/admin/partners/:partnerId/kyc',
  requireAdmin,
  (req: Request, res: Response, next: NextFunction) => kycDocumentController.getPartnerDocumentsAdmin(req, res, next)
)

// Serve file (partner/admin access)
router.get(
  '/admin/kyc-documents/:id/file',
  requireAdmin,
  (req: Request, res: Response, next: NextFunction) => kycDocumentController.getDocumentFile(req, res, next)
)

router.get(
  '/partner/kyc-documents/:id/file',
  requirePartner,
  (req: Request, res: Response, next: NextFunction) => kycDocumentController.getDocumentFile(req, res, next)
)

router.post(
  '/admin/kyc-documents/:id/review',
  requireAdmin,
  (req: Request, res: Response, next: NextFunction) => kycDocumentController.reviewDocument(req, res, next)
)

export default router
