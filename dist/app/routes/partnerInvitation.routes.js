"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const partnerInvitation_controller_1 = require("../../controllers/partnerInvitation.controller");
const requireAdmin_1 = __importDefault(require("../../middlewares/requireAdmin"));
const database_1 = __importDefault(require("../../config/database"));
const router = (0, express_1.Router)();
router.post('/admin/partners/invite', requireAdmin_1.default, (req, res, next) => partnerInvitation_controller_1.partnerInvitationController.invitePartner(req, res, next));
// ---- Admin: list partners ----
router.get('/admin/partners', requireAdmin_1.default, async (req, res, next) => {
    try {
        const partners = await database_1.default.partner.findMany({ orderBy: { createdAt: 'desc' } });
        res.json({ success: true, data: partners });
    }
    catch (err) {
        next(err);
    }
});
router.get('/onboarding/verify-invite/:token', (req, res, next) => partnerInvitation_controller_1.partnerInvitationController.verifyInvite(req, res, next));
router.post('/onboarding/complete-registration', (req, res, next) => partnerInvitation_controller_1.partnerInvitationController.completeRegistration(req, res, next));
exports.default = router;
