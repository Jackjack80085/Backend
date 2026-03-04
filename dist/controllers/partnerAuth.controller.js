"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.partnerAuthController = exports.PartnerAuthController = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = __importDefault(require("../config/database"));
const AppError_1 = require("../utils/AppError");
const auditLog_service_1 = require("../services/auditLog.service");
class PartnerAuthController {
    async login(req, res, next) {
        try {
            const { email, password } = req.body;
            if (!email || !password)
                throw new AppError_1.AppError(400, 'Email and password required', 'MISSING_FIELDS');
            const partner = await database_1.default.partner.findUnique({ where: { email } });
            if (!partner || !partner.passwordHash)
                throw new AppError_1.AppError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
            const isValid = await bcrypt_1.default.compare(password, partner.passwordHash);
            if (!isValid) {
                // Log failed partner login
                try {
                    await auditLog_service_1.auditLogService.log({
                        action: 'PARTNER_LOGIN_FAILED',
                        actorType: 'SYSTEM',
                        actorEmail: email,
                        description: 'Failed partner login attempt',
                        ipAddress: req.ip,
                        userAgent: req.headers['user-agent'],
                        metadata: { reason: 'Invalid credentials' },
                    });
                }
                catch (err) {
                    console.warn('Failed to write audit log for partner failed login', err);
                }
                throw new AppError_1.AppError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
            }
            if (!partner.isActive && partner.status !== 'ACTIVE')
                throw new AppError_1.AppError(403, 'Account is not active', 'ACCOUNT_INACTIVE');
            const token = jsonwebtoken_1.default.sign({
                partnerId: partner.id,
                email: partner.email,
                status: partner.status,
            }, process.env.JWT_SECRET || '', { expiresIn: '8h' });
            res.json({
                success: true,
                data: {
                    partner: {
                        id: partner.id,
                        email: partner.email,
                        businessName: partner.businessName,
                        status: partner.status,
                        kycStatus: partner.kycStatus,
                    },
                    token,
                },
            });
            // Audit: successful partner login
            try {
                await auditLog_service_1.auditLogService.log({
                    action: 'PARTNER_LOGIN',
                    actorType: 'PARTNER',
                    actorId: partner.id,
                    actorEmail: partner.email,
                    description: 'Partner logged in',
                    ipAddress: req.ip,
                    userAgent: req.headers['user-agent'],
                });
            }
            catch (err) {
                console.warn('Failed to write audit log for partner login', err);
            }
        }
        catch (err) {
            next(err);
        }
    }
}
exports.PartnerAuthController = PartnerAuthController;
exports.partnerAuthController = new PartnerAuthController();
