"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiKeyRotationService = exports.ApiKeyRotationService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const database_1 = __importDefault(require("../config/database"));
const AppError_1 = require("../utils/AppError");
const email_service_1 = require("./email.service");
const auditLog_service_1 = require("./auditLog.service");
const crypto_2 = require("../utils/crypto");
class ApiKeyRotationService {
    constructor() {
        this.API_KEY_LENGTH = 32;
        this.API_SECRET_LENGTH = 64;
        this.SALT_ROUNDS = 12;
    }
    async rotateApiKey(partnerId, reason) {
        const partner = await database_1.default.partner.findUnique({ where: { id: partnerId } });
        if (!partner)
            throw new AppError_1.AppError(404, 'Partner not found', 'PARTNER_NOT_FOUND');
        if (partner.status !== 'ACTIVE')
            throw new AppError_1.AppError(400, 'Only active partners can rotate keys', 'INVALID_STATUS');
        if (!partner.apiKey)
            throw new AppError_1.AppError(400, 'No API key exists to rotate', 'NO_API_KEY');
        const newApiKey = this.generateApiKey();
        const newApiSecret = this.generateApiSecret();
        const newApiSecretHash = await bcrypt_1.default.hash(newApiSecret, this.SALT_ROUNDS);
        const newApiSecretEncrypted = (0, crypto_2.encryptSecret)(newApiSecret);
        const previousKeys = (partner.previousApiKeys || []).slice(-10); // Keep last 10
        previousKeys.push({
            apiKey: partner.apiKey,
            version: partner.apiKeyVersion,
            revokedAt: new Date().toISOString(),
            reason: reason || 'Manual rotation',
        });
        await database_1.default.partner.update({
            where: { id: partnerId },
            data: {
                apiKey: newApiKey,
                apiSecretHash: newApiSecretHash,
                apiSecretEncrypted: newApiSecretEncrypted,
                apiKeyVersion: partner.apiKeyVersion + 1,
                apiKeyActiveFrom: new Date(),
                apiKeyRevokedAt: null,
                previousApiKeys: previousKeys,
                lastKeyRotation: new Date(),
            },
        });
        console.log('\n🔄 API Key Rotated');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Partner ID:', partnerId);
        console.log('New API Key:', newApiKey);
        console.log('New API Secret:', newApiSecret);
        console.log('Version:', partner.apiKeyVersion + 1);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\n⚠️  IMPORTANT: Save these credentials securely!');
        console.log('⚠️  Old API key is now revoked.\n');
        // Send notification and audit log
        try {
            const updatedPartner = await database_1.default.partner.findUnique({ where: { id: partnerId } });
            if (updatedPartner) {
                await email_service_1.emailService.sendApiKeyRotated({
                    email: updatedPartner.email,
                    businessName: updatedPartner.businessName,
                    apiKey: newApiKey,
                    apiSecret: newApiSecret,
                });
                await auditLog_service_1.auditLogService.log({
                    action: 'API_KEY_ROTATED',
                    actorType: 'PARTNER',
                    actorId: partnerId,
                    targetType: 'PARTNER',
                    targetId: partnerId,
                    description: reason || 'API key rotated',
                });
            }
        }
        catch (err) {
            console.warn('Failed to send api key rotated email or audit log', err);
        }
        return {
            apiKey: newApiKey,
            apiSecret: newApiSecret,
            version: partner.apiKeyVersion + 1,
            activeFrom: new Date(),
        };
    }
    async revokeApiKey(partnerId, reason) {
        const partner = await database_1.default.partner.findUnique({ where: { id: partnerId } });
        if (!partner || !partner.apiKey)
            throw new AppError_1.AppError(404, 'Partner or API key not found', 'NOT_FOUND');
        const previousKeys = (partner.previousApiKeys || []).slice(-10);
        previousKeys.push({
            apiKey: partner.apiKey,
            version: partner.apiKeyVersion,
            revokedAt: new Date().toISOString(),
            reason,
        });
        await database_1.default.partner.update({
            where: { id: partnerId },
            data: {
                apiKeyRevokedAt: new Date(),
                previousApiKeys: previousKeys,
            },
        });
        return { success: true };
    }
    async getRotationHistory(partnerId) {
        const partner = await database_1.default.partner.findUnique({
            where: { id: partnerId },
            select: {
                apiKeyVersion: true,
                apiKeyActiveFrom: true,
                lastKeyRotation: true,
                previousApiKeys: true,
            },
        });
        if (!partner)
            throw new AppError_1.AppError(404, 'Partner not found', 'PARTNER_NOT_FOUND');
        return {
            currentVersion: partner.apiKeyVersion,
            activeFrom: partner.apiKeyActiveFrom,
            lastRotation: partner.lastKeyRotation,
            history: partner.previousApiKeys || [],
        };
    }
    generateApiKey() {
        return crypto_1.default.randomBytes(this.API_KEY_LENGTH).toString('hex');
    }
    generateApiSecret() {
        return crypto_1.default.randomBytes(this.API_SECRET_LENGTH).toString('hex');
    }
}
exports.ApiKeyRotationService = ApiKeyRotationService;
exports.apiKeyRotationService = new ApiKeyRotationService();
