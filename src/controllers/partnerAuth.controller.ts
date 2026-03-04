import { Request, Response, NextFunction } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import prisma from '../config/database'
import { AppError } from '../utils/AppError'
import { auditLogService } from '../services/auditLog.service'

export class PartnerAuthController {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body

      if (!email || !password) throw new AppError(400, 'Email and password required', 'MISSING_FIELDS')

      const partner = await prisma.partner.findUnique({ where: { email } })

      if (!partner || !partner.passwordHash) throw new AppError(401, 'Invalid credentials', 'INVALID_CREDENTIALS')

      const isValid = await bcrypt.compare(password, partner.passwordHash)
      if (!isValid) {
        // Log failed partner login
        try {
          await auditLogService.log({
            action: 'PARTNER_LOGIN_FAILED',
            actorType: 'SYSTEM',
            actorEmail: email,
            description: 'Failed partner login attempt',
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            metadata: { reason: 'Invalid credentials' },
          })
        } catch (err) {
          console.warn('Failed to write audit log for partner failed login', err)
        }
        throw new AppError(401, 'Invalid credentials', 'INVALID_CREDENTIALS')
      }

      if (!partner.isActive && partner.status !== 'ACTIVE') throw new AppError(403, 'Account is not active', 'ACCOUNT_INACTIVE')

      const token = jwt.sign(
        {
          partnerId: partner.id,
          email: partner.email,
          status: partner.status,
        },
        process.env.JWT_SECRET || '',
        { expiresIn: '8h' }
      )

      res.json({
        success: true,
        data: {
          partner: {
            id: partner.id,
            email: partner.email,
            businessName: partner.businessName,
            status: partner.status,
            kycStatus: partner.kycStatus,
          },
          token,
        },
      })
      // Audit: successful partner login
      try {
        await auditLogService.log({
          action: 'PARTNER_LOGIN',
          actorType: 'PARTNER',
          actorId: partner.id,
          actorEmail: partner.email,
          description: 'Partner logged in',
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        })
      } catch (err) {
        console.warn('Failed to write audit log for partner login', err)
      }
    } catch (err) {
      next(err)
    }
  }
}

export const partnerAuthController = new PartnerAuthController()
