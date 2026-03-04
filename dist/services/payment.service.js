"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.completePayment = completePayment;
exports.failPayment = failPayment;
const database_1 = __importDefault(require("../config/database"));
const AppError_1 = require("../utils/AppError");
const auditLog_service_1 = require("./auditLog.service");
// ---- completePayment ----
async function completePayment(params) {
    return await database_1.default.$transaction(async (tx) => {
        // 1. Update transaction → SUCCESS
        const transaction = await tx.transaction.update({
            where: { id: params.transactionId },
            data: {
                status: 'SUCCESS',
                paymentMethod: params.paymentMethod || undefined,
                paywiseTxnId: params.paywiseTxnId,
                completedAt: params.completedAt,
            },
        });
        // 2. Get partner wallet
        const partnerWallet = await tx.wallet.findFirst({ where: { partnerId: transaction.partnerId } });
        if (!partnerWallet)
            throw new AppError_1.AppError(500, 'Partner wallet not found', AppError_1.ErrorCodes.WALLET_NOT_FOUND);
        // 3. Get platform wallet
        const platformWallet = await tx.wallet.findFirst({ where: { type: 'PLATFORM' } });
        if (!platformWallet)
            throw new AppError_1.AppError(500, 'Platform wallet not configured', AppError_1.ErrorCodes.PLATFORM_WALLET_MISSING);
        // 4. Credit partner wallet (net amount)
        await tx.walletTransaction.create({
            data: {
                walletId: partnerWallet.id,
                type: 'CREDIT',
                amount: transaction.netAmount,
                reason: 'PAYMENT',
                relatedTransactionId: transaction.id,
                paywiseTxnId: params.paywiseTxnId,
                description: `Payment received – ${transaction.id}`,
            },
        });
        await tx.wallet.update({
            where: { id: partnerWallet.id },
            data: { balance: { increment: transaction.netAmount } },
        });
        // 5. Credit platform commission
        await tx.walletTransaction.create({
            data: {
                walletId: platformWallet.id,
                type: 'CREDIT',
                amount: transaction.commission,
                reason: 'COMMISSION',
                relatedTransactionId: transaction.id,
                paywiseTxnId: `${params.paywiseTxnId}_commission`,
                description: `Commission earned – ${transaction.id}`,
            },
        });
        await tx.wallet.update({
            where: { id: platformWallet.id },
            data: { balance: { increment: transaction.commission } },
        });
        return transaction;
    })
        .then(async (tx) => {
        // Audit: payment completed
        try {
            await auditLog_service_1.auditLogService.log({
                action: 'PAYMENT_COMPLETED',
                actorType: 'SYSTEM',
                targetType: 'TRANSACTION',
                targetId: tx.id,
                description: `Payment completed: ₹${tx.amount}`,
                metadata: { paywiseTxnId: tx.paywiseTxnId, netAmount: tx.netAmount, commission: tx.commission },
            });
        }
        catch (err) {
            console.warn('Failed to write audit log for payment completed', err);
        }
        return tx;
    });
}
// ---- failPayment ----
async function failPayment(params) {
    await database_1.default.transaction.update({
        where: { id: params.transactionId },
        data: {
            status: 'FAILED',
            failureReason: params.failureReason,
            completedAt: new Date(),
        },
    });
    try {
        await auditLog_service_1.auditLogService.log({
            action: 'PAYMENT_FAILED',
            actorType: 'SYSTEM',
            targetType: 'TRANSACTION',
            targetId: params.transactionId,
            description: `Payment failed: ${params.failureReason}`,
            metadata: { failureReason: params.failureReason },
        });
    }
    catch (err) {
        console.warn('Failed to write audit log for payment failed', err);
    }
}
