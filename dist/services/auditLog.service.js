"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLogService = exports.AuditLogService = void 0;
const database_1 = __importDefault(require("../config/database"));
class AuditLogService {
    async log(params) {
        try {
            await database_1.default.auditLog.create({
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
            });
            console.log(`[AUDIT] ${params.action} by ${params.actorType}:${params.actorId || 'system'}`);
        }
        catch (error) {
            console.error('[AUDIT] Failed to log:', error);
        }
    }
    async query(filters) {
        const where = {};
        if (filters.actorId)
            where.actorId = filters.actorId;
        if (filters.targetId)
            where.targetId = filters.targetId;
        if (filters.action)
            where.action = filters.action;
        if (filters.actorType)
            where.actorType = filters.actorType;
        if (filters.fromDate || filters.toDate) {
            where.createdAt = {};
            if (filters.fromDate)
                where.createdAt.gte = filters.fromDate;
            if (filters.toDate)
                where.createdAt.lte = filters.toDate;
        }
        const [logs, total] = await Promise.all([
            database_1.default.auditLog.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: filters.limit || 50,
                skip: filters.offset || 0,
            }),
            database_1.default.auditLog.count({ where }),
        ]);
        return {
            logs,
            pagination: { total, limit: filters.limit || 50, offset: filters.offset || 0 },
        };
    }
}
exports.AuditLogService = AuditLogService;
exports.auditLogService = new AuditLogService();
