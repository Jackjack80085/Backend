"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const paywise_1 = __importDefault(require("./webhooks/paywise"));
const paywise_settlement_1 = __importDefault(require("./webhooks/paywise-settlement"));
const partner_1 = __importDefault(require("./reports/partner"));
const admin_1 = __importDefault(require("./reports/admin"));
const payment_routes_1 = __importDefault(require("./routes/payment.routes"));
const settlement_routes_1 = __importDefault(require("./routes/settlement.routes"));
const partner_routes_1 = __importDefault(require("./routes/partner.routes"));
const adminAuth_routes_1 = __importDefault(require("./routes/adminAuth.routes"));
const partnerInvitation_routes_1 = __importDefault(require("./routes/partnerInvitation.routes"));
const kycDocument_routes_1 = __importDefault(require("./routes/kycDocument.routes"));
const partnerAuth_routes_1 = __importDefault(require("./routes/partnerAuth.routes"));
const apiKeyRotation_routes_1 = __importDefault(require("./routes/apiKeyRotation.routes"));
const auditLog_routes_1 = __importDefault(require("./routes/auditLog.routes"));
const payment_service_1 = require("../services/payment.service");
const database_1 = __importDefault(require("../config/database"));
const router = (0, express_1.Router)();
router.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});
// Webhooks (no auth – Paywise handles signature)
router.use('/webhooks/paywise', paywise_1.default);
router.use('/webhooks/paywise-settlement', paywise_settlement_1.default);
// API v1 routes
router.use('/api/v1/payments', payment_routes_1.default);
router.use('/api/v1/settlements', settlement_routes_1.default);
router.use('/api/v1/partners', partner_routes_1.default);
router.use('/api/v1', partnerInvitation_routes_1.default);
router.use('/api/v1', kycDocument_routes_1.default);
router.use('/api/v1', apiKeyRotation_routes_1.default);
router.use('/api/v1', auditLog_routes_1.default);
// Admin auth routes (login / register)
router.use('/auth/admin', adminAuth_routes_1.default);
router.use('/auth/partner', partnerAuth_routes_1.default);
// Report routes
router.use('/partner/reports', partner_1.default);
router.use('/admin/reports', admin_1.default);
// ---- DEV ONLY: mock payment completion ----
router.post('/dev/complete-payment/:id', async (req, res) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const txn = await database_1.default.transaction.findUnique({ where: { id } });
        if (!txn)
            return res.status(404).json({ error: 'Transaction not found' });
        if (txn.status !== 'PENDING')
            return res.status(400).json({ error: `Transaction is already ${txn.status}` });
        await (0, payment_service_1.completePayment)({
            transactionId: id,
            paywiseTxnId: `mock_complete_${Date.now()}`,
            paymentMethod: 'UPI',
            completedAt: new Date(),
        });
        res.json({ success: true, message: 'Payment marked as SUCCESS', transactionId: txn.id });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.post('/dev/fail-payment/:id', async (req, res) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const txn = await database_1.default.transaction.findUnique({ where: { id } });
        if (!txn)
            return res.status(404).json({ error: 'Transaction not found' });
        if (txn.status !== 'PENDING')
            return res.status(400).json({ error: `Transaction is already ${txn.status}` });
        await (0, payment_service_1.failPayment)({ transactionId: id, failureReason: 'Manually failed (dev)' });
        res.json({ success: true, message: 'Payment marked as FAILED', transactionId: txn.id });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
exports.default = router;
