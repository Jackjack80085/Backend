"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.partnerInvitationService = exports.PartnerInvitationService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const database_1 = __importDefault(require("../config/database"));
const AppError_1 = require("../utils/AppError");
const bcrypt_1 = __importDefault(require("bcrypt"));
const email_service_1 = require("./email.service");
const auditLog_service_1 = require("./auditLog.service");
class PartnerInvitationService {
    async invitePartner(params) {
        const existing = await database_1.default.partner.findUnique({ where: { email: params.email } });
        if (existing)
            throw new AppError_1.AppError(400, 'Partner with this email already exists', 'PARTNER_EXISTS');
        const inviteToken = crypto_1.default.randomBytes(32).toString('hex');
        const inviteExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const partner = await database_1.default.partner.create({
            data: {
                businessName: params.businessName,
                email: params.email,
                phone: params.phone,
                businessType: params.businessType,
                status: 'INVITED',
                kycStatus: 'PENDING',
                inviteToken,
                inviteExpiresAt,
                invitedBy: params.invitedBy,
                invitedAt: new Date(),
            },
        });
        await database_1.default.wallet.create({
            data: {
                partnerId: partner.id,
                type: 'PARTNER',
                balance: 0,
                currency: 'INR',
            },
        });
        const inviteLink = `${process.env.APP_URL}/onboarding/invite/${inviteToken}`;
        // Send invitation email (development logs or actual send depending on env)
        try {
            await email_service_1.emailService.sendPartnerInvitation({
                email: params.email,
                businessName: params.businessName,
                inviteLink,
                expiresAt: inviteExpiresAt,
            });
        }
        catch (err) {
            console.warn('Failed to send partner invitation email', err);
        }
        // Audit log
        try {
            await auditLog_service_1.auditLogService.log({
                action: 'PARTNER_INVITED',
                actorType: 'ADMIN',
                actorId: params.invitedBy,
                targetType: 'PARTNER',
                targetId: partner.id,
                description: `Invited ${params.businessName}`,
                metadata: { email: params.email },
            });
        }
        catch (err) {
            console.warn('Failed to create audit log for partner invitation', err);
        }
        return { partner, inviteLink, expiresAt: inviteExpiresAt };
    }
    async verifyInviteToken(token) {
        const partner = await database_1.default.partner.findUnique({ where: { inviteToken: token } });
        if (!partner)
            throw new AppError_1.AppError(404, 'Invalid invitation link', 'INVALID_INVITE');
        if (partner.status !== 'INVITED')
            throw new AppError_1.AppError(400, 'Invitation already used', 'INVITE_USED');
        if (partner.inviteExpiresAt && partner.inviteExpiresAt < new Date())
            throw new AppError_1.AppError(400, 'Invitation expired', 'INVITE_EXPIRED');
        return partner;
    }
    async completeRegistration(params) {
        const partner = await this.verifyInviteToken(params.token);
        const passwordHash = await bcrypt_1.default.hash(params.password, 12);
        const updated = await database_1.default.partner.update({
            where: { id: partner.id },
            data: {
                passwordHash,
                phone: params.phone || partner.phone,
                status: 'REGISTERED',
                isActive: true,
                registeredAt: new Date(),
                inviteToken: null,
                inviteExpiresAt: null,
            },
        });
        // Audit: partner completed registration
        try {
            await auditLog_service_1.auditLogService.log({
                action: 'PARTNER_REGISTERED',
                actorType: 'PARTNER',
                actorId: updated.id,
                actorEmail: updated.email,
                targetType: 'PARTNER',
                targetId: updated.id,
                description: `Partner completed registration: ${updated.businessName}`,
                metadata: { registeredAt: new Date() },
            });
        }
        catch (err) {
            console.warn('Failed to write audit log for partner registration', err);
        }
        return {
            partnerId: updated.id,
            email: updated.email,
            businessName: updated.businessName,
        };
    }
}
exports.PartnerInvitationService = PartnerInvitationService;
exports.partnerInvitationService = new PartnerInvitationService();
