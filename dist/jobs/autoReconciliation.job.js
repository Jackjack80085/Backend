"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.autoReconciliationJob = autoReconciliationJob;
const database_1 = __importDefault(require("../config/database"));
const jobLogger_1 = require("../utils/jobLogger");
const email_service_1 = require("../services/email.service");
async function autoReconciliationJob() {
    const logger = new jobLogger_1.JobLogger('autoReconciliation');
    try {
        logger.log('Starting wallet reconciliation...');
        const wallets = await database_1.default.wallet.findMany();
        let discrepancies = 0;
        let criticalIssues = 0;
        for (const wallet of wallets) {
            // Get ledger entries for this wallet
            const ledgerEntries = await database_1.default.walletTransaction.findMany({
                where: { walletId: wallet.id },
            });
            const ledgerSum = ledgerEntries.reduce((sum, entry) => sum + BigInt(entry.amount.toString()), 0n);
            if (ledgerSum !== BigInt(wallet.balance.toString())) {
                discrepancies++;
                logger.log(`⚠️  Wallet ${wallet.id} discrepancy: Balance=${wallet.balance}, Ledger Sum=${ledgerSum}`);
                if (BigInt(wallet.balance.toString()) < 0n) {
                    criticalIssues++;
                    logger.log(`🚨 CRITICAL: Wallet ${wallet.id} has negative balance`);
                }
            }
        }
        if (criticalIssues > 0) {
            logger.log(`Found ${criticalIssues} critical issues. Alerting admin...`);
            try {
                await email_service_1.emailService.sendCriticalAlert({
                    alertType: 'NEGATIVE_WALLET_BALANCE',
                    description: `${criticalIssues} wallet(s) with negative balance detected`,
                    details: { criticalIssues },
                });
            }
            catch (err) {
                logger.error('Failed to send critical alert email', err instanceof Error ? err : new Error(String(err)));
            }
        }
        logger.log(`Discrepancies found: ${discrepancies}`);
        logger.complete(wallets.length);
    }
    catch (error) {
        logger.error('Failed to reconcile wallets', error instanceof Error ? error : new Error(String(error)));
    }
}
