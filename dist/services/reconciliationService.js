"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reconcileWallet = reconcileWallet;
exports.reconcileAllPartnerWallets = reconcileAllPartnerWallets;
exports.reconcilePlatformWallet = reconcilePlatformWallet;
const database_1 = __importDefault(require("../config/database"));
const errors_1 = require("../utils/errors");
const dateRange_1 = require("../utils/dateRange");
async function computeLedgerAggregates(walletId, fromDate, toDate) {
    // use raw SQL aggregate for performance
    const row = await database_1.default.$queryRawUnsafe(`
    SELECT
      COUNT(*) FILTER (WHERE "type" = 'CREDIT') AS credit_count,
      COUNT(*) FILTER (WHERE "type" = 'DEBIT') AS debit_count,
      COALESCE(SUM(CASE WHEN "type" = 'CREDIT' THEN amount ELSE 0 END), 0) AS total_credited,
      COALESCE(SUM(CASE WHEN "type" = 'DEBIT' THEN amount ELSE 0 END), 0) AS total_debited,
      MIN("createdAt") AS oldest_entry,
      MAX("createdAt") AS newest_entry
    FROM "WalletTransaction"
    WHERE "walletId" = $1 AND "createdAt" >= $2 AND "createdAt" <= $3
  `, walletId, fromDate, toDate);
    return {
        creditCount: Number(row.credit_count || 0),
        debitCount: Number(row.debit_count || 0),
        totalCredited: parseFloat(row.total_credited || '0'),
        totalDebited: parseFloat(row.total_debited || '0'),
        oldestEntry: row.oldest_entry ? new Date(row.oldest_entry) : null,
        newestEntry: row.newest_entry ? new Date(row.newest_entry) : null,
    };
}
function computeStatus(walletBalance, ledgerBalance) {
    if (walletBalance < 0)
        return 'CRITICAL';
    if (Math.abs(walletBalance - ledgerBalance) > 0)
        return 'MISMATCH';
    return 'OK';
}
async function reconcileWallet(walletId, options) {
    const { fromDate, toDate } = (0, dateRange_1.validateDateRange)(options?.from, options?.to);
    const wallet = await database_1.default.wallet.findUnique({ where: { id: walletId }, include: { partner: true } });
    if (!wallet)
        throw new errors_1.BadRequestError('Wallet not found');
    const aggregates = await computeLedgerAggregates(walletId, fromDate, toDate);
    const ledgerBalance = parseFloat((aggregates.totalCredited - aggregates.totalDebited).toFixed(2));
    const walletBalance = parseFloat(wallet.balance.toString());
    const difference = parseFloat((walletBalance - ledgerBalance).toFixed(2));
    const status = computeStatus(walletBalance, ledgerBalance);
    const result = {
        walletId: wallet.id,
        ownerType: wallet.type === 'PLATFORM' ? 'PLATFORM' : 'PARTNER',
        ownerId: wallet.partnerId || undefined,
        ownerName: wallet.partner?.businessName || undefined,
        walletBalance,
        ledgerBalance,
        difference,
        status,
        creditCount: aggregates.creditCount,
        debitCount: aggregates.debitCount,
        totalCredited: parseFloat(aggregates.totalCredited.toFixed(2)),
        totalDebited: parseFloat(aggregates.totalDebited.toFixed(2)),
        oldestEntry: aggregates.oldestEntry,
        newestEntry: aggregates.newestEntry,
        checkedAt: new Date(),
    };
    // Auto-fix only when requested and status is MISMATCH
    if (options?.autoFix && options.adminId) {
        if (status === 'MISMATCH') {
            // perform update
            const prevBalance = parseFloat(wallet.balance.toString());
            await database_1.default.wallet.update({ where: { id: wallet.id }, data: { balance: ledgerBalance, lastReconciledAt: new Date(), lastReconciliationStatus: status } });
            // audit log
            console.info(JSON.stringify({ action: 'RECONCILIATION_AUTOFIX', walletId: wallet.id, previousBalance: prevBalance, newBalance: ledgerBalance, adminId: options.adminId, timestamp: new Date().toISOString() }));
            // update result
            result.walletBalance = ledgerBalance;
            result.difference = parseFloat((result.walletBalance - result.ledgerBalance).toFixed(2));
            result.status = computeStatus(result.walletBalance, result.ledgerBalance);
        }
    }
    // update wallet reconciliation metadata (without fixing)
    if (!options?.autoFix) {
        await database_1.default.wallet.update({ where: { id: wallet.id }, data: { lastReconciledAt: new Date(), lastReconciliationStatus: result.status } });
    }
    return result;
}
async function reconcileAllPartnerWallets(options) {
    const wallets = await database_1.default.wallet.findMany({ where: { type: 'PARTNER' } });
    const results = [];
    for (const w of wallets) {
        // eslint-disable-next-line no-await-in-loop
        const r = await reconcileWallet(w.id, { from: options?.from, to: options?.to });
        results.push(r);
    }
    return results;
}
async function reconcilePlatformWallet(options) {
    const wallet = await database_1.default.wallet.findFirst({ where: { type: 'PLATFORM' } });
    if (!wallet)
        throw new errors_1.BadRequestError('Platform wallet not found');
    return reconcileWallet(wallet.id, options);
}
