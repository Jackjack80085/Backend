"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.expirePaymentsJob = expirePaymentsJob;
const database_1 = __importDefault(require("../config/database"));
const jobLogger_1 = require("../utils/jobLogger");
const PAYMENT_EXPIRY_MINUTES = parseInt(process.env.PAYMENT_EXPIRY_MINUTES || '30');
async function expirePaymentsJob() {
    const logger = new jobLogger_1.JobLogger('expirePayments');
    try {
        logger.log(`Checking for payments expired after ${PAYMENT_EXPIRY_MINUTES} minutes...`);
        const expiryThreshold = new Date(Date.now() - PAYMENT_EXPIRY_MINUTES * 60 * 1000);
        const expiredTransactions = await database_1.default.transaction.updateMany({
            where: {
                status: 'PENDING',
                createdAt: { lt: expiryThreshold },
            },
            data: {
                status: 'FAILED',
                failureReason: 'Transaction expired',
            },
        });
        logger.complete(expiredTransactions.count);
    }
    catch (error) {
        logger.error('Failed to expire payments', error instanceof Error ? error : new Error(String(error)));
    }
}
