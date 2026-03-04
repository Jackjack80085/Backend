"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.encryptSecret = encryptSecret;
exports.randomBase64Url = randomBase64Url;
const crypto_1 = __importDefault(require("crypto"));
function parseKey(keyRaw) {
    if (!keyRaw)
        throw new Error('Missing encryption key');
    // try base64
    try {
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
    throw new Error('Encryption key must be 32 bytes');
}
function encryptSecret(secret) {
    const keyRaw = process.env.API_SECRET_ENC_KEY;
    const key = parseKey(keyRaw);
    const iv = crypto_1.default.randomBytes(12); // recommended IV size for GCM
    const cipher = crypto_1.default.createCipheriv('aes-256-gcm', key, iv);
    const ciphertext = Buffer.concat([cipher.update(Buffer.from(secret, 'utf8')), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return `${iv.toString('base64')}.${authTag.toString('base64')}.${ciphertext.toString('base64')}`;
}
function randomBase64Url(bytes) {
    const b = crypto_1.default.randomBytes(bytes);
    return b.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
