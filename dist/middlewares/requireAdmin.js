"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = requireAdmin;
exports.requireSuperAdmin = requireSuperAdmin;
const adminAuth_service_1 = require("../services/adminAuth.service");
const AppError_1 = require("../utils/AppError");
/**
 * requireAdmin: verifies Bearer JWT and attaches admin payload to request
 */
function requireAdmin(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new AppError_1.AppError(401, 'Admin authentication required', 'UNAUTHORIZED');
        }
        const token = authHeader.substring(7);
        const decoded = adminAuth_service_1.adminAuthService.verifyToken(token);
        req.admin = decoded;
        req.user = decoded;
        next();
    }
    catch (err) {
        next(err);
    }
}
function requireSuperAdmin(req, res, next) {
    try {
        const admin = req.admin || req.user;
        if (!admin || admin.role !== 'SUPER_ADMIN') {
            throw new AppError_1.AppError(403, 'Super admin access required', 'FORBIDDEN');
        }
        next();
    }
    catch (err) {
        next(err);
    }
}
