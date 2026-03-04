"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.settlementStatusCheckJob = settlementStatusCheckJob;
const database_1 = __importDefault(require("../config/database"));
const jobLogger_1 = require("../utils/jobLogger");
const SETTLEMENT_CHECK_HOURS = parseInt(process.env.SETTLEMENT_CHECK_HOURS || '48');
async function settlementStatusCheckJob() {
    const logger = new jobLogger_1.JobLogger('settlementStatusCheck');
    try {
        logger.log(`Checking for settlements pending >$$ hours...`);
        const stallThreshold = new Date(Date.now() - SETTLEMENT_CHECK_HOURS * 60 * 60 * 1000);
        const stalledSettlements = await database_1.default.settlement.findMany({
            where: {
                status: 'PROCESSING',
                createdAt: { lt: stallThreshold },
            },
            select: { id: true, partnerId: true, amount: true, createdAt: true },
        });
        if (stalledSettlements.length === 0) {
            logger.log('No stalled settlements found');
            logger.complete(0);
            return;
        }
        logger.log(`Found ${stalledSettlements.length} settlements stalled >$SETTLEMENT_CHECK_HOURS hours`);
        for (const settlement of stalledSettlements) {
            logger.log(`⚠️  Settlement ${settlement.id} (Partner: ${settlement.partnerId}) - Amount: ${settlement.amount}`);
        }
        // Could integrate email alert here
        logger.complete(stalledSettlements.length);
    }
    catch (error) {
        logger.error('Failed to check settlement status', error instanceof Error ? error : new Error(String(error)));
    }
}
