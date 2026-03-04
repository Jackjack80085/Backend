import { Router, Request, Response, NextFunction } from 'express'
import { partnerInvitationController } from '../../controllers/partnerInvitation.controller'
import requireAdmin from '../../middlewares/requireAdmin'
import prisma from '../../config/database'

const router = Router()

router.post(
  '/admin/partners/invite',
  requireAdmin,
  (req: Request, res: Response, next: NextFunction) => partnerInvitationController.invitePartner(req, res, next)
)

// ---- Admin: list partners ----
router.get('/admin/partners', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const partners = await prisma.partner.findMany({ orderBy: { createdAt: 'desc' } })
    res.json({ success: true, data: partners })
  } catch (err) {
    next(err)
  }
})

router.get(
  '/onboarding/verify-invite/:token',
  (req: Request, res: Response, next: NextFunction) => partnerInvitationController.verifyInvite(req, res, next)
)

router.post(
  '/onboarding/complete-registration',
  (req: Request, res: Response, next: NextFunction) => partnerInvitationController.completeRegistration(req, res, next)
)

export default router
