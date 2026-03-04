"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = authenticatePartner;
const database_1 = __importDefault(require("../config/database"));
const crypto_1 = __importDefault(require("crypto"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const MAX_SKEW_SECONDS = 5 * 60; // 5 minutes
function parseKey(keyRaw) {
    if (!keyRaw)
        return null;
    // accept base64, hex, or raw utf8
    try {
        // try base64
        const b = Buffer.from(keyRaw, 'base64');
        if (b.length === 32)
            return b;
    }
    catch { }
    try {
        const b = Buffer.from(keyRaw, 'hex');
        if (b.length === 32)
            return b;
    }
    catch { }
    const b = Buffer.from(keyRaw, 'utf8');
    if (b.length >= 32)
        return b.slice(0, 32);
    return null;
}
function decryptSecret(encrypted) {
    if (!encrypted)
        return null;
    const keyRaw = process.env.API_SECRET_ENC_KEY;
    const key = parseKey(keyRaw ?? undefined);
    if (!key)
        throw new Error('Invalid server encryption key');
    // expected format: iv.authTag.ciphertext (all base64)
    const parts = encrypted.split('.');
    if (parts.length !== 3)
        return null;
    const iv = Buffer.from(parts[0], 'base64');
    const authTag = Buffer.from(parts[1], 'base64');
    const ciphertext = Buffer.from(parts[2], 'base64');
    const decipher = crypto_1.default.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return decrypted.toString('utf8');
}
function timingSafeCompareHex(a, b) {
    try {
        const A = Buffer.from(a, 'hex');
        const B = Buffer.from(b, 'hex');
        if (A.length !== B.length)
            return false;
        return crypto_1.default.timingSafeEqual(A, B);
    }
    catch {
        return false;
    }
}
async function authenticatePartner(req, res, next) {
    try {
        const apiKey = req.header('X-API-Key');
        const signature = req.header('X-Signature');
        const timestampRaw = req.header('X-Timestamp');
        if (!apiKey || !signature || !timestampRaw) {
            console.warn('Auth failed: missing headers');
            return res.status(401).json({ error: 'Missing authentication headers' });
        }
        const timestamp = parseInt(timestampRaw, 10);
        if (Number.isNaN(timestamp)) {
            console.warn('Auth failed: invalid timestamp');
            return res.status(401).json({ error: 'Invalid timestamp' });
        }
        const nowSec = Math.floor(Date.now() / 1000);
        if (Math.abs(nowSec - timestamp) > MAX_SKEW_SECONDS) {
            console.warn('Auth failed: timestamp out of range');
            return res.status(401).json({ error: 'Timestamp out of allowed range' });
        }
        const partner = await database_1.default.partner.findUnique({ where: { apiKey } });
        if (!partner) {
            console.warn('Auth failed: unknown apiKey');
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        if (!partner.isActive) {
            console.warn('Auth failed: partner inactive', { partnerId: partner.id });
            return res.status(403).json({ error: 'Partner inactive' });
        }
        if (!partner.apiKeyActiveFrom || partner.apiKeyActiveFrom.getTime() > Date.now()) {
            console.warn('Auth failed: key not active yet', { partnerId: partner.id });
            return res.status(403).json({ error: 'API key not active' });
        }
        if (partner.apiKeyRevokedAt) {
            console.warn('Auth failed: key revoked', { partnerId: partner.id });
            return res.status(403).json({ error: 'API key revoked' });
        }
        if (!partner.apiSecretEncrypted) {
            console.warn('Auth failed: no encrypted secret stored', { partnerId: partner.id });
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        let secret = null;
        try {
            secret = decryptSecret(partner.apiSecretEncrypted);
        }
        catch (err) {
            console.warn('Auth failed: secret decryption error', { partnerId: partner.id });
            return res.status(500).json({ error: 'Server configuration error' });
        }
        if (!secret) {
            console.warn('Auth failed: could not decrypt secret', { partnerId: partner.id });
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        // Optional: verify decrypted secret matches stored bcrypt hash for integrity
        if (partner.apiSecretHash) {
            try {
                const ok = await bcrypt_1.default.compare(secret, partner.apiSecretHash);
                if (!ok) {
                    console.warn('Auth warning: decrypted secret does not match stored hash', { partnerId: partner.id });
                }
            }
            catch {
                // ignore hashing errors
            }
        }
        // Build canonical payload: timestamp + method (UPPER) + path (no query) + bodyString
        // Use req.originalUrl (full path) not req.path (router-relative) so the signature
        // canonical string matches what the client signed against.
        const method = (req.method || '').toUpperCase();
        const path = (req.originalUrl || req.url).split('?')[0];
        // Use rawBody if available (captured by verify function in express.json()), otherwise fallback to JSON.stringify
        let bodyString = req.rawBody || '';
        if (!bodyString && req.body && Object.keys(req.body).length > 0) {
            try {
                bodyString = JSON.stringify(req.body);
            }
            catch {
                bodyString = '';
            }
        }
        const payload = `${timestamp}${method}${path}${bodyString}`;
        const expected = crypto_1.default.createHmac('sha256', secret).update(payload).digest('hex');
        const provided = signature.trim();
        const ok = timingSafeCompareHex(expected, provided);
        if (!ok) {
            console.warn('Auth failed: signature mismatch', { partnerId: partner.id });
            return res.status(401).json({ error: 'Invalid signature' });
        }
        // Attach partner to request and update lastApiCallAt
        ;
        req.partner = partner;
        try {
            await database_1.default.partner.update({ where: { id: partner.id }, data: { lastApiCallAt: new Date() } });
        }
        catch (err) {
            console.warn('Failed updating lastApiCallAt', { partnerId: partner.id });
        }
        return next();
    }
    catch (err) {
        console.error('Authentication middleware error', JSON.stringify(err), err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
