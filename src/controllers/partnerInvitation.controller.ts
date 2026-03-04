import { Request, Response, NextFunction } from 'express'
import { partnerInvitationService } from '../services/partnerInvitation.service'
import { AppError } from '../utils/AppError'

export class PartnerInvitationController {
  async invitePartner(req: Request, res: Response, next: NextFunction) {
    try {
      const { businessName, email, phone, businessType } = req.body
      const adminId = (req as any).admin?.adminId || (req as any).user?.adminId
      if (!businessName || !email) throw new AppError(400, 'Business name and email required', 'MISSING_FIELDS')

      const result = await partnerInvitationService.invitePartner({
        businessName,
        email,
        phone,
        businessType,
        invitedBy: adminId,
      })

      res.status(201).json({
        success: true,
        data: {
          partnerId: result.partner.id,
          email: result.partner.email,
          inviteLink: result.inviteLink,
          expiresAt: result.expiresAt,
        },
      })
    } catch (err) {
      next(err)
    }
  }

  async verifyInvite(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.params
      const partner = await partnerInvitationService.verifyInviteToken(token as string)

      res.json({
        success: true,
        data: {
          businessName: partner.businessName,
          email: partner.email,
          phone: partner.phone,
        },
      })
    } catch (err) {
      next(err)
    }
  }

  async completeRegistration(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, password, phone } = req.body
      if (!token || !password) throw new AppError(400, 'Token and password required', 'MISSING_FIELDS')
      if (password.length < 8) throw new AppError(400, 'Password must be at least 8 characters', 'WEAK_PASSWORD')

      const result = await partnerInvitationService.completeRegistration({ token, password, phone })

      res.json({
        success: true,
        data: result,
        message: 'Registration completed successfully. Please upload KYC documents.',
      })
    } catch (err) {
      next(err)
    }
  }
}

export const partnerInvitationController = new PartnerInvitationController()
