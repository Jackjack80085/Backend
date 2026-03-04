"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.partnerInvitationController = exports.PartnerInvitationController = void 0;
const partnerInvitation_service_1 = require("../services/partnerInvitation.service");
const AppError_1 = require("../utils/AppError");
class PartnerInvitationController {
    async invitePartner(req, res, next) {
        try {
            const { businessName, email, phone, businessType } = req.body;
            const adminId = req.admin?.adminId || req.user?.adminId;
            if (!businessName || !email)
                throw new AppError_1.AppError(400, 'Business name and email required', 'MISSING_FIELDS');
            const result = await partnerInvitation_service_1.partnerInvitationService.invitePartner({
                businessName,
                email,
                phone,
                businessType,
                invitedBy: adminId,
            });
            res.status(201).json({
                success: true,
                data: {
                    partnerId: result.partner.id,
                    email: result.partner.email,
                    inviteLink: result.inviteLink,
                    expiresAt: result.expiresAt,
                },
            });
        }
        catch (err) {
            next(err);
        }
    }
    async verifyInvite(req, res, next) {
        try {
            const { token } = req.params;
            const partner = await partnerInvitation_service_1.partnerInvitationService.verifyInviteToken(token);
            res.json({
                success: true,
                data: {
                    businessName: partner.businessName,
                    email: partner.email,
                    phone: partner.phone,
                },
            });
        }
        catch (err) {
            next(err);
        }
    }
    async completeRegistration(req, res, next) {
        try {
            const { token, password, phone } = req.body;
            if (!token || !password)
                throw new AppError_1.AppError(400, 'Token and password required', 'MISSING_FIELDS');
            if (password.length < 8)
                throw new AppError_1.AppError(400, 'Password must be at least 8 characters', 'WEAK_PASSWORD');
            const result = await partnerInvitation_service_1.partnerInvitationService.completeRegistration({ token, password, phone });
            res.json({
                success: true,
                data: result,
                message: 'Registration completed successfully. Please upload KYC documents.',
            });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.PartnerInvitationController = PartnerInvitationController;
exports.partnerInvitationController = new PartnerInvitationController();
