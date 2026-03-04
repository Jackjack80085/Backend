"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paywiseConfig = void 0;
/**
 * Paywise payment gateway configuration.
 * All values are drawn from env vars; leave empty until the client
 * provides production credentials.
 */
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.paywiseConfig = {
    // Use PAYWIZE_* env vars per integration spec
    apiKey: process.env.PAYWIZE_API_KEY, // 32 chars
    secretKey: process.env.PAYWIZE_SECRET_KEY, // 16 chars (IV)
    merchantVPA: process.env.PAYWIZE_MERCHANT_VPA,
    // Environment URLs
    baseUrl: process.env.PAYWIZE_BASE_URL || 'https://sandbox.merchant.paywize.in/api/',
    // Timeouts and token settings
    timeout: 30000,
    tokenExpirySeconds: 300, // 5 minutes
    tokenRefreshBuffer: 30, // refresh 30s before expiry
    // Webhook HMAC secret
    webhookSecret: process.env.PAYWIZE_WEBHOOK_SECRET,
};
