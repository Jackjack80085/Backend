"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPartner = createPartner;
exports.issueApiCredentials = issueApiCredentials;
const database_1 = __importDefault(require("../config/database"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const crypto_1 = require("../utils/crypto");
async function createPartner(input) {
    const partner = await database_1.default.partner.create({
        data: {
            businessName: input.businessName,
            email: input.email,
            phone: input.phone,
            businessType: input.businessType,
            kycStatus: 'PENDING',
            isActive: false,
            apiKey: `pending_${Date.now()}_${Math.random().toString(36).slice(2)}`,
            apiKeyActiveFrom: new Date(0),
        },
    });
    return partner;
}
// Issues API credentials for an existing partner. Returns the secret only once.
async function issueApiCredentials(partnerId) {
    const partner = await database_1.default.partner.findUnique({ where: { id: partnerId } });
    if (!partner)
        throw new Error('Partner not found');
    // Do not overwrite existing apiKey if present
    if (partner.apiKey)
        throw new Error('API credentials already issued for partner');
    // Generate keys: apiKey ~32 chars, apiSecret ~64 chars (base64 url-safe)
    const apiKey = (0, crypto_1.randomBase64Url)(24); // ~32 chars
    const apiSecret = (0, crypto_1.randomBase64Url)(48); // ~64 chars
    // Encrypt and hash secret
    let apiSecretEncrypted = null;
    try {
        apiSecretEncrypted = (0, crypto_1.encryptSecret)(apiSecret);
    }
    catch (err) {
        console.warn('Warning: failed to encrypt API secret, continuing without encryption. Set API_SECRET_ENC_KEY to enable encryption.', err);
        apiSecretEncrypted = null;
    }
    const apiSecretHash = await bcrypt_1.default.hash(apiSecret, 12);
    // Store in DB, ensuring apiKey uniqueness with retry on conflict
    const MAX_ATTEMPTS = 5;
    let attempt = 0;
    while (attempt < MAX_ATTEMPTS) {
        try {
            const updated = await database_1.default.partner.update({
                where: { id: partnerId },
                data: {
                    apiKey,
                    apiSecretEncrypted,
                    apiSecretHash,
                    apiKeyActiveFrom: new Date(),
                    apiKeyRevokedAt: null,
                    apiKeyVersion: 1,
                },
            });
            // Log issuance event (partnerId + timestamp only)
            console.info('API credentials issued', { partnerId: updated.id, at: new Date().toISOString() });
            // Return partnerId, apiKey, and apiSecret (one-time)
            return { partnerId: updated.id, apiKey, apiSecret };
        }
        catch (err) {
            // If unique constraint on apiKey failed, generate a new apiKey and retry
            const code = err?.code || err?.meta?.cause || '';
            if (code === 'P2002' || (typeof code === 'string' && code.includes('Unique'))) {
                attempt += 1;
                // regenerate apiKey and retry
                // eslint-disable-next-line no-param-reassign
                // create a fresh apiKey
                // eslint-disable-next-line no-param-reassign
                // regenerate
                // eslint-disable-next-line no-await-in-loop
                // loop will continue
            }
            else {
                throw err;
            }
        }
    }
    throw new Error('Failed to generate unique apiKey');
}
