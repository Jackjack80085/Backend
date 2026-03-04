"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authenticatePartner_1 = __importDefault(require("../../middlewares/authenticatePartner"));
const partnerWebhook_service_1 = __importDefault(require("../../services/partnerWebhook.service"));
const requireAdmin_1 = __importDefault(require("../../middlewares/requireAdmin"));
const partnerService_1 = require("../../services/partnerService");
const settlementService_1 = require("../../services/settlementService");
const database_1 = __importDefault(require("../../config/database"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const router = (0, express_1.Router)();
// ---- Admin: create partner ----
/**
 * @swagger
 * /api/v1/partners:
 *   post:
 *     summary: Create a new partner (admin)
 *     tags: [Partners]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [businessName, email]
 *             properties:
 *               businessName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               businessType:
 *                 type: string
 *     responses:
 *       201:
 *         description: Partner created
 */
router.post('/', requireAdmin_1.default, async (req, res, next) => {
    try {
        const partner = await (0, partnerService_1.createPartner)(req.body);
        res.status(201).json({ success: true, data: partner });
    }
    catch (err) {
        next(err);
    }
});
// ---- Admin: issue credentials ----
/**
 * @swagger
 * /api/v1/partners/{partnerId}/credentials:
 *   post:
 *     summary: Issue API credentials for a partner (admin, one-time)
 *     tags: [Partners]
 *     parameters:
 *       - in: path
 *         name: partnerId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Credentials issued (secret shown once)
 */
router.post('/:partnerId/credentials', requireAdmin_1.default, async (req, res, next) => {
    try {
        const creds = await (0, partnerService_1.issueApiCredentials)(req.params.partnerId);
        res.json({ success: true, data: creds });
    }
    catch (err) {
        next(err);
    }
});
// ---- Admin: update partner webhook URL ----
/**
 * @swagger
 * /api/v1/partners/{partnerId}/webhook-url:
 *   put:
 *     summary: Set or update the partner webhook URL (admin)
 *     tags: [Partners]
 *     parameters:
 *       - in: path
 *         name: partnerId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [webhookUrl]
 *             properties:
 *               webhookUrl:
 *                 type: string
 *                 format: uri
 *     responses:
 *       200:
 *         description: Webhook URL updated
 */
router.put('/:partnerId/webhook-url', requireAdmin_1.default, async (req, res, next) => {
    try {
        const { webhookUrl } = req.body;
        if (!webhookUrl)
            return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'webhookUrl required' } });
        const updated = await database_1.default.partner.update({ where: { id: req.params.partnerId }, data: { webhookUrl } });
        res.json({ success: true, data: { partnerId: updated.id, webhookUrl: updated.webhookUrl } });
    }
    catch (err) {
        next(err);
    }
});
// ---- Partner: test webhook ----
/**
 * @swagger
 * /api/v1/partners/webhook/test:
 *   post:
 *     summary: Send a test webhook to partner's configured URL
 *     tags: [Partners]
 *     security:
 *       - ApiKeyAuth: []
 *       - SignatureAuth: []
 *     responses:
 *       200:
 *         description: Test webhook sent
 *       400:
 *         description: No webhook URL configured
 */
