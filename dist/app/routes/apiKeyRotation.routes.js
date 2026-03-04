"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const apiKeyRotation_controller_1 = require("../../controllers/apiKeyRotation.controller");
const requireAdmin_1 = __importDefault(require("../../middlewares/requireAdmin"));
const router = (0, express_1.Router)();
// Partner middleware to verify JWT (sets req.partner)
function requirePartner(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ success: false, message: 'Partner authentication required' });
            return;
        }
        const token = authHeader.substring(7);
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || '');
        req.partner = decoded;
        next();
    }
    catch (err) {
        res.status(401).json({ success: false, message: 'Invalid token' });
    }
}
// Partner routes (require authentication)
router.get('/partner/api-credentials', requirePartner, async (req, res, next) => {
    try {
        const partnerId = req.partner?.partnerId;
        if (!partnerId)
            return res.status(401).json({ success: false, message: 'Partner authentication required' });
        const prisma = require('../../config/database').default;
        const partner = await prisma.partner.findUnique({ where: { id: partnerId } });
        if (!partner)
            return res.status(404).json({ success: false, message: 'Partner not found' });
        res.json({
            success: true,
            data: {
                apiKey: partner.apiKey || '',
                apiKeyVersion: partner.apiKeyVersion || 1,
                apiKeyActiveFrom: partner.apiKeyActiveFrom || new Date().toISOString(),
                webhookUrl: partner.webhookUrl || '',
                commissionRate: partner.commissionRate || 0,
            },
        });
    }
    catch (err) {
        next(err);
    }
});
router.post('/partner/rotate-api-key', requirePartner, apiKeyRotation_controller_1.rotateOwnKey);
router.get('/partner/api-key-history', requirePartner, apiKeyRotation_controller_1.getRotationHistory);
// Admin routes (require admin role)
router.post('/admin/partners/:partnerId/rotate-api-key', requireAdmin_1.default, apiKeyRotation_controller_1.rotatePartnerKey);
router.post('/admin/partners/:partnerId/revoke-api-key', requireAdmin_1.default, apiKeyRotation_controller_1.revokePartnerKey);
router.get('/admin/partners/:partnerId/api-key-history', requireAdmin_1.default, apiKeyRotation_controller_1.getPartnerRotationHistory);
exports.default = router;
