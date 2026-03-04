"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupInvitesJob = cleanupInvitesJob;
const database_1 = __importDefault(require("../config/database"));
const jobLogger_1 = require("../utils/jobLogger");
async function cleanupInvitesJob() {
    const logger = new jobLogger_1.JobLogger('cleanupInvites');
    try {
        logger.log('Cleaning up expired partner invitations...');
        const expiredPartners = await database_1.default.partner.findMany({
            where: {
                status: 'INVITED',
                inviteExpiresAt: { lt: new Date() },
            },
            select: { id: true, email: true },
        });
        if (expiredPartners.length === 0) {
            logger.log('No expired invitations found');
            logger.complete(0);
            return;
        }
        logger.log(`Found ${expiredPartners.length} expired invitations. Deleting...`);
        const deletedIds = expiredPartners.map((p) => p.id);
        // Delete related KYC documents first
        await database_1.default.kYCDocument.deleteMany({
            where: { partnerId: { in: deletedIds } },
        });
        // Delete partners
        await database_1.default.partner.deleteMany({
            where: { id: { in: deletedIds } },
        });
        logger.complete(deletedIds.length);
    }
    catch (error) {
        logger.error('Failed to cleanup invites', error instanceof Error ? error : new Error(String(error)));
    }
}
