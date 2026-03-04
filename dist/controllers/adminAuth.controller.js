"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminAuthController = void 0;
const adminAuth_service_1 = require("../services/adminAuth.service");
const AppError_1 = require("../utils/AppError");
class AdminAuthController {
    async login(req, res, next) {
        try {
            const { email, password } = req.body || {};
            if (!email || !password)
                throw new AppError_1.AppError(400, 'Email and password required', 'MISSING_FIELDS');
            const result = await adminAuth_service_1.adminAuthService.login(email, password);
            res.json({ success: true, data: result });
        }
        catch (err) {
            next(err);
        }
    }
    async register(req, res, next) {
        try {
            const requester = req.user || req.admin;
            if (!requester || requester.role !== 'SUPER_ADMIN') {
                throw new AppError_1.AppError(403, 'Only super admins can create admins', 'FORBIDDEN');
            }
            const { email, password, name, role } = req.body || {};
            if (!email || !password || !name)
                throw new AppError_1.AppError(400, 'Email, password, and name required', 'MISSING_FIELDS');
            const admin = await adminAuth_service_1.adminAuthService.registerAdmin({ email, password, name, role });
            res.status(201).json({ success: true, data: admin });
        }
        catch (err) {
            next(err);
        }
    }
    async getProfile(req, res, next) {
        try {
            const adminId = req.admin?.adminId || req.user?.adminId;
            if (!adminId)
                throw new AppError_1.AppError(401, 'Unauthorized', 'UNAUTHORIZED');
            const admin = await adminAuth_service_1.adminAuthService.getAdminById(adminId);
            res.json({ success: true, data: admin });
        }
        catch (err) {
            next(err);
        }
    }
    async changePassword(req, res, next) {
        try {
            const { oldPassword, newPassword } = req.body || {};
            const adminId = req.admin?.adminId || req.user?.adminId;
            if (!oldPassword || !newPassword)
                throw new AppError_1.AppError(400, 'Old and new password required', 'MISSING_FIELDS');
            if (newPassword.length < 8)
                throw new AppError_1.AppError(400, 'Password must be at least 8 characters', 'WEAK_PASSWORD');
            await adminAuth_service_1.adminAuthService.changePassword(adminId, oldPassword, newPassword);
            res.json({ success: true, message: 'Password changed successfully' });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.adminAuthController = new AdminAuthController();
