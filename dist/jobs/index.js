"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startJobScheduler = startJobScheduler;
const node_cron_1 = __importDefault(require("node-cron"));
const expirePayments_job_1 = require("./expirePayments.job");
const cleanupInvites_job_1 = require("./cleanupInvites.job");
const autoReconciliation_job_1 = require("./autoReconciliation.job");
const settlementStatusCheck_job_1 = require("./settlementStatusCheck.job");
const JOBS_ENABLED = process.env.JOBS_ENABLED === 'true';
function startJobScheduler() {
    if (!JOBS_ENABLED) {
        console.log('⚠️  Background jobs are disabled (JOBS_ENABLED=false)');
        return;
    }
    console.log('🚀 Starting background job scheduler...\n');
    // Every 5 minutes
    node_cron_1.default.schedule('*/5 * * * *', () => {
        console.log('\n⏰ Running expirePayments job...');
        (0, expirePayments_job_1.expirePaymentsJob)();
    });
    // Daily at 3:00 AM
    node_cron_1.default.schedule('0 3 * * *', () => {
        console.log('\n⏰ Running cleanupInvites job...');
        (0, cleanupInvites_job_1.cleanupInvitesJob)();
    });
    // Daily at 2:00 AM
    node_cron_1.default.schedule('0 2 * * *', () => {
        console.log('\n⏰ Running autoReconciliation job...');
        (0, autoReconciliation_job_1.autoReconciliationJob)();
    });
    // Every hour
    node_cron_1.default.schedule('0 * * * *', () => {
        console.log('\n⏰ Running settlementStatusCheck job...');
        (0, settlementStatusCheck_job_1.settlementStatusCheckJob)();
    });
    console.log('✅ Job scheduler started with 4 tasks');
    console.log('   • expirePayments: Every 5 minutes');
    console.log('   • cleanupInvites: Daily at 03:00 AM');
    console.log('   • autoReconciliation: Daily at 02:00 AM');
    console.log('   • settlementStatusCheck: Every hour\n');
}
