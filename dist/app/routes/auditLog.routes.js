"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auditLog_controller_1 = require("../../controllers/auditLog.controller");
const requireAdmin_1 = __importDefault(require("../../middlewares/requireAdmin"));
const requireAuth_1 = require("../../middlewares/requireAuth");
const router = (0, express_1.Router)();
// Admin: query logs
router.get('/admin/audit-logs', requireAdmin_1.default, auditLog_controller_1.auditLogController.queryLogs.bind(auditLog_controller_1.auditLogController));
// Partner: own logs
router.get('/partner/audit-logs', requireAuth_1.requireAuth, auditLog_controller_1.auditLogController.getPartnerLogs.bind(auditLog_controller_1.auditLogController));
exports.default = router;
