"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTransaction = createTransaction;
const database_1 = __importDefault(require("../config/database"));
const errors_1 = require("../utils/errors");
const config_1 = __importDefault(require("../config"));
const paywise_service_1 = require("./paywise.service");
const paywiseService = new paywise_service_1.PaywiseService();
const auditLog_service_1 = require("./auditLog.service");
function isValidUUID(uuid) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid);
}
async function createTransaction(input) {
    const { partner, amount, paymentMethod, userReference, idempotencyKey, metadata, callbackUrl, ipAddress, userAgent } = input;
    // Partner validation
    if (!partner.isActive)
        throw new errors_1.ForbiddenError('Partner is not active');
    if (partner.kycStatus !== 'APPROVED')
        throw new errors_1.ForbiddenError('Partner KYC not approved');
    // Amount validation
    if (typeof amount !== 'number' || Number.isNaN(amount) || amount <= 0)
        throw new errors_1.BadRequestError('Amount must be > 0');
    if (amount > config_1.default.MAX_TRANSACTION_AMOUNT)
        throw new errors_1.BadRequestError('Amount exceeds maximum allowed');
    // idempotencyKey
    if (!idempotencyKey || !isValidUUID(idempotencyKey))
        throw new errors_1.BadRequestError('Invalid idempotencyKey');
    // userReference length
    if (typeof userReference !== 'string' || userReference.length === 0 || userReference.length > 512)
        throw new errors_1.BadRequestError('Invalid userReference');
    // Idempotency check
    const existing = await database_1.default.transaction.findFirst({ where: { partnerId: partner.id, idempotencyKey } });
    if (existing) {
        // idempotent response
        console.debug('Idempotent transaction request', { partnerId: partner.id, transactionId: existing.id });
        const expiresAt = existing.expiresAt;
        const now = new Date();
        const expiresInSeconds = expiresAt ? Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000)) : 0;
        return {
            success: true,
            data: {
                transactionId: existing.id,
                paymentUrl: existing.paymentUrl,
                amount: parseFloat(existing.amount.toString()),
                commission: parseFloat(existing.commission.toString()),
                netAmount: parseFloat(existing.netAmount.toString()),
                status: existing.status,
                expiresAt,
                expiresInSeconds,
            },
        };
    }
    // Commission calculation
    const commissionRate = partner.commissionRate ? parseFloat(partner.commissionRate.toString()) : 0;
    const commission = parseFloat((Math.round((amount * (commissionRate / 100)) * 100) / 100).toFixed(2));
    const netAmount = parseFloat((amount - commission).toFixed(2));
    if (!isFinite(commission) || !isFinite(netAmount))
        throw new Error('Commission calculation failed');
    // Create transaction
    const now = new Date();
    const expiresAt = new Date(now.getTime() + config_1.default.TRANSACTION_EXPIRES_MINUTES * 60 * 1000);
    const created = await database_1.default.transaction.create({
        data: {
            partnerId: partner.id,
            amount: amount.toFixed(2),
            commission: commission.toFixed(2),
            netAmount: netAmount.toFixed(2),
            paymentMethod,
            status: 'PENDING',
            userReference,
            idempotencyKey,
            metadata,
            expiresAt,
            ipAddress,
            userAgent,
            callbackUrl,
        },
    });
    // ---- Call Paywise to create payment session ----
    let paymentUrl;
    let paywiseSessionId = null;
    let paywiseExpiresAt = expiresAt;
    let qrCode = null;
    let upiIntent = null;
    try {
        const paywiseResult = await paywiseService.initiateCollection({
            transactionId: created.id,
            amount,
            userEmail: input.customerEmail,
            userPhone: input.customerPhone,
            callbackUrl: callbackUrl,
        });
        paymentUrl = paywiseResult.paymentUrl || paywiseResult.upiIntent || '';
        paywiseSessionId = paywiseResult.paywiseTransactionId || null;
        qrCode = paywiseResult.qrCode || null;
        upiIntent = paywiseResult.upiIntent || null;
    }
    catch (err) {
        // Paywise unavailable (sandbox / no credentials) — keep transaction PENDING
        // so dev simulate endpoints (/dev/complete-payment, /dev/fail-payment) still work
        console.warn('[createTransaction] Paywise call failed, using fallback (sandbox mode)', err?.message);
        paymentUrl = `${process.env.APP_URL || 'http://localhost:5000'}/pay?txn=${created.id}`;
    }
    console.log('[createTransaction] updating txn', created.id, 'paymentUrl:', paymentUrl, 'paywiseSessionId:', paywiseSessionId);
    // Update transaction with Paywise details
    await database_1.default.transaction.update({
        where: { id: created.id },
        data: {
            paymentUrl,
            paywiseSessionId,
            expiresAt: paywiseExpiresAt,
            metadata: {
                ...(created.metadata ?? {}),
                paywizeQrCode: qrCode || undefined,
                paywizeUpiIntent: upiIntent || undefined,
            },
        },
    });
    // Audit: payment initiated
    try {
        await auditLog_service_1.auditLogService.log({
            action: 'PAYMENT_INITIATED',
            actorType: 'PARTNER',
            actorId: partner.id,
            targetType: 'TRANSACTION',
            targetId: created.id,
            description: `Payment initiated: ₹${amount}`,
            metadata: { amount, commission: parseFloat(created.commission.toString()), paymentMethod },
        });
    }
    catch (err) {
        console.warn('Failed to write audit log for payment initiated', err);
    }
    const expiresInSeconds = Math.max(0, Math.floor((paywiseExpiresAt.getTime() - Date.now()) / 1000));
    return {
        success: true,
        data: {
            transactionId: created.id,
            paymentUrl,
            amount: parseFloat(created.amount.toString()),
            commission: parseFloat(created.commission.toString()),
            netAmount: parseFloat(created.netAmount.toString()),
            status: created.status,
            expiresAt: paywiseExpiresAt,
            expiresInSeconds,
        },
    };
}
