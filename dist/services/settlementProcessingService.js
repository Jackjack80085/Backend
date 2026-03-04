"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.markSettlementAsProcessing = markSettlementAsProcessing;
exports.completeSettlement = completeSettlement;
const database_1 = __importDefault(require("../config/database"));
const errors_1 = require("../utils/errors");
const email_service_1 = require("./email.service");
const auditLog_service_1 = require("./auditLog.service");
function ensureAdmin(user) {
    if (!user)
        throw new errors_1.ForbiddenError('Admin access required');
    const role = (user.role || '').toUpperCase();
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN')
        throw new errors_1.ForbiddenError('Admin access required');
}
function getAdminId(user) {
    return user.adminId || user.id || 'unknown';
}
function auditLog(settlementId, adminId, previousStatus, newStatus) {
    console.info(JSON.stringify({ action: 'SETTLEMENT_STATUS_CHANGE', settlementId, adminId, previousStatus, newStatus, timestamp: new Date().toISOString() }));
}
function notifyPartner(payload) {
    console.info('notifyPartner stub', payload);
}
async function markSettlementAsProcessing(settlementId, admin) {
    ensureAdmin(admin);
    const settlement = await database_1.default.settlement.findUnique({ where: { id: settlementId } });
    if (!settlement)
        throw new errors_1.BadRequestError('Settlement not found');
    if (settlement.status === 'PROCESSING' || settlement.status === 'COMPLETED' || settlement.status === 'FAILED') {
        // idempotent safe return
        return {
            success: true,
            data: {
                settlementId: settlement.id,
                status: settlement.status,
                processedAt: settlement.processedAt || settlement.updatedAt,
                amount: parseFloat(settlement.amount.toString()),
            },
        };
    }
    if (settlement.status !== 'PENDING')
        throw new errors_1.BadRequestError('Settlement not in PENDING state');
    // Partner checks
    const partner = await database_1.default.partner.findUnique({ where: { id: settlement.partnerId } });
    if (!partner)
        throw new errors_1.BadRequestError('Partner not found');
    if (!partner.isActive)
        throw new errors_1.ForbiddenError('Partner inactive');
    // Settlement age <= 72 hours
    const ageMs = Date.now() - new Date(settlement.createdAt).getTime();
    if (ageMs > 72 * 60 * 60 * 1000)
        throw new errors_1.BadRequestError('Settlement expired');
    // Do the update in a transaction for atomicity and audit
    const updated = await database_1.default.$transaction(async (tx) => {
        const s = await tx.settlement.update({ where: { id: settlementId }, data: { status: 'PROCESSING', processedAt: new Date(), processedBy: getAdminId(admin) } });
        auditLog(s.id, getAdminId(admin), 'PENDING', 'PROCESSING');
        return s;
    });
    return {
        success: true,
        data: {
            settlementId: updated.id,
            status: updated.status,
            processedAt: updated.processedAt,
            amount: parseFloat(updated.amount.toString()),
        },
    };
}
async function completeSettlement(settlementId, result, admin) {
    ensureAdmin(admin);
    const settlement = await database_1.default.settlement.findUnique({ where: { id: settlementId } });
    if (!settlement)
        throw new errors_1.BadRequestError('Settlement not found');
    if (settlement.status === 'COMPLETED' || settlement.status === 'FAILED') {
        // idempotent safe return
        return {
            success: true,
            data: {
                settlementId: settlement.id,
                status: settlement.status,
                completedAt: settlement.completedAt || settlement.updatedAt,
            },
        };
    }
    if (settlement.status !== 'PROCESSING')
        throw new errors_1.BadRequestError('Settlement must be in PROCESSING state to complete');
    const partner = await database_1.default.partner.findUnique({ where: { id: settlement.partnerId } });
    if (!partner)
        throw new errors_1.BadRequestError('Partner not found');
    if (result.result === 'SUCCESS') {
        if (!result.bankReferenceId)
            throw new errors_1.BadRequestError('bankReferenceId required for SUCCESS');
        if (!partner.isActive)
            throw new errors_1.ForbiddenError('Cannot complete settlement for inactive partner');
        // Atomic update: mark completed, do NOT touch wallet or ledger
        const completed = await database_1.default.$transaction(async (tx) => {
            const s = await tx.settlement.update({ where: { id: settlementId }, data: { status: 'COMPLETED', completedAt: new Date(), completedBy: getAdminId(admin), bankReferenceId: result.bankReferenceId } });
            auditLog(s.id, getAdminId(admin), 'PROCESSING', 'COMPLETED');
            // notify stub
            notifyPartner({ event: 'settlement.completed', settlementId: s.id, amount: parseFloat(s.totalDeducted.toString()) });
            return s;
        });
        // send settlement completed email and audit log (outside transaction)
        try {
            const settlementRecord = await database_1.default.settlement.findUnique({ where: { id: settlementId }, include: { partner: true } });
            if (settlementRecord && settlementRecord.partner) {
                await email_service_1.emailService.sendSettlementCompleted({
                    email: settlementRecord.partner.email,
                    businessName: settlementRecord.partner.businessName,
                    amount: parseFloat(settlementRecord.amount.toString()),
                    fee: parseFloat(settlementRecord.fee.toString()),
                    netAmount: parseFloat(settlementRecord.netAmount ? settlementRecord.netAmount.toString() : (parseFloat(settlementRecord.amount.toString()) - parseFloat(settlementRecord.fee.toString())).toString()),
                    bankReferenceId: result.bankReferenceId || 'N/A',
                    completedAt: new Date(),
                });
            }
        }
        catch (err) {
            console.warn('Failed to send settlement completed email', err);
        }
        try {
            await auditLog_service_1.auditLogService.log({
                action: 'SETTLEMENT_COMPLETED',
                actorType: 'ADMIN',
                actorId: getAdminId(admin),
                targetType: 'SETTLEMENT',
                targetId: settlementId,
                description: `Settlement completed: ₹${completed.totalDeducted}`,
                metadata: { amount: parseFloat(completed.totalDeducted.toString()), bankReferenceId: result.bankReferenceId },
            });
        }
        catch (err) {
            console.warn('Failed to write audit log for settlement completed', err);
        }
        return {
            success: true,
            data: {
                settlementId: completed.id,
                status: completed.status,
                completedAt: completed.completedAt,
                bankReferenceId: completed.bankReferenceId,
                amountTransferred: parseFloat(completed.totalDeducted.toString()),
            },
        };
    }
    // FAILED path: refund the partner (credit back totalDeducted)
    if (result.result === 'FAILED') {
        if (!result.failureReason)
            throw new errors_1.BadRequestError('failureReason required for FAILED');
        try {
            const failed = await database_1.default.$transaction(async (tx) => {
                // Lock wallet row for update
                const wallets = await tx.$queryRawUnsafe(`SELECT id, "balance" FROM "Wallet" WHERE "id" = $1 FOR UPDATE`, settlement.walletId);
                if (!wallets || wallets.length === 0)
                    throw new errors_1.BadRequestError('Wallet not found');
                const wallet = wallets[0];
                // Update settlement status
                const s = await tx.settlement.update({ where: { id: settlementId }, data: { status: 'FAILED', completedAt: new Date(), completedBy: getAdminId(admin), failureReason: result.failureReason } });
                // Create refund ledger entry (credit)
                await tx.walletTransaction.create({
                    data: {
                        walletId: wallet.id,
                        amount: s.totalDeducted,
                        type: 'CREDIT',
                        reason: 'SETTLEMENT',
                        relatedSettlementId: s.id,
                        description: `Settlement #${s.id} failed - refund`,
                        // metadata is not a column on WalletTransaction in schema; skip
                    },
                });
                // Update wallet balance
                const newBalance = parseFloat(wallet.balance.toString()) + parseFloat(s.totalDeducted.toString());
                if (newBalance < 0)
                    throw new Error('Wallet balance would become negative');
                await tx.wallet.update({ where: { id: wallet.id }, data: { balance: newBalance } });
                auditLog(s.id, getAdminId(admin), 'PROCESSING', 'FAILED');
                notifyPartner({ event: 'settlement.failed', settlementId: s.id, amount: parseFloat(s.totalDeducted.toString()), reason: result.failureReason });
                try {
                    await auditLog_service_1.auditLogService.log({
                        action: 'SETTLEMENT_FAILED',
                        actorType: 'ADMIN',
                        actorId: getAdminId(admin),
                        targetType: 'SETTLEMENT',
                        targetId: settlementId,
                        description: `Settlement failed: ${result.failureReason}`,
                        metadata: { failureReason: result.failureReason },
                    });
                }
                catch (err) {
                    console.warn('Failed to write audit log for settlement failed', err);
                }
                return s;
            });
            return {
                success: true,
                data: {
                    settlementId: failed.id,
                    status: failed.status,
                    completedAt: failed.completedAt,
                    failureReason: failed.failureReason,
                    refundedAmount: parseFloat(failed.totalDeducted.toString()),
                    walletBalance: null,
                },
            };
        }
        catch (err) {
            console.error('Error completing failed settlement', err);
            throw err;
        }
    }
    throw new errors_1.BadRequestError('Unsupported result');
}
