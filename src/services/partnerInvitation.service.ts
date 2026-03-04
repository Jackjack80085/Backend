import crypto from 'crypto'
import prisma from '../config/database'
import { AppError } from '../utils/AppError'
import bcrypt from 'bcrypt'
import { emailService } from './email.service'
import { auditLogService } from './auditLog.service'

export class PartnerInvitationService {
  async invitePartner(params: { businessName: string; email: string; phone?: string; businessType?: string; invitedBy: string }) {
    const existing = await prisma.partner.findUnique({ where: { email: params.email } })
    if (existing) throw new AppError(400, 'Partner with this email already exists', 'PARTNER_EXISTS')

    const inviteToken = crypto.randomBytes(32).toString('hex')
    const inviteExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    const partner = await prisma.partner.create({
      data: {
        businessName: params.businessName,
        email: params.email,
        phone: params.phone,
        businessType: params.businessType,
        status: 'INVITED',
        kycStatus: 'PENDING',
        inviteToken,
        inviteExpiresAt,
        invitedBy: params.invitedBy,
        invitedAt: new Date(),
      },
    })

    await prisma.wallet.create({
      data: {
        partnerId: partner.id,
        type: 'PARTNER',
        balance: 0,
        currency: 'INR',
      },
    })

    const inviteLink = `${process.env.APP_URL}/onboarding/invite/${inviteToken}`

    // Send invitation email (development logs or actual send depending on env)
    try {
      await emailService.sendPartnerInvitation({
        email: params.email,
        businessName: params.businessName,
        inviteLink,
        expiresAt: inviteExpiresAt,
      })
    } catch (err) {
      console.warn('Failed to send partner invitation email', err)
    }

    // Audit log
    try {
      await auditLogService.log({
        action: 'PARTNER_INVITED',
        actorType: 'ADMIN',
        actorId: params.invitedBy,
        targetType: 'PARTNER',
        targetId: partner.id,
        description: `Invited ${params.businessName}`,
        metadata: { email: params.email },
      })
    } catch (err) {
      console.warn('Failed to create audit log for partner invitation', err)
    }

    return { partner, inviteLink, expiresAt: inviteExpiresAt }
  }

  async verifyInviteToken(token: string) {
    const partner = await prisma.partner.findUnique({ where: { inviteToken: token } })
    if (!partner) throw new AppError(404, 'Invalid invitation link', 'INVALID_INVITE')
    if (partner.status !== 'INVITED') throw new AppError(400, 'Invitation already used', 'INVITE_USED')
    if (partner.inviteExpiresAt && partner.inviteExpiresAt < new Date()) throw new AppError(400, 'Invitation expired', 'INVITE_EXPIRED')
    return partner
  }

  async completeRegistration(params: { token: string; password: string; phone?: string }) {
    const partner = await this.verifyInviteToken(params.token)
    const passwordHash = await bcrypt.hash(params.password, 12)

    const updated = await prisma.partner.update({
      where: { id: partner.id },
      data: {
        passwordHash,
        phone: params.phone || partner.phone,
        status: 'REGISTERED',
        isActive: true,
        registeredAt: new Date(),
        inviteToken: null,
        inviteExpiresAt: null,
      },
    })

    // Audit: partner completed registration
    try {
      await auditLogService.log({
        action: 'PARTNER_REGISTERED',
        actorType: 'PARTNER',
        actorId: updated.id,
        actorEmail: updated.email,
        targetType: 'PARTNER',
        targetId: updated.id,
        description: `Partner completed registration: ${updated.businessName}`,
        metadata: { registeredAt: new Date() },
      })
    } catch (err) {
      console.warn('Failed to write audit log for partner registration', err)
    }

    return {
      partnerId: updated.id,
      email: updated.email,
      businessName: updated.businessName,
    }
  }
}

export const partnerInvitationService = new PartnerInvitationService()
