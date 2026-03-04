"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const crypto_1 = __importDefault(require("crypto"));
const database_1 = __importDefault(require("../config/database"));
// ---- Partner Webhook Service ----
class PartnerWebhookService {
    constructor() {
        this.maxRetries = 3;
        this.timeoutMs = 10000;
    }
    /**
     * Notify partner about a payment status change.
     */
    async notifyPaymentStatus(transaction) {
        const partner = transaction.partner;
        if (!partner?.webhookUrl) {
            console.info('[partnerWebhook] Partner has no webhookUrl', { partnerId: transaction.partnerId });
            return;
        }
        const payload = {
            event: transaction.status === 'SUCCESS' ? 'payment.success' : 'payment.failed',
            transaction_id: transaction.id,
            partner_id: transaction.partnerId,
            user_reference: transaction.userReference,
            amount: parseFloat(transaction.amount.toString()),
            commission: parseFloat(transaction.commission.toString()),
            net_amount: parseFloat(transaction.netAmount.toString()),
            payment_method: transaction.paymentMethod,
            status: transaction.status,
            timestamp: transaction.completedAt?.toISOString() ?? new Date().toISOString(),
            metadata: transaction.metadata,
        };
        const signature = this.generateSignature(payload, partner.apiSecretEncrypted || '');
        await this.deliverWebhook({
            url: partner.webhookUrl,
            payload,
            signature,
            partnerId: transaction.partnerId,
            transactionId: transaction.id,
        });
    }
    /**
     * Notify partner about a settlement status change.
     */
    async notifySettlementStatus(params) {
        const payload = {
            event: params.status === 'COMPLETED' ? 'settlement.completed' : 'settlement.failed',
            settlement_id: params.settlementId,
            partner_id: params.partnerId,
            amount: params.amount,
            status: params.status,
            reason: params.reason,
            timestamp: new Date().toISOString(),
        };
        const signature = this.generateSignature(payload, params.apiSecret);
        await this.deliverWebhook({
            url: params.webhookUrl,
            payload,
            signature,
            partnerId: params.partnerId,
            settlementId: params.settlementId,
        });
    }
    /**
     * Deliver a webhook with retry + exponential backoff.
     * Logs every attempt to `WebhookLog`.
     */
    async deliverWebhook(params) {
        let attempt = 0;
        while (attempt < this.maxRetries) {
            attempt++;
            try {
                const response = await axios_1.default.post(params.url, params.payload, {
                    headers: {
                        'X-Paycher-Signature': params.signature,
                        'X-Paycher-Event': params.payload.event,
                        'Content-Type': 'application/json',
                    },
                    timeout: this.timeoutMs,
                });
                await this.logAttempt({
                    ...params,
                    attempt,
                    success: true,
                    responseStatus: response.status,
                    responseBody: response.data,
                });
                console.info('[partnerWebhook] delivered', {
                    partnerId: params.partnerId,
                    transactionId: params.transactionId,
                    attempt,
                });
                return; // success
            }
            catch (err) {
                await this.logAttempt({
                    ...params,
                    attempt,
                    success: false,
                    responseStatus: err.response?.status ?? null,
                    responseBody: err.response?.data ?? null,
                    errorMessage: err.message,
                });
                if (attempt < this.maxRetries) {
                    await this.sleep(Math.pow(2, attempt) * 1000); // 2s, 4s
                }
                else {
                    console.error('[partnerWebhook] failed after retries', {
                        partnerId: params.partnerId,
                        transactionId: params.transactionId,
                        error: err.message,
                    });
                }
            }
        }
    }
    // ---- helpers ----
    generateSignature(payload, secret) {
        return crypto_1.default
            .createHmac('sha256', secret)
            .update(JSON.stringify(payload))
            .digest('hex');
    }
    async logAttempt(p) {
        try {
            await database_1.default.webhookLog.create({
                data: {
                    partnerId: p.partnerId,
                    transactionId: p.transactionId ?? null,
                    settlementId: p.settlementId ?? null,
                    event: p.payload.event,
                    url: p.url,
                    payload: p.payload,
                    responseStatus: p.responseStatus ?? null,
                    responseBody: p.responseBody ?? null,
                    errorMessage: p.errorMessage ?? null,
                    attempt: p.attempt,
                    success: p.success,
                },
            });
        }
        catch (logErr) {
            console.error('[partnerWebhook] failed to persist WebhookLog', logErr);
        }
    }
    sleep(ms) {
        return new Promise((r) => setTimeout(r, ms));
    }
}
const partnerWebhookService = new PartnerWebhookService();
exports.default = partnerWebhookService;
