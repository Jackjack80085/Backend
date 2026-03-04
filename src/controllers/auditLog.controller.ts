import { Request, Response, NextFunction } from 'express'
import { auditLogService } from '../services/auditLog.service'
import { AppError } from '../utils/AppError'

export class AuditLogController {
  async queryLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const { actorId, targetId, action, actorType, fromDate, toDate, limit, offset } = req.query

      const result = await auditLogService.query({
        actorId: actorId as string,
        targetId: targetId as string,
        action: action as string,
        actorType: actorType as string,
        fromDate: fromDate ? new Date(fromDate as string) : undefined,
        toDate: toDate ? new Date(toDate as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      })

      res.json({ success: true, data: result.logs, pagination: result.pagination })
    } catch (err) {
      next(err)
    }
  }

  async getPartnerLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const partnerId = (req as any).user?.partnerId || (req as any).partner?.partnerId
      if (!partnerId) throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED')

      const { fromDate, toDate, limit, offset } = req.query

      const result = await auditLogService.query({
        actorId: partnerId,
        fromDate: fromDate ? new Date(fromDate as string) : undefined,
        toDate: toDate ? new Date(toDate as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      })

      res.json({ success: true, data: result.logs, pagination: result.pagination })
    } catch (err) {
      next(err)
    }
  }
}

export const auditLogController = new AuditLogController()