router.post('/webhook/test', authenticatePartner_1.default, async (req, res, next) => {
    try {
        const partner = req.partner;
        if (!partner.webhookUrl) {
            return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Webhook URL not configured' } });
        }
        const testPayload = {
            event: 'webhook.test',
            partner_id: partner.id,
            timestamp: new Date().toISOString(),
            message: 'This is a test webhook from Paycher',
        };
        const signature = partnerWebhook_service_1.default.generateSignature(testPayload, partner.apiSecretEncrypted || '');
        await partnerWebhook_service_1.default.deliverWebhook({
            url: partner.webhookUrl,
            payload: testPayload,
            signature,
            partnerId: partner.id,
            transactionId: null,
        });
        res.json({ success: true, message: 'Test webhook sent successfully' });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
// ---- Partner self-service endpoints (JWT based) ----
// JWT-based requirePartner (similar to kyc routes)
function requirePartnerJWT(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ success: false, error: 'Partner authentication required' });
            return;
        }
        const token = authHeader.substring(7);
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || '');
        req.partner = decoded;
        next();
    }
    catch (err) {
        res.status(401).json({ success: false, error: 'Invalid token' });
    }
}
// Get current partner profile
router.get('/partner', requirePartnerJWT, async (req, res, next) => {
    try {
        const partnerId = req.partner?.partnerId;
        if (!partnerId)
            return res.status(401).json({ success: false, error: 'Partner authentication required' });
        const partner = await database_1.default.partner.findUnique({ where: { id: partnerId }, select: { id: true, businessName: true, email: true, phone: true, businessType: true, status: true, kycStatus: true, createdAt: true } });
        res.json({ success: true, data: partner });
    }
    catch (err) {
        next(err);
    }
});
// Update current partner profile
router.patch('/partner', requirePartnerJWT, async (req, res, next) => {
    try {
        const partnerId = req.partner?.partnerId;
        if (!partnerId)
            return res.status(401).json({ success: false, error: 'Partner authentication required' });
        const { businessName, email, phone } = req.body;
        const data = {};
        if (businessName)
            data.businessName = businessName;
        if (email)
            data.email = email;
        if (phone)
            data.phone = phone;
        const updated = await database_1.default.partner.update({ where: { id: partnerId }, data });
        res.json({ success: true, data: { id: updated.id, businessName: updated.businessName, email: updated.email, phone: updated.phone } });
    }
    catch (err) {
        next(err);
    }
});
// (profile image endpoints removed)
// Update webhook URL (partner self-service)
router.patch('/partner/webhook', requirePartnerJWT, async (req, res, next) => {
    try {
        const partnerId = req.partner?.partnerId;
        if (!partnerId)
            return res.status(401).json({ success: false, error: 'Partner authentication required' });
        const { webhookUrl } = req.body;
        if (!webhookUrl)
            return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'webhookUrl required' } });
        // Validate URL
        try {
            new URL(webhookUrl);
        }
        catch {
            return res.status(400).json({ success: false, error: { code: 'INVALID_URL', message: 'Invalid webhook URL format' } });
        }
        const updated = await database_1.default.partner.update({ where: { id: partnerId }, data: { webhookUrl } });
        res.json({ success: true, data: { partnerId: updated.id, webhookUrl: updated.webhookUrl } });
    }
    catch (err) {
        next(err);
    }
});
// Change password (partner)
router.post('/partner/change-password', requirePartnerJWT, async (req, res, next) => {
    try {
        const partnerId = req.partner?.partnerId;
        if (!partnerId)
            return res.status(401).json({ success: false, error: 'Partner authentication required' });
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword)
            return res.status(400).json({ success: false, error: 'Both current and new password are required' });
        const partner = await database_1.default.partner.findUnique({ where: { id: partnerId } });
        if (!partner || !partner.passwordHash)
            return res.status(400).json({ success: false, error: 'No password set for partner' });
        const ok = await bcrypt_1.default.compare(currentPassword, partner.passwordHash);
        if (!ok)
            return res.status(401).json({ success: false, error: 'Current password incorrect' });
        const hash = await bcrypt_1.default.hash(newPassword, 12);
        await database_1.default.partner.update({ where: { id: partnerId }, data: { passwordHash: hash } });
        res.json({ success: true, message: 'Password changed' });
    }
    catch (err) {
        next(err);
    }
});
// ---- Partner: Bank Account Management (JWT) ----
// Get bank account details
router.get('/partner/bank-account', requirePartnerJWT, async (req, res, next) => {
    try {
        const partnerId = req.partner?.partnerId;
        if (!partnerId)
            return res.status(401).json({ success: false, error: 'Partner authentication required' });
        const partner = await database_1.default.partner.findUnique({ where: { id: partnerId }, select: { bankAccount: true, bankAccountVerified: true } });
        if (!partner)
            return res.status(404).json({ success: false, error: 'Partner not found' });
        res.json({ success: true, data: { bankAccount: partner.bankAccount, bankAccountVerified: partner.bankAccountVerified } });
    }
    catch (err) {
        next(err);
    }
});
// Update bank account details
router.patch('/partner/bank-account', requirePartnerJWT, async (req, res, next) => {
    try {
        const partnerId = req.partner?.partnerId;
        if (!partnerId)
            return res.status(401).json({ success: false, error: 'Partner authentication required' });
        const { accountNumber, ifscCode, accountHolderName, bankName, branchName, accountType, upiId } = req.body;
        if (!accountNumber || !ifscCode || !accountHolderName || !bankName) {
            return res.status(400).json({ success: false, error: 'accountNumber, ifscCode, accountHolderName, and bankName are required' });
        }
        if (accountType && !['SAVINGS', 'CURRENT'].includes(accountType)) {
            return res.status(400).json({ success: false, error: 'accountType must be SAVINGS or CURRENT' });
        }
        const bankAccount = { accountNumber, ifscCode, accountHolderName, bankName, branchName: branchName || '', accountType: accountType || 'SAVINGS', upiId: upiId || '' };
        const updated = await database_1.default.partner.update({
            where: { id: partnerId },
            data: { bankAccount, bankAccountVerified: true },
            select: { bankAccount: true, bankAccountVerified: true }
        });
        res.json({ success: true, data: { bankAccount: updated.bankAccount, bankAccountVerified: updated.bankAccountVerified } });
    }
    catch (err) {
        next(err);
    }
});
// ---- Partner: Settlement Endpoints (JWT) ----
// Request a settlement (JWT-based for dashboard)
router.post('/partner/settlements/request', requirePartnerJWT, async (req, res, next) => {
    try {
        const partnerId = req.partner?.partnerId;
        if (!partnerId)
            return res.status(401).json({ success: false, error: 'Partner authentication required' });
        const partner = await database_1.default.partner.findUnique({ where: { id: partnerId } });
        if (!partner)
            return res.status(404).json({ success: false, error: 'Partner not found' });
        const { amount, reason } = req.body;
        if (!amount || amount <= 0)
            return res.status(400).json({ success: false, error: 'Valid amount is required' });
        console.log('[Settlement] Creating settlement:', { partnerId, amount, kycStatus: partner.kycStatus, isActive: partner.isActive });
        const result = await (0, settlementService_1.createSettlement)(partner, amount, reason ? { reason } : undefined);
        res.json(result);
    }
    catch (err) {
        console.error('[Settlement] Error:', err.message, err.status || err.statusCode);
        if (err.status || err.statusCode)
            return res.status(err.status || err.statusCode).json({ success: false, error: err.message });
        next(err);
    }
});
// List partner's own settlements (JWT-based)
router.get('/partner/settlements', requirePartnerJWT, async (req, res, next) => {
    try {
        const partnerId = req.partner?.partnerId;
        if (!partnerId)
            return res.status(401).json({ success: false, error: 'Partner authentication required' });
        const filters = { partnerId };
        if (req.query.status)
            filters.status = req.query.status;
        const page = parseInt(req.query.page || '1', 10);
        const per = parseInt(req.query.per || '20', 10);
        const [items, total] = await Promise.all([
            database_1.default.settlement.findMany({
                where: filters,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * per,
                take: per,
                select: {
                    id: true, amount: true, fee: true, netAmount: true, totalDeducted: true,
                    status: true, bankAccountSnapshot: true, bankReferenceId: true,
                    failureReason: true, initiatedAt: true, processedAt: true, completedAt: true,
                    createdAt: true, metadata: true
                }
            }),
            database_1.default.settlement.count({ where: filters })
        ]);
        // Parse Decimal fields
        const data = items.map((s) => ({
            ...s,
            amount: parseFloat(s.amount?.toString() || '0'),
            fee: parseFloat(s.fee?.toString() || '0'),
            netAmount: parseFloat(s.netAmount?.toString() || '0'),
            totalDeducted: parseFloat(s.totalDeducted?.toString() || '0'),
        }));
        res.json({ success: true, data, total, page, per });
    }
    catch (err) {
        next(err);
    }
});
