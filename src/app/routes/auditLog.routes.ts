import { Router } from 'express'
import { auditLogController } from '../../controllers/auditLog.controller'
import requireAdmin from '../../middlewares/requireAdmin'
import { requireAuth } from '../../middlewares/requireAuth'

const router = Router()

// Admin: query logs
router.get('/admin/audit-logs', requireAdmin, auditLogController.queryLogs.bind(auditLogController))

// Partner: own logs
router.get('/partner/audit-logs', requireAuth, auditLogController.getPartnerLogs.bind(auditLogController))

export default router
