import prisma from '../config/database'

interface AuditLogParams {
  action: string
  actorType: 'ADMIN' | 'PARTNER' | 'SYSTEM'
  actorId?: string
  actorEmail?: string
  targetType?: string
  targetId?: string
  description?: string
  metadata?: any
  ipAddress?: string
  userAgent?: string
}

export class AuditLogService {
  async log(params: AuditLogParams) {
    try {
      await prisma.auditLog.create({
        data: {
          action: params.action,
          actorType: params.actorType,
          actorId: params.actorId,
          actorEmail: params.actorEmail,
          targetType: params.targetType,
          targetId: params.targetId,
          description: params.description,
          metadata: params.metadata,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
        },
      })

      console.log(`[AUDIT] ${params.action} by ${params.actorType}:${params.actorId || 'system'}`)
    } catch (error) {
      console.error('[AUDIT] Failed to log:', error)
    }
  }

  async query(filters: {
    actorId?: string
    targetId?: string
    action?: string
    actorType?: string
    fromDate?: Date
    toDate?: Date
    limit?: number
    offset?: number
  }) {
    const where: any = {}

    if (filters.actorId) where.actorId = filters.actorId
    if (filters.targetId) where.targetId = filters.targetId
    if (filters.action) where.action = filters.action
    if (filters.actorType) where.actorType = filters.actorType

    if (filters.fromDate || filters.toDate) {
      where.createdAt = {}
      if (filters.fromDate) where.createdAt.gte = filters.fromDate
      if (filters.toDate) where.createdAt.lte = filters.toDate
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filters.limit || 50,
        skip: filters.offset || 0,
      }),
      prisma.auditLog.count({ where }),
    ])

    return {
      logs,
      pagination: { total, limit: filters.limit || 50, offset: filters.offset || 0 },
    }
  }
}

export const auditLogService = new AuditLogService()
