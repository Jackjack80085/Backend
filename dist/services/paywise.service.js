"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaywiseService = void 0;
const axios_1 = __importDefault(require("axios"));
const paywise_config_1 = require("../config/paywise.config");
const paywiseEncryption_1 = require("../utils/paywiseEncryption");
const AppError_1 = require("../utils/AppError");
// Note: this module exports the `PaywiseService` class; consumers should
// instantiate it (or create their own singleton) to avoid module init order issues.
class PaywiseService {
    constructor() {
        this.currentToken = null;
        this.tokenRefreshPromise = null;
        this.axiosInstance = axios_1.default.create({
            baseURL: paywise_config_1.paywiseConfig.baseUrl,
            timeout: paywise_config_1.paywiseConfig.timeout,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
    async getToken() {
        const now = Math.floor(Date.now() / 1000);
        if (this.currentToken &&
            this.currentToken.expiresAt > now + paywise_config_1.paywiseConfig.tokenRefreshBuffer) {
            return this.currentToken.token;
        }
        if (this.tokenRefreshPromise) {
            return await this.tokenRefreshPromise;
        }
        this.tokenRefreshPromise = this.generateAccessToken();
        try {
            const token = await this.tokenRefreshPromise;
            return token;
        }
        finally {
            this.tokenRefreshPromise = null;
        }
    }
    async generateAccessToken() {
        try {
            const credentials = {
                apiKey: paywise_config_1.paywiseConfig.apiKey,
                secretKey: paywise_config_1.paywiseConfig.secretKey
            };
            const encryptedPayload = (0, paywiseEncryption_1.encryptPaywiseData)(credentials, paywise_config_1.paywiseConfig.apiKey, paywise_config_1.paywiseConfig.secretKey);
            const response = await this.axiosInstance.post('/v1/auth/clients/token', { payload: encryptedPayload });
            if (response.data.respCode !== 2000) {
                throw new AppError_1.AppError(500, `Paywise token generation failed: ${response.data.message || 'Unknown error'}`, 'PAYWISE_TOKEN_ERROR');
            }
            const decryptedData = (0, paywiseEncryption_1.decryptPaywiseData)(response.data.data, paywise_config_1.paywiseConfig.apiKey, paywise_config_1.paywiseConfig.secretKey);
            const tokenData = JSON.parse(decryptedData);
            const token = tokenData.token;
            const expiresAt = Math.floor(Date.now() / 1000) + paywise_config_1.paywiseConfig.tokenExpirySeconds;
            this.currentToken = { token, expiresAt };
            return token;
        }
        catch (error) {
            throw new AppError_1.AppError(500, 'Failed to authenticate with Paywise', 'PAYWISE_AUTH_ERROR', { originalError: error.message });
        }
    }
    async initiateCollection(params) {
        // Dev mock: skip real Paywise call
        if (process.env.MOCK_PAYWISE === 'true') {
            return {
                paywiseTransactionId: `mock_${params.transactionId}`,
                paymentUrl: `http://localhost:5000/mock-payment?txn=${params.transactionId}`,
                status: 'PENDING',
            };
        }
        try {
            const token = await this.getToken();
            const collectionData = {
                senderId: params.transactionId,
                requestAmount: params.amount.toFixed(2),
                vpa: paywise_config_1.paywiseConfig.merchantVPA,
                callbackUrl: params.callbackUrl || `${process.env.APP_URL}/webhooks/paywise`
            };
            const encryptedPayload = (0, paywiseEncryption_1.encryptPaywiseData)(collectionData, paywise_config_1.paywiseConfig.apiKey, paywise_config_1.paywiseConfig.secretKey);
            const response = await this.axiosInstance.post('/collection/v1/initiate', { payload: encryptedPayload }, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.data.respCode !== 2000) {
                throw new AppError_1.AppError(500, `Paywise collection failed: ${response.data.message || 'Unknown error'}`, 'PAYWISE_COLLECTION_ERROR', { respCode: response.data.respCode });
            }
            const decryptedData = (0, paywiseEncryption_1.decryptPaywiseData)(response.data.data, paywise_config_1.paywiseConfig.apiKey, paywise_config_1.paywiseConfig.secretKey);
            const result = JSON.parse(decryptedData);
            return {
                paywiseTransactionId: result.transactionId || result.txnId || result.id,
                paymentUrl: result.paymentUrl || result.paymentLink,
                qrCode: result.qrCode,
                upiIntent: result.upiIntent,
                status: result.status || 'PENDING'
            };
        }
        catch (error) {
            if (error instanceof AppError_1.AppError) {
                throw error;
            }
            throw new AppError_1.AppError(500, 'Failed to initiate payment with Paywise', 'PAYWISE_COLLECTION_ERROR', { originalError: error.message });
        }
    }
    async checkCollectionStatus(params) {
        try {
            const token = await this.getToken();
            const statusData = {
                senderId: params.senderId
            };
            const encryptedPayload = (0, paywiseEncryption_1.encryptPaywiseData)(statusData, paywise_config_1.paywiseConfig.apiKey, paywise_config_1.paywiseConfig.secretKey);
            const response = await this.axiosInstance.post('/collection/v1/status', { payload: encryptedPayload }, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.data.respCode !== 2000) {
                throw new AppError_1.AppError(500, 'Paywise status check failed', 'PAYWISE_STATUS_ERROR');
            }
            const decryptedData = (0, paywiseEncryption_1.decryptPaywiseData)(response.data.data, paywise_config_1.paywiseConfig.apiKey, paywise_config_1.paywiseConfig.secretKey);
            const result = JSON.parse(decryptedData);
            return {
                status: this.normalizeStatus(result.status),
                paywiseTransactionId: result.transactionId || result.txnId,
                amount: result.amount ? parseFloat(result.amount) : undefined,
                paymentMethod: result.paymentMethod || result.paymentMode
            };
        }
        catch (error) {
            throw new AppError_1.AppError(500, 'Failed to check payment status', 'PAYWISE_STATUS_ERROR', { originalError: error.message });
        }
    }
    verifyWebhookSignature(payload, signature) {
        try {
            const crypto = require('crypto');
            const expectedSignature = crypto
                .createHmac('sha256', paywise_config_1.paywiseConfig.webhookSecret)
                .update(JSON.stringify(payload))
                .digest('hex');
            return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
        }
        catch (error) {
            return false;
        }
    }
    decryptWebhookPayload(encryptedData) {
        try {
            const decrypted = (0, paywiseEncryption_1.decryptPaywiseData)(encryptedData, paywise_config_1.paywiseConfig.apiKey, paywise_config_1.paywiseConfig.secretKey);
            return JSON.parse(decrypted);
        }
        catch (error) {
            throw new AppError_1.AppError(400, 'Invalid webhook payload', 'INVALID_WEBHOOK');
        }
    }
    normalizeStatus(paywiseStatus) {
        const status = paywiseStatus.toUpperCase();
        if (status === 'SUCCESS' || status === 'COMPLETED' || status === 'SETTLED') {
            return 'SUCCESS';
        }
        if (status === 'FAILED' || status === 'DECLINED' || status === 'REJECTED') {
            return 'FAILED';
        }
        return 'PENDING';
    }
}
exports.PaywiseService = PaywiseService;
