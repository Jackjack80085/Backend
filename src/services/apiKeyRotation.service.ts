import crypto from 'crypto'
import bcrypt from 'bcrypt'
import prisma from '../config/database'
import { AppError } from '../utils/AppError'
import { emailService } from './email.service'
import { auditLogService } from './auditLog.service'
import { encryptSecret } from '../utils/crypto'

export class ApiKeyRotationService {
  private readonly API_KEY_LENGTH = 32
  private readonly API_SECRET_LENGTH = 64
  private readonly SALT_ROUNDS = 12

  async rotateApiKey(partnerId: string, reason?: string) {
    const partner = await prisma.partner.findUnique({ where: { id: partnerId } })

    if (!partner) throw new AppError(404, 'Partner not found', 'PARTNER_NOT_FOUND')
    if (partner.status !== 'ACTIVE') throw new AppError(400, 'Only active partners can rotate keys', 'INVALID_STATUS')
    if (!partner.apiKey) throw new AppError(400, 'No API key exists to rotate', 'NO_API_KEY')

    const newApiKey = this.generateApiKey()
    const newApiSecret = this.generateApiSecret()
    const newApiSecretHash = await bcrypt.hash(newApiSecret, this.SALT_ROUNDS)
    const newApiSecretEncrypted = encryptSecret(newApiSecret)

    const previousKeys = ((partner.previousApiKeys as any[]) || []).slice(-10) // Keep last 10
    previousKeys.push({
      apiKey: partner.apiKey,
      version: partner.apiKeyVersion,
      revokedAt: new Date().toISOString(),
      reason: reason || 'Manual rotation',
    })

    await prisma.partner.update({
      where: { id: partnerId },
      data: {
        apiKey: newApiKey,
        apiSecretHash: newApiSecretHash,
        apiSecretEncrypted: newApiSecretEncrypted,
        apiKeyVersion: partner.apiKeyVersion + 1,
        apiKeyActiveFrom: new Date(),
        apiKeyRevokedAt: null,
        previousApiKeys: previousKeys,
        lastKeyRotation: new Date(),
      },
    })

    console.log('\n🔄 API Key Rotated')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('Partner ID:', partnerId)
    console.log('New API Key:', newApiKey)
    console.log('New API Secret:', newApiSecret)
    console.log('Version:', partner.apiKeyVersion + 1)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('\n⚠️  IMPORTANT: Save these credentials securely!')
    console.log('⚠️  Old API key is now revoked.\n')

    // Send notification and audit log
    try {
      const updatedPartner = await prisma.partner.findUnique({ where: { id: partnerId } })
      if (updatedPartner) {
        await emailService.sendApiKeyRotated({
          email: updatedPartner.email,
          businessName: updatedPartner.businessName,
          apiKey: newApiKey,
          apiSecret: newApiSecret,
        })

        await auditLogService.log({
          action: 'API_KEY_ROTATED',
          actorType: 'PARTNER',
          actorId: partnerId,
          targetType: 'PARTNER',
          targetId: partnerId,
          description: reason || 'API key rotated',
        })
      }
    } catch (err) {
      console.warn('Failed to send api key rotated email or audit log', err)
    }

    return {
      apiKey: newApiKey,
      apiSecret: newApiSecret,
      version: partner.apiKeyVersion + 1,
      activeFrom: new Date(),
    }
  }

  async revokeApiKey(partnerId: string, reason: string) {
    const partner = await prisma.partner.findUnique({ where: { id: partnerId } })

    if (!partner || !partner.apiKey) throw new AppError(404, 'Partner or API key not found', 'NOT_FOUND')

    const previousKeys = ((partner.previousApiKeys as any[]) || []).slice(-10)
    previousKeys.push({
      apiKey: partner.apiKey,
      version: partner.apiKeyVersion,
      revokedAt: new Date().toISOString(),
      reason,
    })

    await prisma.partner.update({
      where: { id: partnerId },
      data: {
        apiKeyRevokedAt: new Date(),
        previousApiKeys: previousKeys,
      },
    })

    return { success: true }
  }

  async getRotationHistory(partnerId: string) {
    const partner = await prisma.partner.findUnique({
      where: { id: partnerId },
      select: {
        apiKeyVersion: true,
        apiKeyActiveFrom: true,
        lastKeyRotation: true,
        previousApiKeys: true,
      },
    })

    if (!partner) throw new AppError(404, 'Partner not found', 'PARTNER_NOT_FOUND')

    return {
      currentVersion: partner.apiKeyVersion,
      activeFrom: partner.apiKeyActiveFrom,
      lastRotation: partner.lastKeyRotation,
      history: partner.previousApiKeys || [],
    }
  }

  private generateApiKey(): string {
    return crypto.randomBytes(this.API_KEY_LENGTH).toString('hex')
  }

  private generateApiSecret(): string {
    return crypto.randomBytes(this.API_SECRET_LENGTH).toString('hex')
  }
}

export const apiKeyRotationService = new ApiKeyRotationService()
