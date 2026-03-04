import bcrypt from 'bcrypt'
import jwt, { SignOptions } from 'jsonwebtoken'
import prisma from '../config/database'
import { AppError } from '../utils/AppError'
import { auditLogService } from './auditLog.service'

interface AdminTokenPayload {
  adminId: string
  email: string
  role: 'SUPER_ADMIN' | 'ADMIN'
  iat?: number
  exp?: number
}

export class AdminAuthService {
  private readonly JWT_SECRET = process.env.JWT_SECRET || ''
  private readonly JWT_EXPIRES_IN: string | number = process.env.JWT_EXPIRES_IN || '8h'
  private readonly SALT_ROUNDS = 12

  async registerAdmin(params: { email: string; password: string; name: string; role?: 'ADMIN' | 'SUPER_ADMIN' }) {
    const existing = await prisma.admin.findUnique({ where: { email: params.email } })
    if (existing) throw new AppError(400, 'Admin already exists', 'ADMIN_EXISTS')

    const passwordHash = await bcrypt.hash(params.password, this.SALT_ROUNDS)

    const admin = await prisma.admin.create({
      data: {
        email: params.email,
        passwordHash,
        name: params.name,
        role: params.role || 'ADMIN',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    })

    return admin
  }

  async login(email: string, password: string) {
    const admin = await prisma.admin.findUnique({ where: { email } })
    if (!admin) {
      try {
        await auditLogService.log({
          action: 'ADMIN_LOGIN_FAILED',
          actorType: 'SYSTEM',
          actorEmail: email,
          description: 'Failed admin login attempt',
          metadata: { reason: 'Admin not found' },
        })
      } catch (err) {
        console.warn('Failed to write audit log for failed admin login', err)
      }
      throw new AppError(401, 'Invalid credentials', 'INVALID_CREDENTIALS')
    }
    if (!admin.isActive) throw new AppError(403, 'Admin account is deactivated', 'ACCOUNT_DEACTIVATED')

    const isValidPassword = await bcrypt.compare(password, admin.passwordHash)
    if (!isValidPassword) {
      try {
        await auditLogService.log({
          action: 'ADMIN_LOGIN_FAILED',
          actorType: 'SYSTEM',
          actorEmail: email,
          description: 'Failed admin login attempt',
          metadata: { reason: 'Invalid credentials' },
        })
      } catch (err) {
        console.warn('Failed to write audit log for failed admin login', err)
      }
      throw new AppError(401, 'Invalid credentials', 'INVALID_CREDENTIALS')
    }

    await prisma.admin.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } })

    try {
      await auditLogService.log({
        action: 'ADMIN_LOGIN',
        actorType: 'ADMIN',
        actorId: admin.id,
        actorEmail: admin.email,
        description: 'Admin logged in',
        metadata: { lastLoginAt: new Date() },
      })
    } catch (err) {
      console.warn('Failed to write audit log for admin login', err)
    }

    const token = this.generateToken({ adminId: admin.id, email: admin.email, role: admin.role as 'ADMIN' | 'SUPER_ADMIN' })

    return {
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
      token,
    }
  }

  verifyToken(token: string): AdminTokenPayload {
    if (!this.JWT_SECRET) throw new AppError(500, 'JWT_SECRET not configured', 'CONFIG_ERROR')
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as AdminTokenPayload
      return decoded
    } catch (err) {
      throw new AppError(401, 'Invalid or expired token', 'INVALID_TOKEN')
    }
  }

  private generateToken(payload: AdminTokenPayload): string {
    const options: SignOptions = { expiresIn: this.JWT_EXPIRES_IN as any }
    return jwt.sign(payload, this.JWT_SECRET as jwt.Secret, options)
  }

  async changePassword(adminId: string, oldPassword: string, newPassword: string) {
    const admin = await prisma.admin.findUnique({ where: { id: adminId } })
    if (!admin) throw new AppError(404, 'Admin not found', 'ADMIN_NOT_FOUND')

    const isValid = await bcrypt.compare(oldPassword, admin.passwordHash)
    if (!isValid) throw new AppError(401, 'Incorrect current password', 'INVALID_PASSWORD')

    const newPasswordHash = await bcrypt.hash(newPassword, this.SALT_ROUNDS)

    await prisma.admin.update({ where: { id: adminId }, data: { passwordHash: newPasswordHash } })

    return { success: true }
  }

  async getAdminById(adminId: string) {
    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
      select: { id: true, email: true, name: true, role: true, isActive: true, lastLoginAt: true, createdAt: true },
    })
    if (!admin) throw new AppError(404, 'Admin not found', 'ADMIN_NOT_FOUND')
    return admin
  }
}

export const adminAuthService = new AdminAuthService()
