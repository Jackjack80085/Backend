"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const crypto_1 = __importDefault(require("crypto"));
const database_1 = __importDefault(require("../../config/database"));
const router = (0, express_1.Router)();
/**
 * POST /webhooks/paywise-settlement
 *
 * Called by Paywise when they settle funds to Paycher's bank account.
 * Verifies HMAC signature, then records a CREDIT on the platform wallet
 * with reason ADJUSTMENT so it appears in the platform ledger.
 *
 * Expected body (fields may vary by Paywise version):
 * {
 *   settlementId: string           // Paywise's settlement reference
 *   amount: number | string        // Amount settled in INR
 *   bankReferenceId?: string       // UTR / NEFT reference
 *   settledAt?: string | number    // ISO date or epoch
 *   status?: string                // "SUCCESS" | "SETTLED" etc.
 *   signature?: string             // HMAC-SHA256 of raw body
 * }
 */
router.post('/', async (req, res) => {
    try {
        // 1. Verify HMAC signature
        const webhookSecret = process.env.PAYWIZE_WEBHOOK_SECRET || '';
        const rawSignature = (req.header('X-Paywise-Signature') ||
            req.header('X-Signature') ||
            req.header('x-paywise-signature') ||
            req.body?.signature ||
            '')
            .toString()
            .replace(/^(sha256=|hmac-sha256=)/i, '');
        if (webhookSecret && rawSignature) {
            const expected = crypto_1.default
                .createHmac('sha256', webhookSecret)
                .update(JSON.stringify(req.body))
                .digest('hex');
            if (!crypto_1.default.timingSafeEqual(Buffer.from(expected), Buffer.from(rawSignature.padEnd(expected.length, ' ').slice(0, expected.length)))) {
                console.warn('[paywise-settlement webhook] Invalid signature');
                return res.status(401).json({ error: 'Invalid signature' });
            }
        }
        else if (webhookSecret && !rawSignature) {
            console.warn('[paywise-settlement webhook] Missing signature header');
            return res.status(401).json({ error: 'Missing signature' });
        }
        // 2. Extract fields
        const body = req.body || {};
        const paywiseSettlementId = body.settlementId || body.settlement_id || body.txnId || body.referenceId || null;
        if (!paywiseSettlementId) {
            console.warn('[paywise-settlement webhook] Missing settlementId');
            return res.status(400).json({ error: 'Missing settlementId' });
        }
        const rawAmount = body.amount ?? body.netAmount ?? body.settledAmount ?? 0;
        const amount = typeof rawAmount === 'string' ? parseFloat(rawAmount) : Number(rawAmount);
        if (!amount || amount <= 0) {
            console.warn('[paywise-settlement webhook] Invalid amount', amount);
            return res.status(400).json({ error: 'Invalid amount' });
        }
        const bankReferenceId = body.bankReferenceId || body.utrNumber || body.bankRef || body.neftRef || '';
        const settledAt = body.settledAt
            ? isNaN(Number(body.settledAt))
                ? new Date(body.settledAt)
                : new Date(Number(body.settledAt) * 1000)
            : new Date();
        const status = (body.status || 'SETTLED').toUpperCase();
        // 3. Idempotency: check if already recorded
        const existing = await database_1.default.walletTransaction.findFirst({
            where: {
                paywiseTxnId: `pws_${paywiseSettlementId}`,
            },
        });
        if (existing) {
            console.info('[paywise-settlement webhook] Already recorded', { paywiseSettlementId });
            return res.status(200).json({ received: true });
        }
        // 4. Find platform wallet
        const platformWallet = await database_1.default.wallet.findFirst({ where: { type: 'PLATFORM' } });
        if (!platformWallet) {
            console.error('[paywise-settlement webhook] Platform wallet not found');
            return res.status(500).json({ error: 'Platform wallet not found' });
        }
        // 5. Record as CREDIT on platform wallet (atomic)
        await database_1.default.$transaction(async (tx) => {
            // Create ledger entry
            await tx.walletTransaction.create({
                data: {
                    walletId: platformWallet.id,
                    amount,
                    type: 'CREDIT',
                    reason: 'ADJUSTMENT',
                    paywiseTxnId: `pws_${paywiseSettlementId}`,
                    description: `Paywise bank settlement — ${bankReferenceId ? `UTR: ${bankReferenceId}` : paywiseSettlementId}`,
                },
            });
            // Update platform wallet balance
            const newBalance = parseFloat(platformWallet.balance.toString()) + amount;
            await tx.wallet.update({
                where: { id: platformWallet.id },
                data: { balance: newBalance },
            });
        });
        console.info('[paywise-settlement webhook] Recorded', {
            paywiseSettlementId,
            amount,
            bankReferenceId,
            settledAt: settledAt.toISOString(),
        });
        return res.status(200).json({ received: true });
    }
    catch (err) {
        console.error('[paywise-settlement webhook] Error', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
