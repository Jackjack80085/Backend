"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLogController = exports.AuditLogController = void 0;
const auditLog_service_1 = require("../services/auditLog.service");
const AppError_1 = require("../utils/AppError");
class AuditLogController {
    async queryLogs(req, res, next) {
        try {
            const { actorId, targetId, action, actorType, fromDate, toDate, limit, offset } = req.query;
            const result = await auditLog_service_1.auditLogService.query({
                actorId: actorId,
                targetId: targetId,
                action: action,
                actorType: actorType,
                fromDate: fromDate ? new Date(fromDate) : undefined,
                toDate: toDate ? new Date(toDate) : undefined,
                limit: limit ? parseInt(limit) : undefined,
                offset: offset ? parseInt(offset) : undefined,
            });
            res.json({ success: true, data: result.logs, pagination: result.pagination });
        }
        catch (err) {
            next(err);
        }
    }
    async getPartnerLogs(req, res, next) {
        try {
            const partnerId = req.user?.partnerId || req.partner?.partnerId;
            if (!partnerId)
                throw new AppError_1.AppError(401, 'Unauthorized', 'UNAUTHORIZED');
            const { fromDate, toDate, limit, offset } = req.query;
            const result = await auditLog_service_1.auditLogService.query({
                actorId: partnerId,
                fromDate: fromDate ? new Date(fromDate) : undefined,
                toDate: toDate ? new Date(toDate) : undefined,
                limit: limit ? parseInt(limit) : undefined,
                offset: offset ? parseInt(offset) : undefined,
            });
            res.json({ success: true, data: result.logs, pagination: result.pagination });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.AuditLogController = AuditLogController;
exports.auditLogController = new AuditLogController();
