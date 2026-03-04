"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.encryptPaywiseData = encryptPaywiseData;
exports.decryptPaywiseData = decryptPaywiseData;
const crypto_1 = __importDefault(require("crypto"));
const ALGORITHM = 'aes-256-cbc';
/**
 * Encrypt data using AES-256-CBC
 */
function encryptPaywiseData(data, key, iv) {
    const plaintext = typeof data === 'object' ? JSON.stringify(data) : data;
    const keyBuffer = Buffer.from(key, 'utf8').slice(0, 32);
    const ivBuffer = Buffer.from(iv, 'utf8').slice(0, 16);
    const cipher = crypto_1.default.createCipheriv(ALGORITHM, keyBuffer, ivBuffer);
    const encrypted = Buffer.concat([
        cipher.update(plaintext, 'utf8'),
        cipher.final()
    ]);
    return encrypted.toString('base64');
}
/**
 * Decrypt data using AES-256-CBC
 */
function decryptPaywiseData(encryptedData, key, iv) {
    const keyBuffer = Buffer.from(key, 'utf8').slice(0, 32);
    const ivBuffer = Buffer.from(iv, 'utf8').slice(0, 16);
    const decipher = crypto_1.default.createDecipheriv(ALGORITHM, keyBuffer, ivBuffer);
    const decrypted = Buffer.concat([
        decipher.update(Buffer.from(encryptedData, 'base64')),
        decipher.final()
    ]);
    return decrypted.toString('utf8');
}
