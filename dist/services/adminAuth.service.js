"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminAuthService = exports.AdminAuthService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = __importDefault(require("../config/database"));
const AppError_1 = require("../utils/AppError");
const auditLog_service_1 = require("./auditLog.service");
class AdminAuthService {
    constructor() {
        this.JWT_SECRET = process.env.JWT_SECRET || '';
        this.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';
        this.SALT_ROUNDS = 12;
    }
    async registerAdmin(params) {
        const existing = await database_1.default.admin.findUnique({ where: { email: params.email } });
        if (existing)
            throw new AppError_1.AppError(400, 'Admin already exists', 'ADMIN_EXISTS');
        const passwordHash = await bcrypt_1.default.hash(params.password, this.SALT_ROUNDS);
        const admin = await database_1.default.admin.create({
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
        });
        return admin;
    }
    async login(email, password) {
        const admin = await database_1.default.admin.findUnique({ where: { email } });
        if (!admin) {
            try {
                await auditLog_service_1.auditLogService.log({
                    action: 'ADMIN_LOGIN_FAILED',
                    actorType: 'SYSTEM',
                    actorEmail: email,
                    description: 'Failed admin login attempt',
                    metadata: { reason: 'Admin not found' },
                });
            }
            catch (err) {
                console.warn('Failed to write audit log for failed admin login', err);
            }
            throw new AppError_1.AppError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
        }
        if (!admin.isActive)
            throw new AppError_1.AppError(403, 'Admin account is deactivated', 'ACCOUNT_DEACTIVATED');
        const isValidPassword = await bcrypt_1.default.compare(password, admin.passwordHash);
        if (!isValidPassword) {
            try {
                await auditLog_service_1.auditLogService.log({
                    action: 'ADMIN_LOGIN_FAILED',
                    actorType: 'SYSTEM',
                    actorEmail: email,
                    description: 'Failed admin login attempt',
                    metadata: { reason: 'Invalid credentials' },
                });
            }
            catch (err) {
                console.warn('Failed to write audit log for failed admin login', err);
            }
            throw new AppError_1.AppError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
        }
        await database_1.default.admin.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } });
        try {
            await auditLog_service_1.auditLogService.log({
                action: 'ADMIN_LOGIN',
                actorType: 'ADMIN',
                actorId: admin.id,
                actorEmail: admin.email,
                description: 'Admin logged in',
                metadata: { lastLoginAt: new Date() },
            });
        }
        catch (err) {
            console.warn('Failed to write audit log for admin login', err);
        }
        const token = this.generateToken({ adminId: admin.id, email: admin.email, role: admin.role });
        return {
            admin: {
                id: admin.id,
                email: admin.email,
                name: admin.name,
                role: admin.role,
            },
            token,
        };
    }
    verifyToken(token) {
        if (!this.JWT_SECRET)
            throw new AppError_1.AppError(500, 'JWT_SECRET not configured', 'CONFIG_ERROR');
        try {
            const decoded = jsonwebtoken_1.default.verify(token, this.JWT_SECRET);
            return decoded;
        }
        catch (err) {
            throw new AppError_1.AppError(401, 'Invalid or expired token', 'INVALID_TOKEN');
        }
    }
    generateToken(payload) {
        const options = { expiresIn: this.JWT_EXPIRES_IN };
        return jsonwebtoken_1.default.sign(payload, this.JWT_SECRET, options);
    }
    async changePassword(adminId, oldPassword, newPassword) {
        const admin = await database_1.default.admin.findUnique({ where: { id: adminId } });
        if (!admin)
            throw new AppError_1.AppError(404, 'Admin not found', 'ADMIN_NOT_FOUND');
        const isValid = await bcrypt_1.default.compare(oldPassword, admin.passwordHash);
        if (!isValid)
            throw new AppError_1.AppError(401, 'Incorrect current password', 'INVALID_PASSWORD');
        const newPasswordHash = await bcrypt_1.default.hash(newPassword, this.SALT_ROUNDS);
        await database_1.default.admin.update({ where: { id: adminId }, data: { passwordHash: newPasswordHash } });
        return { success: true };
    }
    async getAdminById(adminId) {
        const admin = await database_1.default.admin.findUnique({
            where: { id: adminId },
            select: { id: true, email: true, name: true, role: true, isActive: true, lastLoginAt: true, createdAt: true },
        });
        if (!admin)
            throw new AppError_1.AppError(404, 'Admin not found', 'ADMIN_NOT_FOUND');
        return admin;
    }
}
exports.AdminAuthService = AdminAuthService;
exports.adminAuthService = new AdminAuthService();
